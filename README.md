# Pesquisa 4.0

Plataforma SaaS multiempresa para criar pesquisas, configurar perguntas, importar destinatarios, disparar convites por email e acompanhar respostas com governanca por empresa.

Construida com Next.js 16, Prisma 7, PostgreSQL (Supabase) e Supabase Auth.

---

## Stack

| Camada | Tecnologia |
|---|---|
| Framework | Next.js 16.1.6 (App Router) |
| ORM | Prisma 7.5.0 |
| Banco de dados | PostgreSQL via Supabase |
| Autenticação | Supabase Auth |
| Estilo | Tailwind CSS |
| Linguagem | TypeScript |

---

## Visao de produto

- Multiempresa com isolamento por empresa
- Controle de acesso por papel (OWNER, ADMIN, MEMBER)
- Operacao orientada a fluxo: criar -> configurar -> disparar -> responder -> analisar
- Painel administrativo para governanca de usuarios e acessos
- Processamento assincrono de disparos com acompanhamento de progresso e retries

---

## Funcionalidades principais

- Multiempresa: dados segregados por empresa
- RBAC centralizado com OWNER, ADMIN e MEMBER
- Criacao e gestao de pesquisas
- Gestao de perguntas com criacao, edicao, exclusao e ordenacao
- Importacao de destinatarios via CSV com validacao de cabecalho e historico de importacoes
- Disparo assincrono com lote, progresso e retries
- Coleta de respostas por link publico com token
- Painel admin de usuarios e empresa (papel, status ativo/inativo e resumo da empresa)
- Recuperacao de senha ponta a ponta

---

## Estrutura do projeto

```
app/
	(auth)/          → Páginas de login, cadastro e recuperação de senha
	(admin)/         → Páginas protegidas: dashboard, pesquisas, admin
	api/             → Rotas de API (auth, pesquisas, perguntas, envios, respostas, admin)
	responder/       → Página pública de resposta via token
components/        → Componentes React (layout, pesquisas, admin, ui)
lib/
	auth-context.ts  → Helper central de autenticação e tenant
	access-control.ts → Utilitários de permissão por papel
	prisma.ts        → Instância do Prisma Client
	supabase/        → Clientes Supabase (server e client)
services/          → Logica de negocio (pesquisas, perguntas, envios, respostas, admin)
prisma/
	schema.prisma    → Modelos: Profile, Empresa, Pesquisa, Pergunta, Envio, Resposta
	migrations/      → Migrações SQL versionadas
scripts/
	run-migrations.mjs → Script para aplicar migrações via driver pg direto
types/             → Tipos TypeScript compartilhados
```

---

## Configuração do ambiente

Crie um arquivo `.env.local` na raiz com as seguintes variáveis:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://<project>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
NEXT_PUBLIC_APP_URL=https://<seu-dominio-ou-url-publica>

# Banco de dados (session pooler do Supabase)
DATABASE_URL=postgresql://postgres.<project>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres

