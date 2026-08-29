export type StatusEquipamento = "disponivel" | "emprestado" | "manutencao";
export type StatusEmprestimo = "ativo" | "devolvido";

export interface Aluno {
  id: number;
  nome: string;
  matricula: string;
  email?: string | null;
  turma?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Equipamento {
  id: number;
  nome: string;
  numero_patrimonio: string;
  categoria?: string | null;
  status: StatusEquipamento;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface Emprestimo {
  id: number;
  aluno_id: number;
  equipamento_id: number;
  data_retirada: string;
  data_limite_devolucao: string;
  data_devolucao: string | null;
  status: StatusEmprestimo;
  observacoes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface EmprestimoDetalhado extends Emprestimo {
  aluno_nome: string;
  aluno_matricula: string;
  equipamento_nome: string;
  equipamento_patrimonio: string;
  em_atraso: boolean;
}
