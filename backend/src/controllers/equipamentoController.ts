import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/db";
import { Equipamento, StatusEquipamento } from "../types";

const STATUS_VALIDOS: StatusEquipamento[] = ["disponivel", "emprestado", "manutencao"];

// GET /api/equipamentos?status=disponivel
export async function listarEquipamentos(req: Request, res: Response) {
  try {
    const { status } = req.query;

    let sql = "SELECT * FROM equipamentos";
    const params: any[] = [];

    if (status) {
      if (!STATUS_VALIDOS.includes(status as StatusEquipamento)) {
        return res.status(400).json({
          mensagem: `Status inválido. Use um de: ${STATUS_VALIDOS.join(", ")}.`,
        });
      }
      sql += " WHERE status = ?";
      params.push(status);
    }

    sql += " ORDER BY nome ASC";

    const [rows] = await pool.query<RowDataPacket[]>(sql, params);
    res.json(rows as Equipamento[]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao listar equipamentos." });
  }
}

// GET /api/equipamentos/:id
export async function buscarEquipamento(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM equipamentos WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ mensagem: "Equipamento não encontrado." });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao buscar equipamento." });
  }
}

// POST /api/equipamentos
export async function criarEquipamento(req: Request, res: Response) {
  try {
    const { nome, numero_patrimonio, categoria, observacoes, status } = req.body;

    if (!nome || !numero_patrimonio) {
      return res.status(400).json({
        mensagem: "Os campos 'nome' e 'numero_patrimonio' são obrigatórios.",
      });
    }

    if (status && !STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({
        mensagem: `Status inválido. Use um de: ${STATUS_VALIDOS.join(", ")}.`,
      });
    }

    const [existente] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM equipamentos WHERE numero_patrimonio = ?",
      [numero_patrimonio]
    );
    if (existente.length > 0) {
      return res.status(409).json({
        mensagem: "Já existe um equipamento cadastrado com esse número de patrimônio.",
      });
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO equipamentos (nome, numero_patrimonio, categoria, status, observacoes)
       VALUES (?, ?, ?, ?, ?)`,
      [nome, numero_patrimonio, categoria ?? null, status ?? "disponivel", observacoes ?? null]
    );

    res.status(201).json({
      id: result.insertId,
      nome,
      numero_patrimonio,
      categoria,
      status: status ?? "disponivel",
      observacoes,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao cadastrar equipamento." });
  }
}

// PUT /api/equipamentos/:id
export async function atualizarEquipamento(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nome, numero_patrimonio, categoria, observacoes, status } = req.body;

    if (!nome || !numero_patrimonio) {
      return res.status(400).json({
        mensagem: "Os campos 'nome' e 'numero_patrimonio' são obrigatórios.",
      });
    }

    if (status && !STATUS_VALIDOS.includes(status)) {
      return res.status(400).json({
        mensagem: `Status inválido. Use um de: ${STATUS_VALIDOS.join(", ")}.`,
      });
    }

    // Regra: não é permitido forçar status "disponivel" manualmente
    // enquanto houver um empréstimo ATIVO para esse equipamento
    if (status === "disponivel") {
      const [ativos] = await pool.query<RowDataPacket[]>(
        "SELECT id FROM emprestimos WHERE equipamento_id = ? AND status = 'ativo' LIMIT 1",
        [id]
      );
      if (ativos.length > 0) {
        return res.status(409).json({
          mensagem:
            "Não é possível marcar como 'disponivel': existe um empréstimo ativo para este equipamento. Registre a devolução primeiro.",
        });
      }
    }

    const [result] = await pool.query<ResultSetHeader>(
      `UPDATE equipamentos
       SET nome = ?, numero_patrimonio = ?, categoria = ?, status = ?, observacoes = ?
       WHERE id = ?`,
      [nome, numero_patrimonio, categoria ?? null, status ?? "disponivel", observacoes ?? null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Equipamento não encontrado." });
    }

    res.json({ id: Number(id), nome, numero_patrimonio, categoria, status, observacoes });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao atualizar equipamento." });
  }
}

// DELETE /api/equipamentos/:id
export async function excluirEquipamento(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [emprestimos] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM emprestimos WHERE equipamento_id = ? LIMIT 1",
      [id]
    );
    if (emprestimos.length > 0) {
      return res.status(409).json({
        mensagem:
          "Não é possível excluir: este equipamento possui empréstimos vinculados (histórico).",
      });
    }

    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM equipamentos WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Equipamento não encontrado." });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao excluir equipamento." });
  }
}
