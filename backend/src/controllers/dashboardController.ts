import { Request, Response } from "express";
import { RowDataPacket } from "mysql2";
import pool from "../config/db";

// GET /api/dashboard/resumo
export async function resumoDashboard(req: Request, res: Response) {
  try {
    const [equipamentosPorStatus] = await pool.query<RowDataPacket[]>(
      `SELECT status, COUNT(*) AS total FROM equipamentos GROUP BY status`
    );

    const [totalAlunos] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM alunos`
    );

    const [emprestimosAtivos] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM emprestimos WHERE status = 'ativo'`
    );

    const [emprestimosAtrasados] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM emprestimos
       WHERE status = 'ativo' AND data_limite_devolucao < CURDATE()`
    );

    const [totalEquipamentos] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM equipamentos`
    );

    const statusMap: Record<string, number> = {
      disponivel: 0,
      emprestado: 0,
      manutencao: 0,
    };
    for (const row of equipamentosPorStatus) {
      statusMap[row.status] = row.total;
    }

    res.json({
      total_equipamentos: totalEquipamentos[0].total,
      equipamentos_disponiveis: statusMap.disponivel,
      equipamentos_emprestados: statusMap.emprestado,
      equipamentos_manutencao: statusMap.manutencao,
      total_alunos: totalAlunos[0].total,
      emprestimos_ativos: emprestimosAtivos[0].total,
      emprestimos_atrasados: emprestimosAtrasados[0].total,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao carregar resumo do dashboard." });
  }
}

// GET /api/dashboard/atrasados
export async function atrasadosDashboard(req: Request, res: Response) {
  try {
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT
         e.id,
         a.nome AS aluno_nome,
         a.matricula AS aluno_matricula,
         eq.nome AS equipamento_nome,
         eq.numero_patrimonio AS equipamento_patrimonio,
         e.data_retirada,
         e.data_limite_devolucao,
         DATEDIFF(CURDATE(), e.data_limite_devolucao) AS dias_atraso
       FROM emprestimos e
       INNER JOIN alunos a ON a.id = e.aluno_id
       INNER JOIN equipamentos eq ON eq.id = e.equipamento_id
       WHERE e.status = 'ativo' AND e.data_limite_devolucao < CURDATE()
       ORDER BY dias_atraso DESC`
    );
    res.json(rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ mensagem: "Erro ao carregar empréstimos em atraso." });
  }
}
