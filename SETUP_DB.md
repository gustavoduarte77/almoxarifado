# 🗄️ Configuração do Banco de Dados

## Pré-requisitos

- **MySQL 8.0+** instalado e rodando
- Usuário MySQL com permissão de criar bancos de dados

## Configuração do `.env`

O arquivo `.env` foi criado automaticamente. Você precisa atualizá-lo com suas credenciais do MySQL:

```env
DB_HOST=localhost          # Host do MySQL
DB_PORT=3306              # Porta padrão do MySQL
DB_USER=root              # Seu usuário MySQL
DB_PASSWORD=sua_senha     # Sua senha MySQL
DB_NAME=almoxarifado      # Nome do banco de dados

PORT=3001
CORS_ORIGIN=http://localhost:3000
```

## Passo 1: Atualizar `.env` com suas credenciais

Edite o arquivo `backend/.env` e altere:
- `DB_PASSWORD` com sua senha do MySQL
- `DB_USER` e `DB_HOST` se necessário

## Passo 2: Executar setup do banco de dados

```bash
cd backend
pnpm install  # Se ainda não fez
pnpm setup-db
```

Este comando vai:
1. ✅ Criar o banco de dados `almoxarifado`
2. ✅ Criar as tabelas (alunos, equipamentos, emprestimos)
3. ✅ Inserir dados de exemplo para testes

## Passo 3: Testar a conexão

```bash
pnpm test-db
```

Se tudo estiver certo, você verá:
```
✅ Conexão estabelecida com sucesso!
📊 Resultado da query: [{ count: 4 }]
✨ Banco de dados está funcionando!
```

## Iniciar o servidor

```bash
pnpm dev
```

O servidor estará disponível em `http://localhost:3001`

## Estrutura do Banco de Dados

### Tabela `alunos`
- Armazena informações dos alunos
- Campos: id, nome, matricula, email, turma

### Tabela `equipamentos`
- Armazena equipamentos do almoxarifado
- Status: disponivel, emprestado, manutencao

### Tabela `emprestimos`
- Histórico de empréstimos (nunca são deletados)
- Vincula alunos e equipamentos
- Rastreia datas de retirada e devolução

## Solução de Problemas

### ❌ "Cannot find module 'mysql2'"
Execute: `pnpm install`

### ❌ "Access denied for user 'root'"
Verifique se sua senha MySQL está correta no `.env`

### ❌ "MySQL server has gone away"
Verifique se o MySQL está rodando:
- Windows: Abra Serviços e procure por "MySQL"
- Ou execute: `mysql -u root -p` para testar

### ❌ "Database already exists"
O banco pode ter sido criado anteriormente. Execute `pnpm test-db` para verificar.
