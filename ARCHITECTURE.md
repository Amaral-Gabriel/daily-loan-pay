# Daily Loan Pay - Arquitetura do Sistema

## 1. Visão Geral da Arquitetura

O **Daily Loan Pay** é um sistema web full-stack para gerenciamento de empréstimos com pagamento diário via PIX. A arquitetura segue o padrão **tRPC** com separação clara entre frontend (React) e backend (Express), utilizando um banco de dados MySQL para persistência.

### Stack Tecnológica

| Camada | Tecnologia | Versão |
|--------|-----------|--------|
| **Frontend** | React 19 + Vite | 19.x |
| **Styling** | Tailwind CSS 4 | 4.x |
| **Backend** | Express 4 | 4.x |
| **RPC** | tRPC 11 | 11.x |
| **Database** | MySQL / TiDB | - |
| **ORM** | Drizzle ORM | Latest |
| **Auth** | Manus OAuth + JWT | - |
| **Validação** | Zod | Latest |

---

## 2. Modelo de Dados (Database Schema)

### 2.1 Tabela: `users` (Usuários)

Armazena informações dos clientes do banco que podem fazer empréstimos.

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  openId VARCHAR(64) UNIQUE NOT NULL,          -- Identificador do Manus OAuth
  name TEXT,                                    -- Nome completo
  email VARCHAR(320),                           -- Email
  cpf VARCHAR(14) UNIQUE,                       -- CPF (opcional, para identificação)
  phone VARCHAR(20),                            -- Telefone (opcional)
  loginMethod VARCHAR(64),                      -- Método de login
  role ENUM('user', 'admin') DEFAULT 'user',   -- Papel do usuário
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  lastSignedIn TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Campos:**
- `openId`: Identificador único do Manus OAuth (imutável)
- `name`: Nome do usuário
- `email`: Email para contato
- `cpf`: CPF para identificação (opcional)
- `phone`: Telefone para contato (opcional)
- `role`: Define se é usuário comum ou administrador

---

### 2.2 Tabela: `loans` (Empréstimos)

Armazena os empréstimos ativos ou finalizados dos usuários.

