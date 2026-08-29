import { StatusEquipamento } from "@/types";

const LABELS: Record<StatusEquipamento, string> = {
  disponivel: "Disponível",
  emprestado: "Emprestado",
  manutencao: "Em manutenção",
};

export default function StatusBadge({ status }: { status: StatusEquipamento }) {
  return <span className={`badge badge-${status}`}>{LABELS[status]}</span>;
}
