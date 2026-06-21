Adicione um novo gráfico à página "$ARGUMENTS" do sistema de restaurante.

Siga estas regras do projeto:
1. Crie o componente em `src/components/charts/[nome]-chart.tsx`
   - Use `"use client"` no topo
   - Importe de `recharts`: escolha o tipo mais adequado para os dados (AreaChart, BarChart, LineChart, PieChart, RadarChart)
   - Use `ResponsiveContainer width="100%" height={280}`
   - Paleta de cores do projeto: primário `#f97316` (orange), sucesso `#22c55e`, erro `#ef4444`, info `#3b82f6`
   - Sempre use `formatCurrency` do `@/lib/utils` no Tooltip formatter: `formatter={(v) => formatCurrency(Number(v))}`
   - Adicione `CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0"` para legibilidade
   - Exporte como named export

2. Envolva o componente em um card branco:
   ```tsx
   <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
     <h3 className="font-semibold text-gray-800 mb-6">Título do Gráfico</h3>
     <ComponenteDoGrafico />
   </div>
   ```

3. Importe e adicione o gráfico na página `src/app/(dashboard)/$ARGUMENTS/page.tsx`.

4. Use dados mockados realistas de restaurante (meses em pt-BR: Jan, Fev, Mar...).

Após criar, rode `npm run build` para garantir que não há erros TypeScript.
