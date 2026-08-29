# DER — Sistema de Controle de Almoxarifado

## Entidades e relacionamentos

- **alunos (1) ──── (N) emprestimos** : um aluno pode ter vários empréstimos ao longo do tempo, mas cada empréstimo pertence a um único aluno.
- **equipamentos (1) ──── (N) emprestimos** : um equipamento pode aparecer em vários empréstimos ao longo do tempo (histórico), mas cada registro de empréstimo se refere a um único equipamento.

A relação "lógica" entre `alunos` e `equipamentos` é N:N (um aluno pega vários equipamentos, um equipamento passa por vários alunos), mas ela é **resolvida por uma tabela associativa** (`emprestimos`), que carrega os atributos próprios do empréstimo (datas, status, observações). Essa é a modelagem correta porque:

1. Preserva o **histórico completo** (não apagamos linhas — regra de negócio obrigatória).
2. Permite guardar metadados do empréstimo (data de retirada, prazo, data de devolução real).
3. Facilita a consulta de "quem está com o quê" e "quem já usou tal equipamento no passado".

## Tabelas

### `alunos`
| Campo | Tipo | Observação |
|---|---|---|
| id | INT PK AI | |
| nome | VARCHAR(150) | |
| matricula | VARCHAR(30) | UNIQUE |
| email | VARCHAR(150) | opcional |
| turma | VARCHAR(60) | opcional |
| created_at / updated_at | TIMESTAMP | |

### `equipamentos`
| Campo | Tipo | Observação |
|---|---|---|
| id | INT PK AI | |
| nome | VARCHAR(150) | |
| numero_patrimonio | VARCHAR(50) | UNIQUE |
| categoria | VARCHAR(80) | Notebook / Multímetro / Kit de Robótica / ... |
| status | ENUM('disponivel','emprestado','manutencao') | reflete o estado físico **atual** |
| observacoes | VARCHAR(255) | opcional |
| created_at / updated_at | TIMESTAMP | |

### `emprestimos` (histórico — nunca sofre DELETE)
| Campo | Tipo | Observação |
|---|---|---|
| id | INT PK AI | |
| aluno_id | INT FK → alunos.id | |
| equipamento_id | INT FK → equipamentos.id | |
| data_retirada | DATETIME | preenchida na criação |
| data_limite_devolucao | DATE | definida pelo almoxarife |
| data_devolucao | DATETIME NULL | NULL = ainda em posse do aluno |
| status | ENUM('ativo','devolvido') | espelha se já foi finalizado |
| observacoes | VARCHAR(255) | opcional |
| created_at / updated_at | TIMESTAMP | |

**Atraso** é uma condição calculada (não uma coluna): `status = 'ativo' AND data_limite_devolucao < CURDATE()`.

O diagrama visual (crow's foot) foi apresentado na conversa; o mesmo conteúdo, em Mermaid, está reproduzido abaixo:

```
erDiagram
  ALUNOS ||--o{ EMPRESTIMOS : realiza
  EQUIPAMENTOS ||--o{ EMPRESTIMOS : e_alvo_de
  ALUNOS {
    int id PK
    string nome
    string matricula
    string email
  }
  EQUIPAMENTOS {
    int id PK
    string nome
    string numero_patrimonio
    string categoria
    enum status
  }
  EMPRESTIMOS {
    int id PK
    int aluno_id FK
    int equipamento_id FK
    datetime data_retirada
    date data_limite_devolucao
    datetime data_devolucao
    enum status
  }
```
