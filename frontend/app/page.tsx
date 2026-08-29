"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { api, ApiError } from "@/lib/api";
import { ResumoDashboard, EmprestimoAtrasado } from "@/types";

function formatarData(data: string) {
  const [ano, mes, dia] = data.split("T")[0].split("-");
  return `${dia}/${mes}/${ano}`;
}

export default function DashboardPage() {
  const [resumo, setResumo] = useState<ResumoDashboard | null>(null);
  const [atrasados, setAtrasados] = useState<EmprestimoAtrasado[]>([]);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState<string | null>(null);

  async function carregar() {
    try {
      setCarregando(true);
      const [resumoData, atrasadosData] = await Promise.all([
        api.get<ResumoDashboard>("/dashboard/resumo"),
        api.get<EmprestimoAtrasado[]>("/dashboard/atrasados"),
      ]);
      setResumo(resumoData);
      setAtrasados(atrasadosData);
      setErro(null);
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : "Não foi possível carregar o painel.");
    } finally {
      setCarregando(false);
    }
  }

  useEffect(() => {
    carregar();
  }, []);

  if (carregando) {
    return <p className="text-gray-500">Carregando painel...</p>;
  }

  if (erro) {
    return (
      <div className="card border-red-200 bg-red-50 text-red-700">
        {erro}. Verifique se a API está rodando em{" "}
        <code>NEXT_PUBLIC_API_URL</code>.
      </div>
    );
  }

  const cards = [
    { label: "Equipamentos no total", valor: resumo?.total_equipamentos ?? 0 },
    { label: "Disponíveis agora", valor: resumo?.equipamentos_disponiveis ?? 0 },
    { label: "Emprestados", valor: resumo?.equipamentos_emprestados ?? 0 },
    { label: "Em manutenção", valor: resumo?.equipamentos_manutencao ?? 0 },
    { label: "Alunos cadastrados", valor: resumo?.total_alunos ?? 0 },
    { label: "Empréstimos ativos", valor: resumo?.emprestimos_ativos ?? 0 },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Painel de controle</h1>
        <p className="mt-1 text-sm text-gray-500">
          Resumo rápido da operação do almoxarifado.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => (
          <div key={c.label} className="card">
            <p className="text-2xl font-semibold text-gray-900">{c.valor}</p>
            <p className="mt-1 text-xs text-gray-500">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">
            Empréstimos em atraso{" "}
            {resumo && resumo.emprestimos_atrasados > 0 && (
              <span className="badge badge-atraso ml-2">
                {resumo.emprestimos_atrasados}
              </span>
            )}
          </h2>
          <Link href="/emprestimos" className="text-sm font-medium text-brand-600 hover:underline">
            Ver todos os empréstimos →
          </Link>
        </div>

        {atrasados.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nenhum empréstimo em atraso no momento. 🎉
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th>Aluno</th>
                  <th>Equipamento</th>
                  <th>Retirado em</th>
                  <th>Prazo</th>
                  <th>Atraso</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {atrasados.map((item) => (
                  <tr key={item.id} className="bg-red-50/40">
                    <td>
                      <span className="font-medium">{item.aluno_nome}</span>
                      <span className="ml-1 text-xs text-gray-500">
                        ({item.aluno_matricula})
                      </span>
                    </td>
                    <td>
                      {item.equipamento_nome}
                      <span className="ml-1 text-xs text-gray-500">
                        ({item.equipamento_patrimonio})
                      </span>
                    </td>
                    <td>{formatarData(item.data_retirada)}</td>
                    <td>{formatarData(item.data_limite_devolucao)}</td>
                    <td>
                      <span className="badge badge-atraso">
                        {item.dias_atraso} {item.dias_atraso === 1 ? "dia" : "dias"}
                      </span>
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
