"use client";

import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { formatCurrency } from "@/lib/utils";
import { FaturamentoMensal } from "@/types";

interface FaturamentoChartProps {
  data: FaturamentoMensal[];
}

export function FaturamentoChart({ data }: FaturamentoChartProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
      <h3 className="text-base font-semibold text-gray-800 mb-6">
        Faturamento vs Despesas (últimos 6 meses)
      </h3>
      <ResponsiveContainer width="100%" height={280}>
        <AreaChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="receitas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#f97316" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="despesas" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#ef4444" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="lucro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
          <XAxis dataKey="mes" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(v) => `R$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 12 }} />
          <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          <Legend />
          <Area type="monotone" dataKey="receitas" name="Receitas" stroke="#f97316" fill="url(#receitas)" strokeWidth={2} />
          <Area type="monotone" dataKey="despesas" name="Despesas" stroke="#ef4444" fill="url(#despesas)" strokeWidth={2} />
          <Area type="monotone" dataKey="lucro" name="Lucro" stroke="#22c55e" fill="url(#lucro)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
