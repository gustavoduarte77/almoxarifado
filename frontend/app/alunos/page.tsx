"use client";

import { useEffect, useState } from "react";
import { api, ApiError } from "@/lib/api";
import { Aluno } from "@/types";

const FORM_VAZIO = { nome: "", matricula: "", email: "", turma: "" };

export default function AlunosPage() {
  const [alunos, setAlunos] = useState<Aluno[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);
  const [editandoId, setEditandoId] = useState<number | null>(null);
  const [form, setForm] = useState(FORM_VAZIO);

  async function carregar() {
    try {
      setCarregando(true);
      const data = await api.get<Aluno[]>("/alunos");
      setAlunos(data);
      setErro(null);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao carregar alunos.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  function editar(aluno: Aluno) {
    setEditandoId(aluno.id);
    setForm({
      nome: aluno.nome,
      matricula: aluno.matricula,
      email: aluno.email ?? "",
      turma: aluno.turma ?? "",
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
        await api.put(`/alunos/${editandoId}`, form);
      } else {
        await api.post("/alunos", form);
      }
      cancelarEdicao();
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao salvar aluno.");
    } finally {
      setSalvando(false);
    }
  }

  async function excluir(aluno: Aluno) {
    if (!confirm(`Excluir o aluno "${aluno.nome}"?`)) return;
    try {
      await api.delete(`/alunos/${aluno.id}`);
      await carregar();
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Erro ao excluir aluno.");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Alunos</h1>
        <p className="mt-1 text-sm text-gray-500">
          Cadastro de alunos que podem realizar empréstimos.
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
          <label className="label">Matrícula *</label>
          <input
            required
            className="input"
            value={form.matricula}
            onChange={(e) => setForm({ ...form, matricula: e.target.value })}
          />
        </div>
        <div>
          <label className="label">E-mail</label>
          <input
            type="email"
            className="input"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Turma</label>
          <input
            className="input"
            value={form.turma}
            onChange={(e) => setForm({ ...form, turma: e.target.value })}
          />
        </div>
        <div className="sm:col-span-2 flex gap-3">
          <button type="submit" disabled={salvando} className="btn-primary">
            {editandoId ? "Salvar alterações" : "Cadastrar aluno"}
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
        ) : alunos.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum aluno cadastrado ainda.</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th>Nome</th>
                <th>Matrícula</th>
                <th>Turma</th>
                <th>E-mail</th>
                <th></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {alunos.map((aluno) => (
                <tr key={aluno.id}>
                  <td className="font-medium">{aluno.nome}</td>
                  <td>{aluno.matricula}</td>
                  <td>{aluno.turma || "—"}</td>
                  <td>{aluno.email || "—"}</td>
                  <td className="flex gap-2">
                    <button onClick={() => editar(aluno)} className="btn-secondary px-3 py-1.5 text-xs">
                      Editar
                    </button>
                    <button onClick={() => excluir(aluno)} className="btn-danger">
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
