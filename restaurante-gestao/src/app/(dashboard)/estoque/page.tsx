import { Package, AlertTriangle, Plus } from "lucide-react";

const estoque = [
  { id: "1", nome: "Frango (kg)", categoria: "Carnes", quantidade: 8, minimo: 15, unidade: "kg", custo: 12.50 },
  { id: "2", nome: "Arroz (kg)", categoria: "Grãos", quantidade: 45, minimo: 20, unidade: "kg", custo: 4.80 },
  { id: "3", nome: "Feijão (kg)", categoria: "Grãos", quantidade: 18, minimo: 10, unidade: "kg", custo: 7.20 },
  { id: "4", nome: "Óleo de Soja (L)", categoria: "Outros", quantidade: 6, minimo: 8, unidade: "L", custo: 9.90 },
  { id: "5", nome: "Tomate (kg)", categoria: "Vegetais", quantidade: 12, minimo: 5, unidade: "kg", custo: 5.50 },
  { id: "6", nome: "Refrigerante 2L", categoria: "Bebidas", quantidade: 48, minimo: 24, unidade: "un", custo: 6.00 },
];

export default function EstoquePage() {
  const criticos = estoque.filter((i) => i.quantidade < i.minimo);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Estoque</h2>
          <p className="text-gray-500 text-sm mt-1">{estoque.length} itens cadastrados</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          Adicionar Item
        </button>
      </div>

      {criticos.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 flex-shrink-0" />
          <div>
            <p className="font-medium text-amber-800">Itens abaixo do estoque mínimo</p>
            <p className="text-sm text-amber-700 mt-1">
              {criticos.map((i) => i.nome).join(", ")} precisam de reposição.
            </p>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3">Produto</th>
                <th className="px-6 py-3">Categoria</th>
                <th className="px-6 py-3">Qtd Atual</th>
                <th className="px-6 py-3">Mínimo</th>
                <th className="px-6 py-3">Custo Unit.</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {estoque.map((item) => {
                const critico = item.quantidade < item.minimo;
                return (
                  <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${critico ? "bg-red-50/30" : ""}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${critico ? "bg-red-100" : "bg-orange-100"}`}>
                          <Package className={`h-4 w-4 ${critico ? "text-red-500" : "text-orange-500"}`} />
                        </div>
                        <span className="font-medium text-gray-800">{item.nome}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{item.categoria}</td>
                    <td className="px-6 py-4">
                      <span className={`text-sm font-semibold ${critico ? "text-red-600" : "text-gray-800"}`}>
                        {item.quantidade} {item.unidade}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.minimo} {item.unidade}</td>
                    <td className="px-6 py-4 text-sm text-gray-700">R$ {item.custo.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                        critico ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                      }`}>
                        {critico ? "Repor" : "OK"}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <button className="text-orange-500 hover:text-orange-700 text-sm font-medium mr-3">Editar</button>
                      <button className="text-blue-500 hover:text-blue-700 text-sm font-medium">Entrada</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
