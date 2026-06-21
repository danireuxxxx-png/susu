import { Users, UserPlus, Search } from "lucide-react";

const funcionariosMock = [
  { id: "1", nome: "Ana Silva", cargo: "Garçonete", departamento: "Salão", salario: 1800, status: "ATIVO", dataAdmissao: "2022-03-15" },
  { id: "2", nome: "Carlos Souza", cargo: "Cozinheiro", departamento: "Cozinha", salario: 2500, status: "ATIVO", dataAdmissao: "2021-07-01" },
  { id: "3", nome: "Fernanda Costa", cargo: "Caixa", departamento: "Financeiro", salario: 1600, status: "ATIVO", dataAdmissao: "2023-01-10" },
  { id: "4", nome: "Ricardo Lima", cargo: "Auxiliar de Cozinha", departamento: "Cozinha", salario: 1400, status: "FERIAS", dataAdmissao: "2022-09-20" },
  { id: "5", nome: "Patrícia Rocha", cargo: "Gerente", departamento: "Administração", salario: 4500, status: "ATIVO", dataAdmissao: "2020-05-12" },
];

const statusBadge: Record<string, string> = {
  ATIVO: "bg-green-100 text-green-700",
  INATIVO: "bg-gray-100 text-gray-600",
  FERIAS: "bg-blue-100 text-blue-700",
  AFASTADO: "bg-amber-100 text-amber-700",
};

const statusLabel: Record<string, string> = {
  ATIVO: "Ativo",
  INATIVO: "Inativo",
  FERIAS: "Férias",
  AFASTADO: "Afastado",
};

export default function FuncionariosPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Funcionários</h2>
          <p className="text-gray-500 text-sm mt-1">{funcionariosMock.length} colaboradores cadastrados</p>
        </div>
        <button className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          <UserPlus className="h-4 w-4" />
          Novo Funcionário
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100">
        <div className="p-4 border-b border-gray-100 flex items-center gap-3">
          <Search className="h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar funcionário..."
            className="flex-1 text-sm outline-none text-gray-600 placeholder-gray-400"
          />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-xs font-semibold text-gray-500 uppercase tracking-wider bg-gray-50">
                <th className="px-6 py-3">Nome</th>
                <th className="px-6 py-3">Cargo</th>
                <th className="px-6 py-3">Departamento</th>
                <th className="px-6 py-3">Salário</th>
                <th className="px-6 py-3">Admissão</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {funcionariosMock.map((f) => (
                <tr key={f.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-semibold text-sm">
                        {f.nome.charAt(0)}
                      </div>
                      <span className="font-medium text-gray-800">{f.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{f.cargo}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{f.departamento}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">
                    R$ {f.salario.toLocaleString("pt-BR")}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {new Date(f.dataAdmissao).toLocaleDateString("pt-BR")}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusBadge[f.status]}`}>
                      {statusLabel[f.status]}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-orange-500 hover:text-orange-700 text-sm font-medium">Editar</button>
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
