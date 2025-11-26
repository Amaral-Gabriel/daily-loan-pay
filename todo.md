# Daily Loan Pay - Project TODO

## Backend - Database & Schema
- [x] Definir schema do banco de dados (usuarios, emprestimos, pagamentos)
- [x] Implementar migrations com Drizzle ORM
- [x] Criar helpers de consulta no server/db.ts

## Backend - Autenticacao
- [x] Implementar rotas de registro de usuario (via Manus OAuth)
- [x] Implementar rotas de login com JWT (via Manus OAuth)
- [x] Criar middleware de autenticacao protegida
- [x] Implementar logout

## Backend - Emprestimos
- [x] Criar rota para criar novo emprestimo
- [x] Criar rota para listar emprestimos do usuario
- [x] Criar rota para obter detalhes de um emprestimo
- [x] Implementar logica de calculo de valor diario
- [x] Implementar validacoes de negocio

## Backend - PIX e Pagamentos
- [x] Pesquisar e integrar API de PIX (usando QRCode library)
- [x] Criar rota para gerar cobranca PIX dinamica
- [x] Implementar geracao de QR Code
- [x] Criar endpoint de webhook para confirmacao de pagamento
- [x] Implementar logica de atualizacao automatica de saldo
- [x] Implementar marcacao de emprestimo como quitado

## Backend - Historico e Seguranca
- [x] Criar tabela de historico de pagamentos
- [ ] Implementar criptografia de dados sensiveis
- [x] Adicionar validacoes de entrada em todas as rotas
- [ ] Implementar rate limiting
- [x] Adicionar testes unitarios com Vitest

## Frontend - Estrutura
- [x] Definir design system e paleta de cores
- [x] Criar layout responsivo (desktop/mobile)
- [x] Implementar navegacao principal
- [x] Configurar roteamento

## Frontend - Autenticacao
- [x] Implementar tela de login
- [x] Integrar com backend de autenticacao
- [x] Implementar logout
- [x] Adicionar protecao de rotas

## Frontend - Emprestimos
- [x] Criar tela de lista de emprestimos
- [x] Criar tela de detalhes do emprestimo
- [x] Implementar exibicao de valores (total, pago, restante)
- [x] Implementar contador de dias/diarias

## Frontend - Pagamento
- [x] Criar componente para exibir QR Code PIX
- [x] Criar componente para exibir chave PIX copia e cola
- [x] Implementar botao "Gerar Pagamento de Hoje"
- [x] Implementar notificacao de pagamento confirmado
- [x] Implementar polling para confirmacao em tempo real

## Frontend - Responsividade
- [x] Testar em dispositivos moveis
- [x] Otimizar layout para telas pequenas
- [ ] Testar touch interactions

## Documentacao
- [x] Documentar arquitetura do sistema
- [ ] Documentar fluxo de autenticacao
- [ ] Documentar fluxo de pagamento PIX
- [ ] Documentar estrutura do banco de dados
- [ ] Criar guia de instalacao e execucao local
- [ ] Documentar variaveis de ambiente necessarias
- [ ] Criar exemplos de requisicoes API

## Deploy e Publicacao
- [ ] Preparar para publicacao
- [ ] Criar checkpoint final
- [ ] Publicar projeto
