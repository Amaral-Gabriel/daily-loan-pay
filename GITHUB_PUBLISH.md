# Publicando Daily Loan Pay no GitHub

Este guia mostra como publicar seu projeto no GitHub de forma segura e profissional.

## Pré-requisitos

1. **Conta GitHub**: Crie uma em [github.com](https://github.com) se não tiver
2. **Git instalado**: Verifique com `git --version`
3. **Acesso SSH ou HTTPS**: Configure uma das duas opções

## Opção 1: Usando HTTPS (Mais Fácil)

### Passo 1: Criar um novo repositório no GitHub

1. Acesse [github.com/new](https://github.com/new)
2. Preencha os dados:
   - **Repository name**: `daily-loan-pay`
   - **Description**: "Sistema web para gerenciamento de empréstimos com pagamento diário via PIX"
   - **Visibility**: Escolha `Public` (aberto) ou `Private` (privado)
   - **Initialize repository**: Deixe desmarcado (vamos usar nosso código local)
3. Clique em "Create repository"

### Passo 2: Configurar Git localmente

```bash
cd /home/ubuntu/daily-loan-pay

# Configurar seu nome e email (se não tiver feito)
git config --global user.name "Seu Nome"
git config --global user.email "seu.email@example.com"

# Inicializar repositório Git (se não estiver inicializado)
git init

# Adicionar todos os arquivos
git add .

# Criar primeiro commit
git commit -m "Initial commit: Daily Loan Pay system with PIX integration"
```

### Passo 3: Conectar ao repositório remoto

Após criar o repositório no GitHub, você verá um comando como este. Copie e execute:

```bash
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/daily-loan-pay.git
git push -u origin main
```

**Substitua `SEU_USUARIO` pelo seu nome de usuário do GitHub.**

### Passo 4: Autenticar com Token (HTTPS)

Quando solicitado a senha, use um **Personal Access Token** em vez de senha:

1. Acesse [github.com/settings/tokens](https://github.com/settings/tokens)
2. Clique em "Generate new token" → "Generate new token (classic)"
3. Configure:
   - **Token name**: `daily-loan-pay-token`
   - **Expiration**: 90 days (ou sua preferência)
   - **Scopes**: Selecione `repo` (acesso completo a repositórios)
4. Clique em "Generate token"
5. **Copie o token** (você não poderá vê-lo novamente)
6. Use este token como senha quando o Git solicitar

## Opção 2: Usando SSH (Mais Seguro)

### Passo 1: Gerar chave SSH

```bash
ssh-keygen -t ed25519 -C "seu.email@example.com"
```

Pressione Enter para aceitar o local padrão e defina uma senha (ou deixe em branco).

### Passo 2: Adicionar chave SSH ao GitHub

```bash
# Copiar a chave pública
cat ~/.ssh/id_ed25519.pub
```

1. Acesse [github.com/settings/keys](https://github.com/settings/keys)
2. Clique em "New SSH key"
3. Cole a chave pública
4. Clique em "Add SSH key"

### Passo 3: Testar conexão SSH

```bash
ssh -T git@github.com
```

Você deve ver uma mensagem como: "Hi SEU_USUARIO! You've successfully authenticated..."

### Passo 4: Criar repositório e fazer push

```bash
cd /home/ubuntu/daily-loan-pay

git init
git add .
git commit -m "Initial commit: Daily Loan Pay system with PIX integration"

git branch -M main
git remote add origin git@github.com:SEU_USUARIO/daily-loan-pay.git
git push -u origin main
```

## Arquivos Importantes para o GitHub

Certifique-se de que estes arquivos estão no repositório:

### ✅ Incluir

- `README.md` - Descrição do projeto
- `SETUP_GUIDE.md` - Guia de instalação
- `ARCHITECTURE.md` - Arquitetura do sistema
- `PIX_INTEGRATION.md` - Guia de integração PIX
- `package.json` - Dependências
- `drizzle/schema.ts` - Schema do banco
- `server/` - Código do backend
- `client/` - Código do frontend
- `.gitignore` - Arquivos a ignorar
- `LICENSE` - Licença do projeto

### ❌ NÃO Incluir

- `node_modules/` - Instalado automaticamente com `pnpm install`
- `.env` - Variáveis de ambiente (segurança)
- `.env.local` - Configurações locais
- `dist/` - Arquivos compilados
- `.DS_Store` - Arquivos do macOS
- `*.log` - Arquivos de log

## Criar .gitignore

Se não existir, crie um arquivo `.gitignore`:

```bash
cat > /home/ubuntu/daily-loan-pay/.gitignore << 'EOF'
# Dependencies
node_modules/
pnpm-lock.yaml
yarn.lock
package-lock.json

# Environment variables
.env
.env.local
.env.*.local

# Build outputs
dist/
build/
.next/
out/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~
.DS_Store

# Logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# Testing
coverage/
.nyc_output/

# Misc
.cache/
.turbo/
EOF
```

## Criar README.md Profissional

```bash
cat > /home/ubuntu/daily-loan-pay/README.md << 'EOF'
# Daily Loan Pay

Sistema web completo para gerenciamento de empréstimos com pagamento diário via PIX.

## Funcionalidades

- ✅ Autenticação segura com OAuth (Manus)
- ✅ Dashboard de empréstimos com progresso visual
- ✅ Geração dinâmica de QR Code PIX
- ✅ Confirmação automática de pagamentos via webhook
- ✅ Interface responsiva (desktop/mobile)
- ✅ Testes unitários com Vitest

## Tech Stack

- **Frontend**: React 19, Vite, Tailwind CSS 4, shadcn/ui
- **Backend**: Express 4, tRPC 11, Node.js
- **Database**: MySQL com Drizzle ORM
- **Auth**: Manus OAuth
- **Testing**: Vitest

## Instalação Rápida

```bash
# Clone o repositório
git clone https://github.com/seu-usuario/daily-loan-pay.git
cd daily-loan-pay

# Instale dependências
pnpm install

# Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# Execute migrations
pnpm db:push

# Inicie o servidor de desenvolvimento
pnpm dev
```

Acesse `http://localhost:3000`

## Documentação

- [Setup Guide](./SETUP_GUIDE.md) - Guia de instalação completo
- [Architecture](./ARCHITECTURE.md) - Arquitetura do sistema
- [PIX Integration](./PIX_INTEGRATION.md) - Integração com provedores PIX

## Testes

```bash
pnpm test
```

## Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## Suporte

Para dúvidas ou problemas, abra uma [issue](https://github.com/seu-usuario/daily-loan-pay/issues).

---

**Desenvolvido por**: [Seu Nome]  
**Última atualização**: Novembro 2025
EOF
```

## Criar LICENSE

```bash
cat > /home/ubuntu/daily-loan-pay/LICENSE << 'EOF'
MIT License

Copyright (c) 2025 Gabriel Amaral

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
EOF
```

## Fazer o Push Completo

```bash
cd /home/ubuntu/daily-loan-pay

# Adicionar todos os arquivos
git add .

# Criar commit
git commit -m "Add documentation and GitHub configuration"

# Fazer push
git push origin main
```

## Verificar no GitHub

1. Acesse `https://github.com/SEU_USUARIO/daily-loan-pay`
2. Verifique se todos os arquivos aparecem
3. Confirme que o README está sendo exibido

## Próximas Ações Recomendadas

### 1. Adicionar GitHub Actions (CI/CD)

Crie `.github/workflows/test.yml`:

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm test
```

### 2. Adicionar Topics

No GitHub, vá para "About" e adicione topics:
- `loan-management`
- `pix-payment`
- `react`
- `express`
- `typescript`

### 3. Habilitar Discussions

Settings → Features → Discussions (para comunidade)

### 4. Proteger a Branch Main

Settings → Branches → Add rule:
- Require pull request reviews
- Require status checks to pass

## Troubleshooting

### Erro: "fatal: not a git repository"

```bash
cd /home/ubuntu/daily-loan-pay
git init
```

### Erro: "Permission denied (publickey)"

Verifique sua chave SSH:
```bash
ssh -T git@github.com
```

### Erro: "fatal: The current branch main has no upstream branch"

```bash
git push -u origin main
```

### Erro: "fatal: remote origin already exists"

```bash
git remote remove origin
git remote add origin https://github.com/SEU_USUARIO/daily-loan-pay.git
```

## Dúvidas Frequentes

**P: Preciso fazer push de `.env`?**  
R: Não! Nunca faça push de arquivos `.env` com credenciais. Use `.env.example` como template.

**P: Como adicionar colaboradores?**  
R: Settings → Collaborators → Add people

**P: Como criar releases?**  
R: Releases → Create a new release (versione seu projeto)

**P: Posso mudar de privado para público depois?**  
R: Sim! Settings → Danger Zone → Change repository visibility

---

**Pronto!** Seu projeto está no GitHub! 🎉
EOF
```

## Executar os Comandos

```bash
# Criar .gitignore
cat > /home/ubuntu/daily-loan-pay/.gitignore << 'EOF'
node_modules/
pnpm-lock.yaml
.env
.env.local
dist/
build/
.vscode/
.idea/
.DS_Store
*.log
EOF

# Criar README.md
cat > /home/ubuntu/daily-loan-pay/README.md << 'EOF'
# Daily Loan Pay

Sistema web para gerenciamento de empréstimos com pagamento diário via PIX.

## Funcionalidades

- Autenticação com OAuth
- Dashboard de empréstimos
- Geração de QR Code PIX
- Confirmação automática de pagamentos
- Interface responsiva

## Instalação

```bash
git clone https://github.com/seu-usuario/daily-loan-pay.git
cd daily-loan-pay
pnpm install
pnpm db:push
pnpm dev
```

## Documentação

- [Setup Guide](./SETUP_GUIDE.md)
- [Architecture](./ARCHITECTURE.md)
- [PIX Integration](./PIX_INTEGRATION.md)

## Licença

MIT License
EOF

# Fazer commit e push
cd /home/ubuntu/daily-loan-pay
git add .
git commit -m "Add GitHub configuration and documentation"
```

Agora você tem um guia completo! Qual é seu nome de usuário do GitHub para eu ajudar com os comandos específicos?
