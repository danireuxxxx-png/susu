import { UtensilsCrossed, Plus, ToggleLeft } from "lucide-react";
import { formatCurrency } from "@/lib/utils";

const produtos = [
  { id: "1", nome: "Frango Grelhado", categoria: "Pratos Principais", preco: 32.90, custo: 12.00, ativo: true },
  { id: "2", nome: "Picanha na Brasa", categoria: "Pratos Principais", preco: 68.00, custo: 28.00, ativo: true },
  { id: "3", nome: "Salada Caesar", categoria: "Entradas", preco: 22.00, custo: 6.50, ativo: true },
  { id: "4", nome: "Suco Natural", categoria: "Bebidas", preco: 12.00, custo: 3.00, ativo: true },
  { id: "5", nome: "Pudim de Leite", categoria: "Sobremesas", preco: 15.00, custo: 4.00, ativo: false },
  { id: "6", nome: "Combo Executivo", categoria: "Combos", preco: 45.00, custo: 16.00, ativo: true },
];

const categorias = [...new Set(produtos.map((p) => p.categoria))];

export default function CardapioPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Cardápio</h2>
          <p className="text-gray-500 text-sm mt-1">{produtos.filter((p) => p.ativo).length} itens ativos</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          Novo Prato
        </button>
      </div>

      {categorias.map((cat) => (
        <div key={cat}>
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">{cat}</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {produtos.filter((p) => p.categoria === cat).map((p) => {
              const margem = ((p.preco - p.custo) / p.preco * 100);
              return (
                <div key={p.id} className={`bg-white rounded-xl p-5 shadow-sm border ${p.ativo ? "border-gray-100" : "border-gray-200 opacity-60"}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-100 rounded-lg">
                        <UtensilsCrossed className="h-4 w-4 text-orange-500" />
                      </div>
                      <span className="font-semibold text-gray-800 text-sm">{p.nome}</span>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${p.ativo ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </div>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between text-gray-600">
                      <span>Preço de Venda:</span>
                      <span className="font-semibold text-gray-800">{formatCurrency(p.preco)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Custo:</span>
                      <span>{formatCurrency(p.custo)}</span>
                    </div>
                    <div className="flex justify-between text-gray-600">
                      <span>Margem:</span>
                      <span className={`font-semibold ${margem >= 50 ? "text-green-600" : "text-amber-600"}`}>
                        {margem.toFixed(0)}%
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4">
                    <button className="flex-1 text-orange-500 hover:text-orange-700 text-sm font-medium border border-orange-200 hover:border-orange-400 rounded-lg py-1.5 transition-colors">
                      Editar
                    </button>
                    <button className="flex-1 text-gray-500 hover:text-gray-700 text-sm font-medium border border-gray-200 hover:border-gray-400 rounded-lg py-1.5 transition-colors flex items-center justify-center gap-1">
                      <ToggleLeft className="h-3.5 w-3.5" />
                      {p.ativo ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
