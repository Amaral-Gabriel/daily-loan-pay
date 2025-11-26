# Deploy no Vercel - Guia Completo

Este guia mostra como publicar seu projeto Daily Loan Pay no Vercel em 5 minutos.

## O que é Vercel?

Vercel é uma plataforma de hosting que:
- ✅ Hospeda frontend React automaticamente
- ✅ Hospeda backend Node.js/Express
- ✅ Gerencia banco de dados
- ✅ Faz deploy automático a cada push
- ✅ Oferece tier gratuito generoso
- ✅ Tem suporte excelente

## Pré-requisitos

- ✅ Conta GitHub (você já tem)
- ✅ Repositório no GitHub (você já tem)
- ⬜ Conta Vercel (vamos criar)

## Passo 1: Criar Conta no Vercel

1. Acesse https://vercel.com
2. Clique em **"Sign Up"**
3. Selecione **"Continue with GitHub"**
4. Autorize Vercel a acessar seus repositórios
5. Pronto! Você está logado

## Passo 2: Importar Projeto

1. Acesse https://vercel.com/dashboard
2. Clique em **"Add New..."** → **"Project"**
3. Clique em **"Import Git Repository"**
4. Procure por **"daily-loan-pay"**
5. Clique em **"Import"**

## Passo 3: Configurar Projeto

### Framework
- **Framework Preset**: Deixe em branco (vamos usar custom)

### Build Settings
- **Build Command**: `pnpm install && pnpm build`
- **Output Directory**: `client/dist`
- **Install Command**: `pnpm install`

### Root Directory
- Deixe em branco (raiz do projeto)

## Passo 4: Adicionar Variáveis de Ambiente

Você precisa adicionar as mesmas variáveis que estão no seu `.env` local.

Clique em **"Environment Variables"** e adicione:

```
DATABASE_URL = mysql://user:password@host:3306/database
JWT_SECRET = seu-secret-aqui
VITE_APP_ID = seu-app-id
OAUTH_SERVER_URL = https://api.manus.im
VITE_OAUTH_PORTAL_URL = https://manus.im/login
VITE_APP_TITLE = Daily Loan Pay
VITE_APP_LOGO = /logo.svg
OWNER_OPEN_ID = seu-owner-id
OWNER_NAME = Seu Nome
BUILT_IN_FORGE_API_URL = sua-api-url
BUILT_IN_FORGE_API_KEY = sua-api-key
VITE_FRONTEND_FORGE_API_URL = sua-frontend-api-url
VITE_FRONTEND_FORGE_API_KEY = sua-frontend-api-key
```

**Importante**: Não use valores de teste. Use valores reais!

## Passo 5: Deploy

1. Clique em **"Deploy"**
2. Aguarde 2-3 minutos
3. Você verá uma mensagem **"Congratulations!"**
4. Seu site está em: `https://daily-loan-pay.vercel.app`

## ✅ Verificar Deploy

Após o deploy:

1. Acesse sua URL: `https://daily-loan-pay.vercel.app`
2. Teste o login
3. Verifique se os empréstimos carregam
4. Teste a geração de PIX

Se houver erros, vá para **"Deployments"** → **"Logs"** para ver o que deu errado.

## Configurar Domínio Customizado (Opcional)

Se você tiver um domínio próprio (ex: `daily-loan-pay.com`):

1. Vá para **Settings** → **Domains**
2. Clique em **"Add"**
3. Digite seu domínio
4. Siga as instruções para configurar DNS

## Deploy Automático

Agora, sempre que você fizer push para `main`:

```bash
git add .
git commit -m "Update feature"
git push origin main
```

Vercel vai:
1. Detectar o push
2. Fazer build automaticamente
3. Publicar a nova versão
4. Seu site atualiza em ~2 minutos

## Troubleshooting

### Erro: "Build failed"

Verifique os logs:
1. Vá para **Deployments**
2. Clique no deployment que falhou
3. Vá para **Build Logs**
4. Procure pela mensagem de erro

Causas comuns:
- Variáveis de ambiente faltando
- Dependências não instaladas
- Erro de TypeScript

### Erro: "Cannot find module"

Adicione a variável de ambiente:
```
NODE_ENV = production
```

### Erro: "Database connection failed"

Verifique:
1. `DATABASE_URL` está correto?
2. Seu banco de dados está online?
3. Firewall permite conexão externa?

### Site carrega mas backend não funciona

Verifique:
1. Todas as variáveis de ambiente estão configuradas?
2. Backend está rodando? (Veja logs)
3. URLs de API estão corretas?

## Monitoramento

Vercel oferece dashboard com:
- 📊 Requisições por segundo
- ⏱️ Tempo de resposta
- 🔥 Erros e exceções
- 📈 Uso de banda

Acesse em: **Analytics** → **Performance**

## Próximos Passos

### 1. Configurar CI/CD
Vercel já faz deploy automático, mas você pode adicionar testes:

Crie `.vercel.json`:
```json
{
  "buildCommand": "pnpm build && pnpm test",
  "outputDirectory": "client/dist"
}
```

### 2. Adicionar Monitoramento
Configure alertas para erros:
- Settings → Alerts
- Escolha notificações por email

### 3. Configurar Backup
Configure backup automático do banco:
- Settings → Database → Backups

### 4. Otimizar Performance
- Ativar caching
- Comprimir imagens
- Minificar CSS/JS (já feito pelo Vite)

## Dúvidas Frequentes

**P: Quanto custa?**  
R: Tier gratuito é suficiente para começar. Pague apenas se precisar de mais recursos.

**P: Meus dados estão seguros?**  
R: Sim, Vercel usa HTTPS, backups automáticos e segurança de nível enterprise.

**P: Posso usar banco de dados externo?**  
R: Sim, use `DATABASE_URL` apontando para seu MySQL externo.

**P: Como faço rollback?**  
R: Vá para Deployments, clique no deployment anterior e clique "Redeploy".

**P: Posso usar variáveis de ambiente secretas?**  
R: Sim, Vercel as criptografa automaticamente.

## Checklist Final

- [ ] Conta Vercel criada
- [ ] Projeto importado
- [ ] Variáveis de ambiente adicionadas
- [ ] Deploy realizado
- [ ] Site testado
- [ ] Login funcionando
- [ ] Empréstimos carregando
- [ ] PIX gerando QR Code

## Suporte

Se tiver problemas:
1. Verifique os logs em **Deployments**
2. Leia a documentação: https://vercel.com/docs
3. Abra uma issue no GitHub
4. Contate suporte Vercel

---

**Pronto!** Seu projeto está no ar! 🎉

**URL**: https://daily-loan-pay.vercel.app  
**Dashboard**: https://vercel.com/dashboard  
**Documentação**: https://vercel.com/docs
