# Pesquisa 4.0

Plataforma SaaS multi-empresa para criação, envio e coleta de respostas de pesquisas. Construída com Next.js 16, Prisma 7 e Supabase Auth.

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

## Funcionalidades

- **Multi-empresa**: cada usuário pertence a uma `Empresa`; dados são isolados por `empresaId`
- **Controle de acesso (RBAC)**: papéis `OWNER`, `ADMIN` e `MEMBER` com regras de permissão centralizadas
- **Gestão de pesquisas**: criação, edição de perguntas, envio por e-mail e coleta de respostas
- **Painel admin**: gerenciar papel e status (ativo/inativo) dos usuários da empresa
- **Proteção server-side**: layout e rotas verificam autenticação e papel antes de renderizar
- **Conta inativa**: usuários desativados são bloqueados no login e nas rotas protegidas

---

## Estrutura do projeto

```
app/
	(auth)/          → Páginas de login, cadastro e recuperação de senha
	(admin)/         → Páginas protegidas: dashboard, pesquisas, admin
	api/             → Rotas de API (pesquisas, envios, perguntas, respostas, auth, admin/users)
	responder/       → Página pública de resposta via token
components/        → Componentes React (layout, pesquisas, admin, ui)
lib/
	auth-context.ts  → Helper central de autenticação e tenant
	access-control.ts → Utilitários de permissão por papel
	prisma.ts        → Instância do Prisma Client
	supabase/        → Clientes Supabase (server e client)
services/          → Lógica de negócio (pesquisas, envios, respostas, admin-users)
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

# Banco de dados (session pooler do Supabase)
DATABASE_URL=postgresql://postgres.<project>:<password>@aws-1-<region>.pooler.supabase.com:5432/postgres

# E-mail (para envio de pesquisas)
RESEND_API_KEY=<resend-key>
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

Acesse [http://localhost:3000](http://localhost:3000).

---

## Papéis e permissões

| Papel | Acesso admin | Gerenciar pesquisas | Gerenciar usuários |
|---|---|---|---|
| `OWNER` | ✅ | ✅ | ✅ (todos os papéis) |
| `ADMIN` | ✅ | ✅ | ✅ (somente MEMBERs) |
| `MEMBER` | ❌ | ❌ | ❌ |

O primeiro usuário a se cadastrar recebe automaticamente o papel `OWNER`.

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

## Build

```bash
npm run build
```
