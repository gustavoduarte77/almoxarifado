export type StatusEquipamento = "disponivel" | "emprestado" | "manutencao";
export type StatusEmprestimo = "ativo" | "devolvido";

export interface Aluno {
  id: number;
  nome: string;
  matricula: string;
  email?: string | null;
  turma?: string | null;
}

export interface Equipamento {
  id: number;
  nome: string;
  numero_patrimonio: string;
  categoria?: string | null;
  status: StatusEquipamento;
  observacoes?: string | null;
}

export interface EmprestimoDetalhado {
  id: number;
  aluno_id: number;
  equipamento_id: number;
  data_retirada: string;
  data_limite_devolucao: string;
  data_devolucao: string | null;
  status: StatusEmprestimo;
  observacoes?: string | null;
  aluno_nome: string;
  aluno_matricula: string;
  equipamento_nome: string;
  equipamento_patrimonio: string;
  em_atraso: boolean;
}

export interface ResumoDashboard {
  total_equipamentos: number;
  equipamentos_disponiveis: number;
  equipamentos_emprestados: number;
  equipamentos_manutencao: number;
  total_alunos: number;
  emprestimos_ativos: number;
  emprestimos_atrasados: number;
}

export interface EmprestimoAtrasado {
  id: number;
  aluno_nome: string;
  aluno_matricula: string;
  equipamento_nome: string;
  equipamento_patrimonio: string;
  data_retirada: string;
  data_limite_devolucao: string;
  dias_atraso: number;
}
