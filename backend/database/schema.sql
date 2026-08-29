-- =====================================================================
-- Projeto: Sistema de Controle de Almoxarifado (Empréstimo de Equipamentos)
-- Banco de Dados: MySQL 8+
-- =====================================================================

CREATE DATABASE IF NOT EXISTS almoxarifado
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE almoxarifado;

-- ---------------------------------------------------------------------
-- Tabela: alunos
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alunos (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  nome          VARCHAR(150) NOT NULL,
  matricula     VARCHAR(30)  NOT NULL,
  email         VARCHAR(150) NULL,
  turma         VARCHAR(60)  NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_alunos_matricula UNIQUE (matricula)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabela: equipamentos
-- status: reflete o estado ATUAL do item físico no almoxarifado
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS equipamentos (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  nome                VARCHAR(150) NOT NULL,
  numero_patrimonio   VARCHAR(50)  NOT NULL,
  categoria           VARCHAR(80)  NULL, -- Ex: Notebook, Multímetro, Kit de Robótica
  status              ENUM('disponivel', 'emprestado', 'manutencao') NOT NULL DEFAULT 'disponivel',
  observacoes         VARCHAR(255) NULL,
  created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT uq_equipamentos_patrimonio UNIQUE (numero_patrimonio)
) ENGINE=InnoDB;

-- ---------------------------------------------------------------------
-- Tabela: emprestimos (entidade associativa / histórico)
-- Regra crítica: registros aqui NUNCA são apagados (soft history).
-- status: 'ativo' enquanto o equipamento está com o aluno, 'devolvido'
-- quando finalizado. data_devolucao NULL == empréstimo em aberto.
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS emprestimos (
  id                      INT AUTO_INCREMENT PRIMARY KEY,
  aluno_id                INT NOT NULL,
  equipamento_id          INT NOT NULL,
  data_retirada           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  data_limite_devolucao   DATE NOT NULL,
  data_devolucao          DATETIME NULL,
  status                  ENUM('ativo', 'devolvido') NOT NULL DEFAULT 'ativo',
  observacoes             VARCHAR(255) NULL,
  created_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at              TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT fk_emprestimos_aluno
    FOREIGN KEY (aluno_id) REFERENCES alunos(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_emprestimos_equipamento
    FOREIGN KEY (equipamento_id) REFERENCES equipamentos(id)
    ON DELETE RESTRICT ON UPDATE CASCADE
) ENGINE=InnoDB;

CREATE INDEX idx_emprestimos_status ON emprestimos(status);
CREATE INDEX idx_emprestimos_aluno ON emprestimos(aluno_id);
CREATE INDEX idx_emprestimos_equipamento ON emprestimos(equipamento_id);
CREATE INDEX idx_equipamentos_status ON equipamentos(status);

-- =====================================================================
-- DADOS DE EXEMPLO (seed) - opcional, útil para testar a aplicação
-- =====================================================================

INSERT INTO alunos (nome, matricula, email, turma) VALUES
  ('Ana Beatriz Souza', '2024001', 'ana.souza@escola.edu.br', '3ºA - Informática'),
  ('Carlos Eduardo Lima', '2024002', 'carlos.lima@escola.edu.br', '3ºA - Informática'),
  ('Fernanda Alves', '2024003', 'fernanda.alves@escola.edu.br', '2ºB - Eletrônica'),
  ('João Pedro Martins', '2024004', 'joao.martins@escola.edu.br', '2ºB - Eletrônica');

INSERT INTO equipamentos (nome, numero_patrimonio, categoria, status) VALUES
  ('Notebook Dell Latitude 3420', 'PAT-0001', 'Notebook', 'disponivel'),
  ('Notebook Lenovo ThinkPad E14', 'PAT-0002', 'Notebook', 'disponivel'),
  ('Multímetro Digital Minipa ET-1002', 'PAT-0010', 'Multímetro', 'disponivel'),
  ('Multímetro Digital Fluke 115', 'PAT-0011', 'Multímetro', 'manutencao'),
  ('Kit de Robótica Arduino Uno', 'PAT-0020', 'Kit de Robótica', 'disponivel'),
  ('Kit de Robótica LEGO Mindstorms', 'PAT-0021', 'Kit de Robótica', 'disponivel');

-- Exemplo de um empréstimo já em atraso (para visualizar o dashboard)
INSERT INTO emprestimos (aluno_id, equipamento_id, data_retirada, data_limite_devolucao, status)
VALUES (1, 3, DATE_SUB(NOW(), INTERVAL 10 DAY), DATE_SUB(CURDATE(), INTERVAL 3 DAY), 'ativo');

UPDATE equipamentos SET status = 'emprestado' WHERE numero_patrimonio = 'PAT-0010';
