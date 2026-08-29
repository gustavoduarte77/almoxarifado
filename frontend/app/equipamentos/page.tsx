"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Equipamento, StatusEquipamento } from "@/types";
import StatusBadge from "@/components/StatusBadge";

const FORM_VAZIO = {
  nome: "",
  numero_patrimonio: "",
  categoria: "",
  status: "disponivel" as StatusEquipamento,
  observacoes: "",
};

export default function EquipamentosPage() {
  const [equipamentos, setEquipamentos] = useState<Equipamento[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState(FORM_VAZIO);

  async function carregar() {
    try {
      setCarregando(true);
      const data = await api.get<Equipamento[]>("/equipamentos");
      setEquipamentos(data);
      setErro(null);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar equipamentos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function editar(equipamento: Equipamento) {
    setEditandoId(equipamento.id);
    setForm({
      nome: equipamento.nome,
      numero_patrimonio: equipamento.numero_patrimonio,
      categoria: equipamento.categoria ?? "",
      status: equipamento.status,
      observacoes: equipamento.observacoes ?? "",
    });
  }

  function cancelarEdicao() {
    setEditandoId(null);
    setForm(FORM_VAZIO);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setSalvando(true);
    setErro(null);
    try {
      if (editandoId) {
        await api.put(`/equipamentos/${editandoId}`, form);
      } else {
        await api.post("/equipamentos", form);
      }
      cancelarEdicao();
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao salvar equipamento.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(equipamento: Equipamento) {
    if (!confirm(`Excluir o equipamento "${equipamento.nome}"?`)) return;
    try {
      await api.delete(`/equipamentos/${equipamento.id}`);
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir equipamento.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Equipamentos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Catálogo de notebooks, multímetros, kits de robótica e outros itens.
        </p>
      </div>

      {erro && (
        <div className="card border-red-200 bg-red-50 text-sm text-red-700">{erro}</div>
      )}

      <form onSubmit={salvar} className="card grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label">Nome *</label>
          <input
            required
            className="input"
            value={form.nome}
            onChange={(e) => setForm({ ...form, nome: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Número de patrimônio *</label>
          <input
            required
            className="input"
            value={form.numero_patrimonio}
            onChange={(e) => setForm({ ...form, numero_patrimonio: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Categoria</label>
          <input
            className="input"
            placeholder="Notebook, Multímetro, Kit de Robótica..."
            value={form.categoria}
            onChange={(e) => setForm({ ...form, categoria: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Status</label>
          <select
            className="input"
            value={form.status}
            onChange={(e) =>
              setForm({ ...form, status: e.target.value as StatusEquipamento })
            }
          >
            <option value="disponivel">Disponível</option>
            <option value="emprestado">Emprestado</option>
            <option value="manutencao">Em manutenção</option>
          </select>
          <p className="mt-1 text-xs text-gray-400">
            O status "Emprestado" é controlado automaticamente pelo fluxo de empréstimos.
          </p>
        </div>
        <div className="sm:col-span-2">
          <label className="label">Observações</label>
          <input
            className="input"
            value={form.observacoes}
            onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2 flex gap-3">
          <button type="submit" disabled={salvando} className="btn-primary">
            {editandoId ? "Salvar alterações" : "Cadastrar equipamento"}
          </button>
          {editandoId && (
            <button type="button" onClick={cancelarEdicao} className="btn-secondary">
              Cancelar
            </button>
          )}
        </div>
      </form>

      <div className="card overflow-x-auto">
        {carregando ? (
          <p className="text-sm text-gray-500">Carregando...</p>
        ) : equipamentos.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum equipamento cadastrado ainda.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th>Nome</th>
                <th>Patrimônio</th>
                <th>Categoria</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {equipamentos.map((eq) => (
                <tr key={eq.id}>
                  <td className="font-medium">{eq.nome}</td>
                  <td>{eq.numero_patrimonio}</td>
                  <td>{eq.categoria || "—"}</td>
                  <td>
                    <StatusBadge status={eq.status} />
                  </td>
                  <td className="flex gap-2">
                    <button onClick={() => editar(eq)} className="btn-secondary px-3 py-1.5 text-xs">
                      Editar
                    </button>
                    <button onClick={() => excluir(eq)} className="btn-danger">
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
