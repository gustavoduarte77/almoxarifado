import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/db";

const SELECT_DETALHADO = `
  SELECT
    e.id,
    e.aluno_id,
    e.equipamento_id,
    e.data_retirada,
    e.data_limite_devolucao,
    e.data_devolucao,
    e.status,
    e.observacoes,
    e.created_at,
    e.updated_at,
    a.nome  AS aluno_nome,
    a.matricula AS aluno_matricula,
    eq.nome AS equipamento_nome,
    eq.numero_patrimonio AS equipamento_patrimonio,
    (
      (e.status = 'ativo' AND e.data_limite_devolucao < CURDATE()) OR
      (e.status = 'devolvido' AND DATE(e.data_devolucao) > e.data_limite_devolucao)
    ) AS em_atraso
  FROM emprestimos e
  INNER JOIN alunos a ON a.id = e.aluno_id
  INNER JOIN equipamentos eq ON eq.id = e.equipamento_id
`;

// GET /api/emprestimos?status=ativo
export async function listarEmprestimos(req: Request, res: Response) {
  try {
    const { status } = req.query;

    let sql = SELECT_DETALHADO;
    const params: any[] = [];

    if (status === "ativo" || status === "devolvido") {
      sql += " WHERE e.status = ?";
      params.push(status);
    }

    sql += " ORDER BY e.data_retirada DESC";

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    res.json(
      rows.map((r) => ({ ...r, em_atraso: Boolean(r.em_atraso) }))
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao listar empréstimos." });
  }
}

// GET /api/emprestimos/atrasados
export async function listarAtrasados(req: Request, res: Response) {
  try {
    const sql =
      SELECT_DETALHADO +
      " WHERE e.status = 'ativo' AND e.data_limite_devolucao < CURDATE()" +
      " ORDER BY e.data_limite_devolucao ASC";

    const [rows] = await pool.query<RowDataPacket[]>(sql);
    res.json(rows.map((r) => ({ ...r, em_atraso: Boolean(r.em_atraso) })));
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao listar empréstimos em atraso." });
  }
}

// GET /api/emprestimos/:id
export async function buscarEmprestimo(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      SELECT_DETALHADO + " WHERE e.id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ mensagem: "Empréstimo não encontrado." });
    }
    const row = rows[0];
    res.json({ ...row, em_atraso: Boolean(row.em_atraso) });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao buscar empréstimo." });
  }
}

// POST /api/emprestimos
// Regra crítica: jamais permitir empréstimo se o equipamento não estiver 'disponivel'.
// Usa transação para garantir atomicidade entre a criação do empréstimo
// e a atualização do status do equipamento.
export async function criarEmprestimo(req: Request, res: Response) {
  const connection = await pool.getConnection();
  try {
    const { aluno_id, equipamento_id, data_limite_devolucao, observacoes } = req.body;

    if (!aluno_id || !equipamento_id || !data_limite_devolucao) {
      connection.release();
      return res.status(400).json({
        mensagem:
          "Os campos 'aluno_id', 'equipamento_id' e 'data_limite_devolucao' são obrigatórios.",
      });
    }

    await connection.beginTransaction();

    // Trava a linha do equipamento para evitar condição de corrida
    // (dois empréstimos simultâneos para o mesmo item)
    const [equipamentos] = await connection.query<RowDataPacket[]>(
      "SELECT id, status FROM equipamentos WHERE id = ? FOR UPDATE",
      [equipamento_id]
    );

    if (equipamentos.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ mensagem: "Equipamento não encontrado." });
    }

    if (equipamentos[0].status !== "disponivel") {
      await connection.rollback();
      connection.release();
      return res.status(400).json({
        mensagem: `Empréstimo não permitido: o equipamento está com status '${equipamentos[0].status}', não 'disponivel'.`,
      });
    }

    const [alunos] = await connection.query<RowDataPacket[]>(
      "SELECT id FROM alunos WHERE id = ?",
      [aluno_id]
    );
    if (alunos.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ mensagem: "Aluno não encontrado." });
    }

    const [result] = await connection.query<ResultSetHeader>(
      `INSERT INTO emprestimos (aluno_id, equipamento_id, data_limite_devolucao, observacoes, status)
       VALUES (?, ?, ?, ?, 'ativo')`,
      [aluno_id, equipamento_id, data_limite_devolucao, observacoes ?? null]
    );

    await connection.query(
      "UPDATE equipamentos SET status = 'emprestado' WHERE id = ?",
      [equipamento_id]
    );

    await connection.commit();
    connection.release();

    res.status(201).json({
      id: result.insertId,
      aluno_id,
      equipamento_id,
      data_limite_devolucao,
      status: "ativo",
      observacoes,
    });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao registrar empréstimo." });
  }
}

// PUT /api/emprestimos/:id/devolucao
// Registra a devolução, mas NUNCA apaga o registro (histórico permanente).
export async function registrarDevolucao(req: Request, res: Response) {
  const connection = await pool.getConnection();
  try {
    const { id } = req.params;
    const { observacoes } = req.body;

    await connection.beginTransaction();

    const [emprestimos] = await connection.query<RowDataPacket[]>(
      "SELECT id, equipamento_id, status FROM emprestimos WHERE id = ? FOR UPDATE",
      [id]
    );

    if (emprestimos.length === 0) {
      await connection.rollback();
      connection.release();
      return res.status(404).json({ mensagem: "Empréstimo não encontrado." });
    }

    if (emprestimos[0].status === "devolvido") {
      await connection.rollback();
      connection.release();
      return res.status(409).json({ mensagem: "Este empréstimo já foi devolvido." });
    }

    await connection.query(
      `UPDATE emprestimos
       SET status = 'devolvido', data_devolucao = NOW(), observacoes = COALESCE(?, observacoes)
       WHERE id = ?`,
      [observacoes ?? null, id]
    );

    await connection.query(
      "UPDATE equipamentos SET status = 'disponivel' WHERE id = ?",
      [emprestimos[0].equipamento_id]
    );

    await connection.commit();
    connection.release();

    res.json({ mensagem: "Devolução registrada com sucesso." });
  } catch (error) {
    await connection.rollback();
    connection.release();
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao registrar devolução." });
  }
}
