import { formatCurrency } from "@/lib/utils";
import { CreditCard, FileText, Calendar, Plus } from "lucide-react";

const folha = [
  { nome: "Patrícia Rocha", cargo: "Gerente", salarioBase: 4500, bonus: 500, descontos: 620, total: 4380, pago: true },
  { nome: "Carlos Souza", cargo: "Cozinheiro", salarioBase: 2500, bonus: 200, descontos: 345, total: 2355, pago: true },
  { nome: "Ana Silva", cargo: "Garçonete", salarioBase: 1800, bonus: 150, descontos: 248, total: 1702, pago: false },
  { nome: "Fernanda Costa", cargo: "Caixa", salarioBase: 1600, bonus: 0, descontos: 220, total: 1380, pago: false },
  { nome: "Ricardo Lima", cargo: "Aux. Cozinha", salarioBase: 1400, bonus: 0, descontos: 193, total: 1207, pago: false },
];

const totalFolha = folha.reduce((acc, f) => acc + f.total, 0);
const totalPago = folha.filter((f) => f.pago).reduce((acc, f) => acc + f.total, 0);

export default function RHPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">RH & Folha de Pagamento</h2>
          <p className="text-gray-500 text-sm mt-1">Junho 2026</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <Plus className="h-4 w-4" />
          Processar Folha
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Total da Folha</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(totalFolha)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-green-50 rounded-lg">
              <CreditCard className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Já Pago</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(totalPago)}</p>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-amber-50 rounded-lg">
              <Calendar className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">A Pagar</p>
              <p className="text-xl font-bold text-gray-800">{formatCurrency(totalFolha - totalPago)}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Folha de Pagamento - Junho 2026</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3">Funcionário</th>
                <th className="px-6 py-3">Cargo</th>
                <th className="px-6 py-3">Salário Base</th>
                <th className="px-6 py-3">Bônus</th>
                <th className="px-6 py-3">Descontos</th>
                <th className="px-6 py-3">Total Líquido</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {folha.map((f, i) => (
                <tr key={i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold text-sm">
                        {f.nome.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-800">{f.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{f.cargo}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{formatCurrency(f.salarioBase)}</td>
                  <td className="px-6 py-4 text-sm text-green-600">+{formatCurrency(f.bonus)}</td>
                  <td className="px-6 py-4 text-sm text-red-500">-{formatCurrency(f.descontos)}</td>
                  <td className="px-6 py-4 text-sm font-bold text-gray-800">{formatCurrency(f.total)}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      f.pago ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                    }`}>
                      {f.pago ? "Pago" : "Pendente"}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {!f.pago && (
                      <button className="text-orange-500 hover:text-orange-700 text-sm font-medium">
                        Pagar
                      </button>
                    )}
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
