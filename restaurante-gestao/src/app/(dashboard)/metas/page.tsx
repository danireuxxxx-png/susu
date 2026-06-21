import { Target, Plus, CheckCircle2, Clock, XCircle } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const metas = [
  { id: "1", titulo: "Faturamento Junho", tipo: "FATURAMENTO", valorAlvo: 70000, valorAtual: 62000, dataFim: "30/06/2026", status: "EM_ANDAMENTO" },
  { id: "2", titulo: "1000 Atendimentos", tipo: "ATENDIMENTOS", valorAlvo: 1000, valorAtual: 890, dataFim: "30/06/2026", status: "EM_ANDAMENTO" },
  { id: "3", titulo: "Nota 4.8 no iFood", tipo: "SATISFACAO", valorAlvo: 4.8, valorAtual: 4.6, dataFim: "30/06/2026", status: "EM_ANDAMENTO" },
  { id: "4", titulo: "Reduzir Desperdício", tipo: "REDUCAO_CUSTOS", valorAlvo: 5000, valorAtual: 5000, dataFim: "31/05/2026", status: "CONCLUIDA" },
  { id: "5", titulo: "Meta Aniversário", tipo: "FATURAMENTO", valorAlvo: 100000, valorAtual: 45000, dataFim: "28/02/2026", status: "NAO_ATINGIDA" },
];

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle2; color: string; bg: string }> = {
  EM_ANDAMENTO: { label: "Em Andamento", icon: Clock, color: "text-blue-600", bg: "bg-blue-50" },
  CONCLUIDA: { label: "Concluída", icon: CheckCircle2, color: "text-green-600", bg: "bg-green-50" },
  NAO_ATINGIDA: { label: "Não Atingida", icon: XCircle, color: "text-red-600", bg: "bg-red-50" },
};

function formatValor(tipo: string, valor: number) {
  if (tipo === "FATURAMENTO" || tipo === "REDUCAO_CUSTOS") return formatCurrency(valor);
  if (tipo === "SATISFACAO") return valor.toFixed(1);
  return valor.toString();
}

export default function MetasPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Metas</h2>
          <p className="text-gray-500 text-sm mt-1">Acompanhe os objetivos do restaurante</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          Nova Meta
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {metas.map((meta) => {
          const pct = Math.min((meta.valorAtual / meta.valorAlvo) * 100, 100);
          const cfg = statusConfig[meta.status];
          const Icon = cfg.icon;

          return (
            <div key={meta.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <p className="font-semibold text-gray-800">{meta.titulo}</p>
                  <p className="text-xs text-gray-400 mt-0.5">Prazo: {meta.dataFim}</p>
                </div>
                <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.color}`}>
                  <Icon className="h-3 w-3" />
                  {cfg.label}
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Progresso</span>
                  <span className="font-semibold text-gray-800">{pct.toFixed(0)}%</span>
                </div>
                <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${
                      meta.status === "CONCLUIDA"
                        ? "bg-green-500"
                        : meta.status === "NAO_ATINGIDA"
                        ? "bg-red-400"
                        : pct >= 80
                        ? "bg-orange-400"
                        : "bg-orange-300"
                    }`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-gray-400 pt-1">
                  <span>Atual: {formatValor(meta.tipo, meta.valorAtual)}</span>
                  <span>Alvo: {formatValor(meta.tipo, meta.valorAlvo)}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
