"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";
import { formatCurrency } from "@/lib/utils";
import { Download } from "lucide-react";

const vendasPorDia = [
  { dia: "Seg", valor: 8200 }, { dia: "Ter", valor: 7400 }, { dia: "Qua", valor: 9100 },
  { dia: "Qui", valor: 8700 }, { dia: "Sex", valor: 12500 }, { dia: "Sáb", valor: 15800 }, { dia: "Dom", valor: 11200 },
];

const categorias = [
  { name: "Pratos Principais", value: 45 },
  { name: "Bebidas", value: 22 },
  { name: "Entradas", value: 15 },
  { name: "Sobremesas", value: 10 },
  { name: "Outros", value: 8 },
];

const COLORS = ["#f97316", "#fb923c", "#fdba74", "#fed7aa", "#ffedd5"];

export default function RelatoriosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Relatórios</h2>
          <p className="text-gray-500 text-sm mt-1">Análise de dados do restaurante</p>
        </div>
        <button className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Download className="h-4 w-4" />
          Exportar PDF
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-6">Vendas por Dia da Semana</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={vendasPorDia}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="dia" tick={{ fontSize: 12 }} />
              <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
              <Tooltip formatter={(v) => formatCurrency(Number(v))} />
              <Bar dataKey="valor" name="Vendas" fill="#f97316" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="font-semibold text-gray-800 mb-6">Vendas por Categoria (%)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
              <Pie data={categorias} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, value }) => `${name}: ${value}%`} labelLine={false}>
                {categorias.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: "Melhor dia da semana", value: "Sábado", sub: "R$ 15.800 em média" },
          { label: "Produto mais vendido", value: "Frango Grelhado", sub: "234 unidades/mês" },
          { label: "Forma pgto preferida", value: "PIX", sub: "42% das transações" },
        ].map((item) => (
          <div key={item.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <p className="text-sm text-gray-500">{item.label}</p>
            <p className="text-xl font-bold text-gray-800 mt-1">{item.value}</p>
            <p className="text-xs text-orange-500 mt-1">{item.sub}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