```sql
CREATE TABLE loans (
  id INT PRIMARY KEY AUTO_INCREMENT,
  userId INT NOT NULL,                         -- Foreign key para users
  totalAmount DECIMAL(10, 2) NOT NULL,         -- Valor total do empréstimo
  dailyAmount DECIMAL(10, 2) NOT NULL,         -- Valor da diária (pagamento diário esperado)
  paidAmount DECIMAL(10, 2) DEFAULT 0,         -- Total já pago
  remainingAmount DECIMAL(10, 2) NOT NULL,     -- Valor restante
  status ENUM('active', 'paid_off', 'overdue') DEFAULT 'active', -- Status do empréstimo
  startDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expectedEndDate DATE,                        -- Data esperada de quitação
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

**Campos:**
- `userId`: Referência ao usuário proprietário do empréstimo
- `totalAmount`: Valor total do empréstimo
- `dailyAmount`: Valor esperado de pagamento por dia
- `paidAmount`: Total pago até o momento
- `remainingAmount`: Saldo devedor
- `status`: Estado do empréstimo (ativo, quitado, atrasado)
- `startDate`: Data de início do empréstimo
- `expectedEndDate`: Data prevista para quitação

---

### 2.3 Tabela: `payments` (Histórico de Pagamentos)

Rastreia todos os pagamentos realizados para auditoria e análise.

```sql
CREATE TABLE payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  loanId INT NOT NULL,                         -- Foreign key para loans
  userId INT NOT NULL,                         -- Foreign key para users
  amount DECIMAL(10, 2) NOT NULL,              -- Valor pago
  pixKey VARCHAR(255),                         -- Chave PIX utilizada
  pixQrCode TEXT,                              -- QR Code em base64 ou URL
  pixTransactionId VARCHAR(255) UNIQUE,        -- ID da transação PIX (do banco)
  status ENUM('pending', 'confirmed', 'failed') DEFAULT 'pending',
  paymentDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  confirmedAt TIMESTAMP NULL,                  -- Quando o pagamento foi confirmado
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (loanId) REFERENCES loans(id) ON DELETE CASCADE,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
);
```

**Campos:**
- `loanId`: Referência ao empréstimo
- `userId`: Referência ao usuário
- `amount`: Valor pago
- `pixKey`: Chave PIX utilizada (pode ser dinâmica ou estática)
- `pixQrCode`: QR Code gerado para o pagamento
- `pixTransactionId`: ID da transação retornado pelo provedor PIX
- `status`: Estado do pagamento (pendente, confirmado, falhou)
- `confirmedAt`: Timestamp quando o webhook confirmou o pagamento

---

### 2.4 Tabela: `daily_payments` (Controle de Pagamentos Diários)

Controla quais dias já tiveram pagamento gerado para cada empréstimo.

```sql
CREATE TABLE daily_payments (
  id INT PRIMARY KEY AUTO_INCREMENT,
  loanId INT NOT NULL,                         -- Foreign key para loans
  paymentDate DATE NOT NULL,                   -- Data do pagamento
  pixKey VARCHAR(255),                         -- Chave PIX gerada
  pixQrCode TEXT,                              -- QR Code gerado
  pixTransactionId VARCHAR(255),               -- ID da transação (quando confirmado)
  status ENUM('pending', 'confirmed', 'expired') DEFAULT 'pending',
  expiresAt TIMESTAMP,                         -- Quando o QR Code expira
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY unique_daily_payment (loanId, paymentDate),
  FOREIGN KEY (loanId) REFERENCES loans(id) ON DELETE CASCADE
);
```

**Campos:**
- `loanId`: Referência ao empréstimo
- `paymentDate`: Data para a qual o pagamento foi gerado
- `pixKey`: Chave PIX dinâmica gerada
- `pixQrCode`: QR Code em base64 ou URL
- `pixTransactionId`: ID da transação quando confirmado
- `status`: Estado (pendente, confirmado, expirado)
- `expiresAt`: Quando o QR Code deixa de ser válido

---

## 3. Fluxos Principais

### 3.1 Fluxo de Autenticação

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário clica em "Fazer Login"                           │
│    → Redireciona para Manus OAuth Portal                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Usuário faz login no Manus OAuth                         │
│    → Manus retorna código de autorização                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Frontend redireciona para /api/oauth/callback            │
│    → Backend troca código por token JWT                     │
│    → Cria/atualiza usuário no banco de dados                │
│    → Define session cookie                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend redireciona para dashboard                       │
│    → Frontend agora tem acesso a rotas protegidas           │
└─────────────────────────────────────────────────────────────┘
```

**Endpoints:**
- `GET /api/oauth/callback?code=...` - Callback do OAuth (automático)
- `GET /api/trpc/auth.me` - Obter usuário atual
- `POST /api/trpc/auth.logout` - Fazer logout

---

