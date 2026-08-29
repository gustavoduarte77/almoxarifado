"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Aluno, Equipamento, EmprestimoDetalhado } from "@/types";

function formatarData(data: string) {
  const parteData = data.split(/[T\s]/)[0];
  const [ano, mes, dia] = parteData.split("-");

  if (!ano || !mes || !dia) return "—";

  return `${dia}/${mes}/${ano}`;
}

function amanha() {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString().split("T")[0];
}

export default function EmprestimosPage() {
  const [emprestimos, setEmprestimos] = useState<EmprestimoDetalhado[]>([]);
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  // Regra de interface: só equipamentos DISPONÍVEIS aparecem no formulário
  const [equipamentosDisponiveis, setEquipamentosDisponiveis] = useState<Equipamento[]>([]);
  const [filtro, setFiltro] = useState<"todos" | "ativo" | "devolvido">("ativo");

  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const [form, setForm] = useState({
    aluno_id: "",
    equipamento_id: "",
    data_limite_devolucao: amanha(),
    observacoes: "",
  });

  const [formDevolucao, setFormDevolucao] = useState({
    emprestimo_id: "",
    observacoes: "",
  });

  async function carregar() {
    try {
      setCarregando(true);
      const query = filtro === "todos" ? "" : `?status=${filtro}`;
      const [emprestimosData, alunosData, equipamentosData] = await Promise.all([
        api.get<EmprestimoDetalhado[]>(`/emprestimos${query}`),
        api.get<Aluno[]>("/alunos"),
        api.get<Equipamento[]>("/equipamentos?status=disponivel"),
      ]);
      setEmprestimos(emprestimosData);
      setAlunos(alunosData);
      setEquipamentosDisponiveis(equipamentosData);
      setErro(null);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar empréstimos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtro]);

  async function registrarEmprestimo(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      await api.post("/emprestimos", {
        aluno_id: Number(form.aluno_id),
        equipamento_id: Number(form.equipamento_id),
        data_limite_devolucao: form.data_limite_devolucao,
        observacoes: form.observacoes || undefined,
      });
      setForm({
        aluno_id: "",
        equipamento_id: "",
        data_limite_devolucao: amanha(),
        observacoes: "",
      });
      await carregar();
    } catch (e) {
      // Regra crítica da API: equipamento não disponível é rejeitado aqui
      setErro(e instanceof ApiError ? e.message : "Erro ao registrar empréstimo.");
    } finally {
      setSalvando(false);
    }
  }

  async function devolver(emprestimo: EmprestimoDetalhado) {
    if (!confirm(`Registrar devolução de "${emprestimo.equipamento_nome}"?`)) return;
    try {
      await api.put(`/emprestimos/${emprestimo.id}/devolucao`, {});
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao registrar devolução.");
    }
  }

  async function registrarDevolucao(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      await api.put(`/emprestimos/${formDevolucao.emprestimo_id}/devolucao`, {
        observacoes: formDevolucao.observacoes || undefined,
      });
      setFormDevolucao({
        emprestimo_id: "",
        observacoes: "",
      });
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao registrar devolução.");
    } finally {
      setSalvando(false);
    }
  }

  const emprestimosSelecionaveis = emprestimos.filter((emp) => emp.status === "ativo");

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Empréstimos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Registre a saída de equipamentos e controle as devoluções.
        </p>
      </div>

      {erro && (
        <div className="card border-red-200 bg-red-50 text-sm text-red-700">{erro}</div>
      )}

      <form onSubmit={registrarEmprestimo} className="card grid gap-4 sm:grid-cols-2">
        <h2 className="text-base font-semibold text-gray-900 sm:col-span-2">
          Registrar novo empréstimo
        </h2>

        <div>
          <label className="label">Aluno *</label>
          <select
            required
            className="input"
            value={form.aluno_id}
            onChange={(e) => setForm({ ...form, aluno_id: e.target.value })}
          >
            <option value="">Selecione um aluno</option>
            {alunos.map((a) => (
              <option key={a.id} value={a.id}>
                {a.nome} ({a.matricula})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="label">Equipamento (somente disponíveis) *</label>
          <select
            required
            className="input"
            value={form.equipamento_id}
            onChange={(e) => setForm({ ...form, equipamento_id: e.target.value })}
          >
            <option value="">Selecione um equipamento</option>
            {equipamentosDisponiveis.map((eq) => (
              <option key={eq.id} value={eq.id}>
                {eq.nome} ({eq.numero_patrimonio})
              </option>
            ))}
          </select>
          {equipamentosDisponiveis.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              Nenhum equipamento disponível no momento.
            </p>
          )}
        </div>

        <div>
          <label className="label">Data limite para devolução *</label>
          <input
            required
            type="date"
            className="input"
            value={form.data_limite_devolucao}
            onChange={(e) => setForm({ ...form, data_limite_devolucao: e.target.value })}
          />
        </div>

        <div>
          <label className="label">Observações</label>
          <input
            className="input"
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
          />
        </div>

        <div className="sm:col-span-2">
          <button type="submit" disabled={salvando} className="btn-primary">
            Registrar saída
          </button>
        </div>
      </form>

      <form onSubmit={registrarDevolucao} className="card grid gap-4 sm:grid-cols-2">
        <h2 className="text-base font-semibold text-gray-900 sm:col-span-2">
          Registrar devolução de equipamento
        </h2>

        <div>
          <label className="label">Empréstimo ativo *</label>
          <select
            required
            className="input"
            value={formDevolucao.emprestimo_id}
            onChange={(e) => setFormDevolucao({ ...formDevolucao, emprestimo_id: e.target.value })}
          >
            <option value="">Selecione um empréstimo</option>
            {emprestimosSelecionaveis.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.aluno_nome} - {emp.equipamento_nome} ({formatarData(emp.data_retirada)})
              </option>
            ))}
          </select>
          {emprestimosSelecionaveis.length === 0 && (
            <p className="mt-1 text-xs text-amber-600">
              Nenhum empréstimo ativo no momento.
            </p>
          )}
        </div>

        <div>
          <label className="label">Observações</label>
          <input
            className="input"
            value={formDevolucao.observacoes}
            onChange={(e) => setFormDevolucao({ ...formDevolucao, observacoes: e.target.value })}
          />
        </div>

        <div className="sm:col-span-2">
          <button type="submit" disabled={salvando || !formDevolucao.emprestimo_id} className="btn-primary">
            Registrar devolução
          </button>
        </div>
      </form>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Histórico de empréstimos</h2>
          <div className="flex gap-1 rounded-lg bg-gray-100 p-1 text-sm">
            {(["ativo", "devolvido", "todos"] as const).map((opcao) => (
              <button
                key={opcao}
                onClick={() => setFiltro(opcao)}
                className={`rounded-md px-3 py-1.5 font-medium transition ${
                  filtro === opcao
                    ? "bg-white text-brand-700 shadow-sm"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {opcao === "ativo" ? "Ativos" : opcao === "devolvido" ? "Devolvidos" : "Todos"}
              </button>
            ))}
          </div>
        </div>

        {carregando ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : emprestimos.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum empréstimo encontrado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th>Aluno</th>
                  <th>Equipamento</th>
                  <th>Retirada</th>
                  <th>Prazo</th>
                  <th>Devolução</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {emprestimos.map((emp) => (
                  <tr key={emp.id} className={emp.em_atraso ? "bg-red-50/40" : ""}>
                    <td>
                      {emp.aluno_nome}
                      <span className="ml-1 text-xs text-gray-500">
                        ({emp.aluno_matricula})
                      </span>
                    </td>
                    <td>
                      {emp.equipamento_nome}
                      <span className="ml-1 text-xs text-gray-500">
                        ({emp.equipamento_patrimonio})
                      </span>
                    </td>
                    <td>{formatarData(emp.data_retirada)}</td>
                    <td>{formatarData(emp.data_limite_devolucao)}</td>
                    <td>
                      {emp.data_devolucao ? formatarData(emp.data_devolucao) : "—"}
                    </td>
                    <td>
                      {emp.status === "devolvido" &&
                      emp.data_devolucao &&
                      emp.data_limite_devolucao &&
                      new Date(emp.data_devolucao).getTime() > new Date(`${emp.data_limite_devolucao}T23:59:59`).getTime() ? (
                        <span className="badge badge-atraso">Devolvido com atraso</span>
                      ) : emp.em_atraso ? (
                        <span className="badge badge-atraso">Em atraso</span>
                      ) : emp.status === "ativo" ? (
                        <span className="badge badge-emprestado">Ativo</span>
                      ) : (
                        <span className="badge badge-disponivel">Devolvido</span>
                      )}
                    </td>
                    <td>
                      {emp.status === "ativo" && (
                        <button
                          onClick={() => devolver(emp)}
                          className="btn-secondary px-3 py-1.5 text-xs"
                        >
                          Registrar devolução
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
