import { Request, Response } from "express";
import { ResultSetHeader, RowDataPacket } from "mysql2";
import pool from "../config/db";
import { Aluno } from "../types";

// GET /api/alunos
export async function listarAlunos(req: Request, res: Response) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM alunos ORDER BY nome ASC"
    );
    res.json(rows as Aluno[]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao listar alunos." });
  }
}

// GET /api/alunos/:id
export async function buscarAluno(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT * FROM alunos WHERE id = ?",
      [id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ mensagem: "Aluno não encontrado." });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao buscar aluno." });
  }
}

// POST /api/alunos
export async function criarAluno(req: Request, res: Response) {
  try {
    const { nome, matricula, email, turma } = req.body;

    if (!nome || !matricula) {
      return res
        .status(400)
        .json({ mensagem: "Os campos 'nome' e 'matricula' são obrigatórios." });
    }

    const [existente] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM alunos WHERE matricula = ?",
      [matricula]
    );
    if (existente.length > 0) {
      return res
        .status(409)
        .json({ mensagem: "Já existe um aluno cadastrado com essa matrícula." });
    }

    const [result] = await pool.query<ResultSetHeader>(
      "INSERT INTO alunos (nome, matricula, email, turma) VALUES (?, ?, ?, ?)",
      [nome, matricula, email ?? null, turma ?? null]
    );

    res.status(201).json({ id: result.insertId, nome, matricula, email, turma });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao cadastrar aluno." });
  }
}

// PUT /api/alunos/:id
export async function atualizarAluno(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const { nome, matricula, email, turma } = req.body;

    if (!nome || !matricula) {
      return res
        .status(400)
        .json({ mensagem: "Os campos 'nome' e 'matricula' são obrigatórios." });
    }

    const [result] = await pool.query<ResultSetHeader>(
      "UPDATE alunos SET nome = ?, matricula = ?, email = ?, turma = ? WHERE id = ?",
      [nome, matricula, email ?? null, turma ?? null, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Aluno não encontrado." });
    }

    res.json({ id: Number(id), nome, matricula, email, turma });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao atualizar aluno." });
  }
}

// DELETE /api/alunos/:id
export async function excluirAluno(req: Request, res: Response) {
  try {
    const { id } = req.params;

    const [emprestimos] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM emprestimos WHERE aluno_id = ? LIMIT 1",
      [id]
    );
    if (emprestimos.length > 0) {
      return res.status(409).json({
        mensagem:
          "Não é possível excluir: este aluno possui empréstimos vinculados (histórico).",
      });
    }

    const [result] = await pool.query<ResultSetHeader>(
      "DELETE FROM alunos WHERE id = ?",
      [id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ mensagem: "Aluno não encontrado." });
    }

    res.status(204).send();
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao excluir aluno." });
  }
}
