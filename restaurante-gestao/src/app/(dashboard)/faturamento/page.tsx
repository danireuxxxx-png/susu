"use client";

import { useState } from "react";
import { FaturamentoChart } from "@/components/charts/faturamento-chart";
import { StatCard } from "@/components/dashboard/stat-card";
import { formatCurrency } from "@/lib/utils";
import { DollarSign, TrendingUp, TrendingDown, Receipt } from "lucide-react";
import { FaturamentoMensal } from "@/types";

const chartData: FaturamentoMensal[] = [
  { mes: "Jan", receitas: 42000, despesas: 28000, lucro: 14000 },
  { mes: "Fev", receitas: 38000, despesas: 25000, lucro: 13000 },
  { mes: "Mar", receitas: 51000, despesas: 31000, lucro: 20000 },
  { mes: "Abr", receitas: 47000, despesas: 29000, lucro: 18000 },
  { mes: "Mai", receitas: 58000, despesas: 33000, lucro: 25000 },
  { mes: "Jun", receitas: 62000, despesas: 35000, lucro: 27000 },
];

const vendasRecentes = [
  { id: "V001", data: "21/06/2026", cliente: "Mesa 12", total: 287.50, forma: "PIX", status: "PAGO" },
  { id: "V002", data: "21/06/2026", cliente: "Mesa 7", total: 145.00, forma: "CARTAO_CREDITO", status: "PAGO" },
  { id: "V003", data: "21/06/2026", cliente: "Delivery #45", total: 92.80, forma: "PIX", status: "PAGO" },
  { id: "V004", data: "21/06/2026", cliente: "Mesa 3", total: 320.00, forma: "DINHEIRO", status: "PENDENTE" },
];

const formaLabel: Record<string, string> = {
  PIX: "PIX",
  CARTAO_CREDITO: "Cartão Crédito",
  CARTAO_DEBITO: "Cartão Débito",
  DINHEIRO: "Dinheiro",
  VALE: "Vale",
};

export default function FaturamentoPage() {
  const [periodo, setPeriodo] = useState<"semana" | "mes" | "ano">("mes");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Faturamento</h2>
          <p className="text-gray-500 text-sm mt-1">Controle financeiro completo</p>
        </div>
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          {(["semana", "mes", "ano"] as const).map((p) => (
            <button
              key={p}
              onClick={() => setPeriodo(p)}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors capitalize ${
                periodo === p ? "bg-white text-gray-800 shadow-sm" : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {p === "mes" ? "Mês" : p === "semana" ? "Semana" : "Ano"}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Receita Total" value={formatCurrency(62000)} change={6.9} icon={DollarSign} color="orange" />
        <StatCard title="Lucro Líquido" value={formatCurrency(27000)} change={8.0} icon={TrendingUp} color="green" />
        <StatCard title="Total Despesas" value={formatCurrency(35000)} change={3.1} icon={TrendingDown} color="red" />
        <StatCard title="Ticket Médio" value={formatCurrency(68.50)} change={2.3} icon={Receipt} color="blue" />
      </div>

      <FaturamentoChart data={chartData} />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Vendas Recentes</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3">Nº Venda</th>
                <th className="px-6 py-3">Data</th>
                <th className="px-6 py-3">Cliente/Mesa</th>
                <th className="px-6 py-3">Forma Pgto</th>
                <th className="px-6 py-3">Total</th>
                <th className="px-6 py-3">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendasRecentes.map((v) => (
                <tr key={v.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-orange-600">{v.id}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{v.data}</td>
                  <td className="px-6 py-4 text-sm text-gray-800">{v.cliente}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formaLabel[v.forma]}</td>
                  <td className="px-6 py-4 text-sm font-semibold text-gray-800">{formatCurrency(v.total)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      v.status === "PAGO" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {v.status === "PAGO" ? "Pago" : "Pendente"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