### 3.2 Fluxo de Empréstimo

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Admin cria novo empréstimo para usuário                  │
│    POST /api/trpc/loans.create                              │
│    Body: {                                                  │
│      userId, totalAmount, dailyAmount                       │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Sistema calcula:                                         │
│    - remainingAmount = totalAmount                          │
│    - expectedEndDate = startDate + (totalAmount/dailyAmount)│
│    - Cria registro em loans com status='active'             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Usuário visualiza empréstimos                            │
│    GET /api/trpc/loans.list                                 │
│    → Retorna lista de empréstimos ativos                    │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Usuário clica em empréstimo para ver detalhes            │
│    GET /api/trpc/loans.getById                              │
│    → Retorna detalhes completos do empréstimo               │
└─────────────────────────────────────────────────────────────┘
```

**Endpoints:**
- `POST /api/trpc/loans.create` - Criar novo empréstimo
- `GET /api/trpc/loans.list` - Listar empréstimos do usuário
- `GET /api/trpc/loans.getById` - Obter detalhes de um empréstimo

---

### 3.3 Fluxo de Pagamento PIX Diário

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário clica "Gerar Pagamento de Hoje"                  │
│    POST /api/trpc/payments.generateDaily                    │
│    Body: { loanId }                                         │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Backend verifica:                                        │
│    - Se já existe pagamento para hoje                       │
│    - Se empréstimo está ativo                               │
│    - Se valor restante > 0                                  │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend chama API PIX (Gerencianet/similar)              │
│    → Cria cobrança dinâmica com valor da diária             │
│    → Recebe pixKey e QR Code                                │
│    → Salva em daily_payments com status='pending'           │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Frontend exibe:                                          │
│    - QR Code para escanear                                  │
│    - Chave PIX copia e cola                                 │
│    - Valor da diária                                        │
│    - Botão "Copiar Chave" e "Atualizar Status"              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Usuário realiza pagamento via PIX                        │
│    (em seu banco ou app de pagamento)                       │
└─────────────────────────────────────────────────────────────┘
```

**Endpoints:**
- `POST /api/trpc/payments.generateDaily` - Gerar cobrança PIX do dia
- `GET /api/trpc/payments.getDailyStatus` - Verificar status do pagamento

---

### 3.4 Fluxo de Webhook (Confirmação de Pagamento)

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Usuário realiza pagamento via PIX                        │
│    → Banco processa a transação                             │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. Provedor PIX envia webhook para backend                  │
│    POST /api/webhooks/pix-confirmation                      │
│    Body: {                                                  │
│      pixTransactionId, amount, status, timestamp            │
│    }                                                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. Backend valida webhook:                                  │
│    - Verifica assinatura/hash                               │
│    - Busca daily_payment pelo pixTransactionId              │
│    - Verifica se amount está correto                        │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. Backend atualiza registros:                              │
│    - daily_payments.status = 'confirmed'                    │
│    - loans.paidAmount += amount                             │
│    - loans.remainingAmount -= amount                        │
│    - Se remainingAmount == 0: loans.status = 'paid_off'     │
│    - Cria registro em payments para auditoria               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. Frontend notifica usuário (via polling/websocket):       │
│    - "Pagamento confirmado!"                                │
│    - Atualiza saldo restante em tempo real                  │
│    - Se quitado: mostra mensagem de sucesso                 │
└─────────────────────────────────────────────────────────────┘
```

**Endpoints:**
- `POST /api/webhooks/pix-confirmation` - Webhook do provedor PIX (sem autenticação)
- `GET /api/trpc/payments.checkStatus` - Polling para verificar status (com autenticação)

---

## 4. Integração PIX

### 4.1 Provedores Suportados

Para este projeto, recomendamos um dos seguintes provedores:

| Provedor | Vantagens | Desvantagens |
|----------|-----------|--------------|
| **Gerencianet** | API robusta, suporte completo a PIX dinâmico, webhooks confiáveis | Requer aprovação |
| **Banco do Brasil** | Integração direta com PIX, baixas taxas | API mais complexa |
| **Mercado Pago** | Fácil integração, documentação clara | Taxas mais altas |
| **Simulação Local** | Sem custos, ótimo para desenvolvimento | Não funciona em produção |

### 4.2 Fluxo de Integração PIX

```
┌─────────────────────────────────────────────────────────────┐
│ Backend (Node.js + Express)                                 │
│                                                             │
│ 1. Recebe requisição: POST /api/trpc/payments.generateDaily │
│ 2. Valida dados do empréstimo                               │
│ 3. Chama API do provedor PIX                                │
│    - Envia: valor, descrição, chave PIX, webhook URL       │
│    - Recebe: pixKey, qrCode, transactionId                 │
│ 4. Salva em daily_payments                                  │
│ 5. Retorna QR Code e chave PIX para frontend                │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend (React)                                            │
│                                                             │
│ 1. Exibe QR Code (usando qrcode.react)                      │
│ 2. Exibe chave PIX copia e cola                             │
│ 3. Inicia polling para verificar status a cada 5s           │
│    - GET /api/trpc/payments.getDailyStatus                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Usuário (App de Banco)                                      │
│                                                             │
│ 1. Escaneia QR Code ou copia chave PIX                      │
│ 2. Realiza pagamento via PIX                                │
│ 3. Banco processa transação                                 │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Provedor PIX                                                │
│                                                             │
│ 1. Recebe confirmação de pagamento                          │
│ 2. Envia webhook para backend                               │
│    POST /api/webhooks/pix-confirmation                      │
│    Body: { pixTransactionId, amount, status, ... }          │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Backend (Webhook Handler)                                   │
│                                                             │
│ 1. Valida assinatura do webhook                             │
│ 2. Busca daily_payment pelo transactionId                   │
│ 3. Atualiza status para 'confirmed'                         │
│ 4. Atualiza loan (paidAmount, remainingAmount)              │
│ 5. Retorna 200 OK ao provedor                               │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│ Frontend (Polling)                                          │
│                                                             │
│ 1. Detecta mudança de status                                │
│ 2. Para polling                                             │
│ 3. Mostra notificação "Pagamento confirmado!"               │
│ 4. Atualiza saldo restante                                  │
└─────────────────────────────────────────────────────────────┘
```

### 4.3 Exemplo de Requisição PIX (Gerencianet)

```javascript
// Backend: Gerar cobrança PIX dinâmica
const pixPayload = {
  calendario: {
    expiracao: 3600 // 1 hora
  },
  devedor: {
    cpf: userCpf,
    nome: userName
  },
  valor: {
    original: dailyAmount.toString()
  },
  chave: "chave-pix-banco@banco.com.br",
  solicitacaoPagador: `Pagamento diária do empréstimo #${loanId}`
};

const response = await axios.post(
  'https://api.gerencianet.com.br/v2/cob',
  pixPayload,
  {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  }
);

// Resposta:
// {
//   "loc": {
//     "id": 123456,
//     "location": "https://brcode.itau.com.br/..."
//   },
//   "txid": "550e8400e29b41d4a716446655440000",
//   "brcode": "00020126580014br.gov.bcb.brcode...",
//   "qrCode": "00020126580014br.gov.bcb.brcode..."
// }
```

---

## 5. Segurança

### 5.1 Autenticação e Autorização

- **JWT**: Tokens assinados com `JWT_SECRET` para sessões
- **Manus OAuth**: Integração nativa para login seguro
- **Protected Procedures**: Rotas sensíveis exigem `protectedProcedure`
- **Role-based Access**: Admins podem criar empréstimos, usuários apenas visualizam

### 5.2 Validação de Dados

- Todas as entradas são validadas com **Zod**
- CPF, email, telefone são validados antes de salvar
- Valores monetários são validados como números positivos

### 5.3 Webhook Security

- Webhooks do PIX devem ser validados com assinatura HMAC
- Verificar timestamp para evitar replay attacks
- Implementar idempotência (mesmo transactionId não processa 2x)

### 5.4 Criptografia

- Senhas não são armazenadas (OAuth do Manus)
- CPF pode ser criptografado em repouso se necessário
- HTTPS obrigatório em produção

---

## 6. Estrutura de Diretórios

```
daily-loan-pay/
├── client/                          # Frontend (React + Vite)
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Home.tsx            # Dashboard principal
│   │   │   ├── Login.tsx           # Tela de login
│   │   │   ├── LoansList.tsx       # Lista de empréstimos
│   │   │   ├── LoanDetail.tsx      # Detalhes do empréstimo
│   │   │   └── PaymentQR.tsx       # Exibição de QR Code PIX
│   │   ├── components/
│   │   │   ├── DashboardLayout.tsx # Layout principal
│   │   │   ├── QRCodeDisplay.tsx   # Componente de QR Code
│   │   │   └── PaymentStatus.tsx   # Status do pagamento
│   │   ├── lib/
│   │   │   └── trpc.ts             # Cliente tRPC
│   │   └── App.tsx                 # Roteamento
│   └── index.html
├── server/                          # Backend (Express + tRPC)
│   ├── routers.ts                  # Rotas tRPC principais
│   ├── db.ts                       # Helpers de banco de dados
│   ├── routers/
│   │   ├── auth.ts                 # Rotas de autenticação
│   │   ├── loans.ts                # Rotas de empréstimos
│   │   ├── payments.ts             # Rotas de pagamentos
│   │   └── webhooks.ts             # Webhook do PIX
│   └── _core/                      # Framework (não editar)
├── drizzle/
│   ├── schema.ts                   # Definição das tabelas
│   └── migrations/                 # Arquivos de migração
├── shared/                         # Código compartilhado
│   └── const.ts
├── ARCHITECTURE.md                 # Este arquivo
├── DATABASE.md                     # Documentação do banco
└── PIX_INTEGRATION.md             # Guia de integração PIX
```

---

## 7. Próximos Passos

1. **Implementar Schema do Banco** (`drizzle/schema.ts`)
2. **Criar Helpers de Consulta** (`server/db.ts`)
3. **Implementar Rotas de Autenticação** (`server/routers/auth.ts`)
4. **Implementar Rotas de Empréstimos** (`server/routers/loans.ts`)
5. **Implementar Rotas de Pagamentos** (`server/routers/payments.ts`)
6. **Integrar API PIX** (Gerencianet ou simulação)
7. **Criar Frontend** (React components)
8. **Testar Fluxos Completos**
9. **Documentar e Publicar**

---

**Versão**: 1.0  
**Última atualização**: 2025-11-26  
**Autor**: Manus AI
