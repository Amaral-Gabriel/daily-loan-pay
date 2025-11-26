# Daily Loan Pay - Sistema de Empréstimos com Pagamento Diário

Sistema web completo para gerenciamento de empréstimos com pagamento diário via PIX. Desenvolvido com React, Express, tRPC e MySQL.

## 🎯 Funcionalidades

- ✅ **Autenticação Segura**: OAuth integrado com Manus
- ✅ **Dashboard de Empréstimos**: Visualize todos seus empréstimos ativos
- ✅ **Geração Dinâmica de PIX**: QR Code e chave PIX gerados diariamente
- ✅ **Confirmação Automática**: Webhooks para atualização em tempo real
- ✅ **Interface Responsiva**: Funciona perfeitamente em desktop e mobile
- ✅ **Testes Automatizados**: Suite de testes com Vitest

## 🛠️ Stack Tecnológico

| Camada | Tecnologia |
|--------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS 4, shadcn/ui |
| **Backend** | Express 4, tRPC 11, Node.js |
| **Database** | MySQL, Drizzle ORM |
| **Autenticação** | Manus OAuth |
| **Testes** | Vitest |
| **Pagamentos** | QRCode, PIX (webhooks) |

## 📋 Pré-requisitos

- Node.js 22.13.0+
- pnpm
- MySQL (local ou remoto)
- Git

## 🚀 Instalação Rápida

```bash
# 1. Clone o repositório
git clone https://github.com/seu-usuario/daily-loan-pay.git
cd daily-loan-pay

# 2. Instale dependências
pnpm install

# 3. Configure variáveis de ambiente
cp .env.example .env
# Edite .env com suas credenciais

# 4. Execute migrations do banco
pnpm db:push

# 5. Inicie o servidor de desenvolvimento
pnpm dev
```

Acesse `http://localhost:3000` no seu navegador.

## 📚 Documentação

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Guia completo de instalação e configuração
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Arquitetura do sistema e fluxos
- **[PIX_INTEGRATION.md](./PIX_INTEGRATION.md)** - Integração com provedores PIX reais
- **[GITHUB_PUBLISH.md](./GITHUB_PUBLISH.md)** - Guia para publicar no GitHub

## 🧪 Testes

```bash
# Executar todos os testes
pnpm test

# Executar testes em modo watch
pnpm test:watch

# Gerar coverage
pnpm test:coverage
```

## 📁 Estrutura do Projeto

```
daily-loan-pay/
├── client/                    # Frontend React
│   ├── src/
│   │   ├── pages/            # Páginas da aplicação
│   │   ├── components/       # Componentes reutilizáveis
│   │   ├── lib/              # Utilitários (tRPC, hooks)
│   │   └── App.tsx           # Roteamento principal
│   └── index.html
├── server/                    # Backend Express
│   ├── routers.ts            # Rotas tRPC
│   ├── routers/              # Módulos de rotas
│   ├── db.ts                 # Helpers de banco de dados
│   └── _core/                # Configuração interna
├── drizzle/
│   ├── schema.ts             # Definição do banco de dados
│   └── migrations/           # Arquivos de migração
├── shared/                   # Código compartilhado
└── package.json
```

## 🔐 Segurança

- Autenticação via OAuth (sem armazenar senhas)
- Validação de entrada com Zod
- Proteção de rotas com JWT
- Verificação de permissões por role
- Dados sensíveis criptografados

## 🌐 Fluxo de Pagamento PIX

1. **Geração**: Usuário clica "Gerar Pagamento de Hoje"
2. **QR Code**: Sistema gera QR Code único e chave PIX
3. **Pagamento**: Usuário escaneia QR Code ou copia chave
4. **Webhook**: Banco confirma pagamento via webhook
5. **Atualização**: Sistema atualiza saldo automaticamente

## 📊 Banco de Dados

### Tabelas Principais

- **users**: Usuários do sistema
- **loans**: Empréstimos ativos
- **dailyPayments**: Pagamentos diários gerados
- **payments**: Histórico de pagamentos confirmados

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Add MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está licenciado sob a MIT License - veja o arquivo [LICENSE](LICENSE) para detalhes.

## 💬 Suporte

- 📖 Leia a [documentação](./SETUP_GUIDE.md)
- 🐛 Abra uma [issue](https://github.com/seu-usuario/daily-loan-pay/issues)
- 💡 Sugira melhorias via [discussions](https://github.com/seu-usuario/daily-loan-pay/discussions)

## 🎓 Aprendizado

Este projeto demonstra:

- Arquitetura full-stack moderna
- Type-safety com TypeScript e tRPC
- Integração com APIs de pagamento
- Autenticação OAuth
- Testes unitários
- Boas práticas de segurança

## 📈 Roadmap

- [ ] Painel administrativo
- [ ] Notificações por email/SMS
- [ ] Relatórios e analytics
- [ ] App mobile (React Native)
- [ ] Integração com mais provedores PIX

## 👨‍💻 Autor

**Gabriel Amaral**

---

**Desenvolvido com ❤️ em 2025**
