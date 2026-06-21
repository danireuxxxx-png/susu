import { StatCard } from "@/components/dashboard/stat-card";
import { FaturamentoChart } from "@/components/charts/faturamento-chart";
import { DollarSign, Users, Target, TrendingUp, ShoppingBag, AlertTriangle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";
import { FaturamentoMensal } from "@/types";

const mockChartData: FaturamentoMensal[] = [
  { mes: "Jan", receitas: 42000, despesas: 28000, lucro: 14000 },
  { mes: "Fev", receitas: 38000, despesas: 25000, lucro: 13000 },
  { mes: "Mar", receitas: 51000, despesas: 31000, lucro: 20000 },
  { mes: "Abr", receitas: 47000, despesas: 29000, lucro: 18000 },
  { mes: "Mai", receitas: 58000, despesas: 33000, lucro: 25000 },
  { mes: "Jun", receitas: 62000, despesas: 35000, lucro: 27000 },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">Visão geral do restaurante</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard
          title="Faturamento do Mês"
          value={formatCurrency(62000)}
          change={6.9}
          icon={DollarSign}
          color="orange"
        />
        <StatCard
          title="Lucro do Mês"
          value={formatCurrency(27000)}
          change={8.0}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title="Vendas Hoje"
          value="47"
          change={12.5}
          icon={ShoppingBag}
          color="blue"
        />
        <StatCard
          title="Funcionários Ativos"
          value="23"
          icon={Users}
          color="purple"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <FaturamentoChart data={mockChartData} />
        </div>

        <div className="space-y-4">
          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-4">Metas do Mês</h3>
            <div className="space-y-4">
              {[
                { label: "Faturamento", atual: 62000, alvo: 70000 },
                { label: "Atendimentos", atual: 890, alvo: 1000 },
                { label: "Satisfação", atual: 4.6, alvo: 5.0 },
              ].map((meta) => {
                const pct = Math.min((meta.atual / meta.alvo) * 100, 100);
                return (
                  <div key={meta.label}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{meta.label}</span>
                      <span className="text-gray-500">{pct.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${pct >= 80 ? "bg-green-500" : "bg-orange-400"}`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
            <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-500" />
              Alertas
            </h3>
            <div className="space-y-3">
              <div className="text-sm p-3 bg-amber-50 text-amber-700 rounded-lg">
                Estoque de frango abaixo do mínimo
              </div>
              <div className="text-sm p-3 bg-red-50 text-red-700 rounded-lg">
                2 funcionários com férias vencidas
              </div>
              <div className="text-sm p-3 bg-blue-50 text-blue-700 rounded-lg">
                Folha de pagamento vence em 5 dias
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
