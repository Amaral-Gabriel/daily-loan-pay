# Publicar Daily Loan Pay no GitHub Pages

GitHub Pages permite hospedar seu site gratuitamente diretamente do seu repositório GitHub.

## ⚠️ Importante: Limitações do GitHub Pages

GitHub Pages é ideal para **sites estáticos** (HTML, CSS, JavaScript puro). Como seu projeto é **full-stack** (React + Express + MySQL), você tem algumas opções:

### Opção 1: Deploy Apenas do Frontend (Recomendado para GitHub Pages)
- Hospeda o frontend React no GitHub Pages
- Backend deve estar em outro servidor (Heroku, Railway, Render, etc.)

### Opção 2: Deploy Full-Stack (Melhor Solução)
- Use plataformas como Vercel, Netlify ou Railway
- Elas suportam full-stack automaticamente

## Opção 1: GitHub Pages + Backend Separado

### Passo 1: Configurar GitHub Pages

1. Acesse seu repositório: https://github.com/Amaral-Gabriel/daily-loan-pay
2. Vá para **Settings** → **Pages**
3. Em "Source", selecione:
   - **Branch**: `main`
   - **Folder**: `client/dist`
4. Clique em "Save"

Seu site estará em: `https://amaral-gabriel.github.io/daily-loan-pay`

### Passo 2: Atualizar vite.config.ts

O frontend precisa saber que está em um subdiretório:

```typescript
// client/vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  base: "/daily-loan-pay/", // Adicione esta linha
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

### Passo 3: Criar GitHub Actions para Deploy Automático

Crie o arquivo `.github/workflows/deploy.yml`:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches:
      - main

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: pnpm/action-setup@v2
        with:
          version: 10

      - uses: actions/setup-node@v3
        with:
          node-version: 22
          cache: "pnpm"

      - name: Install dependencies
        run: pnpm install

      - name: Build frontend
        run: pnpm build

      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
        with:
          github_token: ${{ secrets.GITHUB_TOKEN }}
          publish_dir: ./client/dist
          cname: # Deixe em branco se não tiver domínio customizado
```

### Passo 4: Fazer Push

```bash
cd /home/ubuntu/daily-loan-pay

# Criar os arquivos
mkdir -p .github/workflows

# Adicionar e fazer commit
git add .github/workflows/deploy.yml
git commit -m "Add GitHub Pages deployment workflow"
git push origin main
```

O GitHub Actions vai:
1. Detectar o push
2. Instalar dependências
3. Fazer build do frontend
4. Publicar em `gh-pages` branch
5. Seu site estará online em ~2 minutos

### Passo 5: Configurar Backend

Como o backend não pode rodar no GitHub Pages, você precisa hospedá-lo em outro lugar:

**Opções gratuitas:**
- [Railway.app](https://railway.app) - Recomendado
- [Render.com](https://render.com)
- [Heroku](https://heroku.com) (agora pago)
- [Replit](https://replit.com)

**Exemplo com Railway:**

1. Acesse https://railway.app
2. Clique em "New Project"
3. Selecione "Deploy from GitHub"
4. Conecte seu repositório
5. Configure variáveis de ambiente
6. Railway vai gerar uma URL como: `https://daily-loan-pay-production.up.railway.app`

### Passo 6: Atualizar Frontend para Apontar ao Backend

Crie um arquivo `.env.production`:

```env
VITE_API_URL=https://seu-backend-url.up.railway.app
```

E atualize `client/src/lib/trpc.ts`:

```typescript
const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:3000";

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = createTRPCProxyClient<AppRouter>({
  links: [
    httpBatchLink({
      url: `${apiUrl}/api/trpc`,
    }),
  ],
});
```

## Opção 2: Deploy Full-Stack com Vercel (Melhor)

Vercel é a plataforma ideal para este projeto (criada pelos criadores do Next.js).

### Passo 1: Conectar ao Vercel

1. Acesse https://vercel.com
2. Clique em "Sign Up" → "Continue with GitHub"
3. Autorize Vercel a acessar seus repositórios
4. Clique em "Import Project"
5. Selecione `daily-loan-pay`

### Passo 2: Configurar Projeto

1. **Framework Preset**: Deixe em branco (custom)
2. **Root Directory**: `.`
3. **Build Command**: `pnpm build`
4. **Output Directory**: `client/dist`

### Passo 3: Adicionar Variáveis de Ambiente

Na página de configuração do Vercel, adicione:

```
DATABASE_URL=sua_url_mysql
JWT_SECRET=seu_secret
VITE_APP_ID=seu_app_id
... (todas as outras variáveis)
```

### Passo 4: Deploy

Clique em "Deploy" e pronto! Seu site estará em:
- `https://daily-loan-pay.vercel.app`

Vercel faz deploy automático a cada push em `main`.

## Opção 3: Deploy Full-Stack com Railway

Railway é mais simples que Vercel para full-stack.

### Passo 1: Conectar ao Railway

1. Acesse https://railway.app
2. Clique em "New Project" → "Deploy from GitHub"
3. Selecione seu repositório
4. Clique em "Deploy"

### Passo 2: Configurar Variáveis

Railway detecta automaticamente que é um projeto Node.js.

Adicione variáveis de ambiente:
- DATABASE_URL
- JWT_SECRET
- VITE_APP_ID
- etc.

### Passo 3: Configurar Build

Crie `railway.json` na raiz do projeto:

```json
{
  "build": {
    "builder": "nixpacks",
    "buildCommand": "pnpm install && pnpm build"
  },
  "deploy": {
    "startCommand": "pnpm start"
  }
}
```

E adicione em `package.json`:

```json
{
  "scripts": {
    "start": "node server/_core/index.js"
  }
}
```

## Comparação de Opções

| Opção | Custo | Facilidade | Full-Stack | Recomendação |
|-------|-------|-----------|-----------|--------------|
| GitHub Pages | Grátis | Fácil | ❌ | Frontend só |
| Vercel | Grátis (tier) | Muito Fácil | ✅ | Melhor |
| Railway | Grátis (tier) | Fácil | ✅ | Bom |
| Render | Grátis | Médio | ✅ | Bom |

## Recomendação Final

**Use Vercel** porque:
- ✅ Deploy automático
- ✅ Suporta full-stack
- ✅ Muito rápido
- ✅ Integração perfeita com GitHub
- ✅ Tier gratuito generoso

## Próximos Passos

1. **Escolha uma opção acima**
2. **Configure variáveis de ambiente**
3. **Faça deploy**
4. **Teste a aplicação**
5. **Configure domínio customizado** (opcional)

Qual opção você prefere?

---

**Dúvidas Frequentes**

**P: Posso usar GitHub Pages para full-stack?**  
R: Não, GitHub Pages só hospeda arquivos estáticos. Para full-stack, use Vercel, Railway ou Render.

**P: Quanto custa?**  
R: Vercel e Railway têm tier gratuito. GitHub Pages é sempre grátis.

**P: Como configurar domínio customizado?**  
R: Vá em Settings → Pages → Custom domain e adicione seu domínio.

**P: Como fazer deploy automático?**  
R: GitHub Actions (GitHub Pages) ou integração nativa (Vercel/Railway).
