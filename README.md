# Sistema de Controle de Almoxarifado

Aplicação Fullstack para digitalizar o empréstimo de notebooks, multímetros e kits de
robótica da escola, substituindo o caderno de papel.

- **Front-end:** Next.js 14 + TypeScript + Tailwind CSS
- **Back-end:** Node.js + Express + TypeScript
- **Banco de dados:** MySQL

## Estrutura do repositório

```
projeto-almoxarifado/
├── docs/
│   ├── DER.md              # Explicação do modelo de dados (Fase 1)
│   └── rotas-api.http      # Mapeamento das rotas da API (Fase 1)
├── backend/
│   ├── database/schema.sql # Script de criação das tabelas + dados de exemplo
│   └── src/                # Código-fonte da API (TypeScript)
└── frontend/
    └── app/                # Código-fonte do site (Next.js / TypeScript)
```

## 1. Banco de dados (MySQL)

1. Tenha um servidor MySQL 8+ rodando.
2. Rode o script de criação das tabelas:

```bash
mysql -u root -p < backend/database/schema.sql
```

Isso cria o banco `almoxarifado`, as três tabelas (`alunos`, `equipamentos`,
`emprestimos`) e insere alguns dados de exemplo (incluindo um empréstimo já em
atraso, para você ver o dashboard funcionando).

## 2. Back-end (API)

```bash
cd backend
pnpm install
cp .env.example .env
# edite o .env com as credenciais do seu MySQL
pnpm dev
```

A API sobe em `http://localhost:3001`. Todas as rotas ficam sob `/api`
(ex: `http://localhost:3001/api/alunos`). Veja `docs/rotas-api.http` para
testar cada rota (compatível com a extensão REST Client do VS Code).

## 3. Front-end (site)

```bash
cd frontend
pnpm install
cp .env.local.example .env.local
# por padrão já aponta para http://localhost:3001/api
pnpm dev
```

O site sobe em `http://localhost:3000`, com as páginas:

- `/` — Painel de controle (dashboard com resumo e empréstimos em atraso)
- `/emprestimos` — Registrar empréstimo, ver histórico e registrar devoluções
- `/equipamentos` — Catálogo de equipamentos (CRUD)
- `/alunos` — Cadastro de alunos (CRUD)

## Regras de negócio implementadas

- A API **rejeita com erro 400** qualquer tentativa de emprestar um
  equipamento cujo status não seja `disponivel` (validado dentro de uma
  transação com `SELECT ... FOR UPDATE`, evitando condição de corrida).
- O formulário de "Registrar empréstimo" só lista equipamentos com status
  `disponivel` (`GET /equipamentos?status=disponivel`).
- Registros de `emprestimos` **nunca são apagados** — a devolução apenas
  atualiza `status`, `data_devolucao` e o status do equipamento.
- O dashboard calcula "em atraso" dinamicamente: `status = 'ativo' AND
  data_limite_devolucao < CURDATE()`.