# E-mail (para envio de pesquisas)
SMTP_HOST=smtp.exemplo.com
SMTP_PORT=587
SMTP_USER=<usuario-smtp>
SMTP_PASS=<senha-smtp>
EMAIL_FROM=noreply@seudominio.com
```

---

## Primeiros passos

### 1. Instalar dependências

```bash
npm install
```

### 2. Gerar o Prisma Client

```bash
npx prisma generate
```

### 3. Aplicar as migrações ao banco

> **Atenção:** O Supabase usa um connection pooler que é incompatível com o schema engine do Prisma (`prisma migrate deploy`). Use o script alternativo:

```bash
node scripts/run-migrations.mjs
```

Após aplicar as migrações, verifique a sincronização:

```bash
npx prisma db push
```

### 4. Iniciar o servidor de desenvolvimento

```bash
npm run dev
```

Se houver travas de processo local, use:

```bash
npm run dev:clean
npm run dev:fresh
```

Acesse [http://localhost:3000](http://localhost:3000).

---

## Papeis e permissoes

| Papel | Acesso admin | Gerenciar pesquisas | Gerenciar usuários |
|---|---|---|---|
| `OWNER` | ✅ | ✅ | ✅ (todos os papéis) |
| `ADMIN` | ✅ | ✅ | ✅ (somente MEMBERs) |
| `MEMBER` | ❌ | ❌ | ❌ |

O primeiro usuário a se cadastrar recebe automaticamente o papel `OWNER`.

Regras aplicadas no modulo administrativo:

- OWNER pode alterar papel/status de outros usuarios, mas nao pode desativar a propria conta
- OWNER nao pode remover/desativar o ultimo OWNER ativo da empresa
- ADMIN gerencia apenas MEMBER
- MEMBER nao acessa funcoes administrativas
- As validacoes de permissao existem em rota e service (defesa em profundidade)

---

## Fluxos ponta a ponta

### 1) Login

1. Usuario acessa /login
2. API valida credenciais no Supabase Auth
3. Sistema garante bootstrap de perfil + empresa
4. Usuario ativo entra no dashboard

### 2) Criacao de pesquisa

1. Usuario cria pesquisa em /pesquisas/nova
2. API valida dados com Zod
3. Pesquisa e criada na empresa do usuario
4. Usuario e direcionado para a visao da pesquisa

### 3) Configuracao de perguntas

1. Usuario adiciona perguntas por tipo (multipla escolha, texto livre, escala)
2. Pode editar, excluir e reordenar
3. Feedback de sucesso/erro aparece na tela

### 4) Importacao de destinatarios

1. Usuario importa arquivo CSV na tela de envios
2. Sistema valida cabecalho, email e duplicidade
3. Mostra resumo (validos, invalidos, duplicados)
4. Mantem historico de importacoes por pesquisa

### 5) Disparo

1. Usuario confirma disparo
2. API cria lote assicrono de envio
3. Front acompanha progresso em tempo real
4. Sistema controla retries e status de falha

### 6) Resposta do cliente

1. Destinatario abre link com token
2. Sistema valida token, expiracao e estado de resposta
3. Formulario exige resposta completa antes do envio
4. Respostas sao gravadas com validacoes de integridade

### 7) Leitura de resultados

1. Painel mostra total de envios, respostas e taxa
2. Lista respostas por destinatario e item
3. Navegacao consistente entre detalhes, perguntas, envios e resultados

---

## Fluxo de recuperacao de senha

1. Usuário acessa `/esqueci-senha` e informa o e-mail.
2. A API `/api/auth/forgot-password` chama `supabase.auth.resetPasswordForEmail`.
3. O Supabase envia um link apontando para `/callback?next=/redefinir-senha`.
4. A rota `/callback` troca o `code` por sessão e redireciona para `/redefinir-senha`.
5. Usuário define a nova senha em `/redefinir-senha`.
6. A API `/api/auth/reset-password` valida com Zod e chama `supabase.auth.updateUser`.

Garanta que NEXT_PUBLIC_APP_URL esteja configurada com a URL publica correta para os links funcionarem fora do ambiente local.

---

## Disparo assincrono e confiabilidade

1. `POST /api/pesquisas/:id/disparar` cria um `DisparoJob` e registra os destinatários como `PENDENTE`.
2. A API retorna imediatamente (`202`) com dados do lote.
3. A tela de envios inicia polling em GET /api/pesquisas/:id/disparos/:jobId.
4. O processamento e acionado em ciclos curtos no backend, com lock de job e claim de envio.
5. O frontend recarrega a lista de envios e exibe progresso em tempo real.

Status de `Envio`:
- `PENDENTE`
- `PROCESSANDO`
- `ENVIADO`
- `ERRO`
- `RESPONDIDO`
- `EXPIRADO`

### Evitar duplicidade e reprocessamento

- Ao criar o lote, destinatários já com envio ativo (`PENDENTE`, `PROCESSANDO`, `ENVIADO`, `RESPONDIDO`) são ignorados.
- O processador usa lock por job e claim por envio para evitar corrida em execuções paralelas.
- Jobs em andamento podem ser retomados com polling após reload da página.
- Erros transientes sao classificados com codigo e tentativa para retry controlado.

### Limitações e alternativa recomendada

Em ambientes serverless/App Router, não existe garantia forte de worker residente contínuo dentro do processo web. Nesta implementação, o processamento é orientado por polling e persistido no banco (abordagem prática e robusta para o contexto atual).

Para maior escala/confiabilidade, a melhor alternativa é mover o processamento para um worker dedicado, por exemplo:
- fila externa (Upstash QStash, SQS, RabbitMQ)
- scheduler/cron para drenar pendências
- worker separado da aplicação web

---

## Admin e governanca

Painel administrativo em /admin/usuarios:

- Lista de usuarios da empresa
- Alteracao de papel com confirmacao
- Ativar/desativar com confirmacao
- Badges de papel e status
- Resumo da empresa (usuarios, ativos, distribuicao por papel)

Rotas administrativas:

- GET /api/admin/users
- PATCH /api/admin/users/:id
- GET /api/admin/company

Servicos organizados:

- services/admin/admin-governance.service.ts
- services/admin/admin-user-access.service.ts

---

## Migrações

Como o Prisma schema engine não é compatível com o pooler do Supabase, as migrações são aplicadas com:

```bash
node scripts/run-migrations.mjs
```

O script:
- Conecta via driver `pg` usando `DATABASE_URL`
- Verifica a tabela `_prisma_migrations` para pular migrações já aplicadas
- Executa cada arquivo SQL em `prisma/migrations/`
- Registra o histórico de migrações aplicadas

> **Nunca use** `prisma migrate deploy` ou `prisma migrate dev` neste projeto.

---

## Comandos uteis

```bash
npm run dev
npm run dev:clean
npm run dev:fresh
npm run lint
npm run build
npm run start
```

---

## Build de producao

```bash
npm run build
```
