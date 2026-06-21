Adicione exportação de relatório em PDF e Excel para a página "$ARGUMENTS" do sistema de restaurante.

## O que implementar

### 1. Instale as dependências
```bash
npm install jspdf jspdf-autotable xlsx
npm install -D @types/jspdf
```

### 2. Crie `src/lib/export.ts` com duas funções

**exportToPDF(titulo, colunas, dados)**:
- Use `jsPDF` com orientação "landscape" para tabelas largas
- Adicione cabeçalho com logo texto "RestaurantePRO" e data atual
- Use `autoTable` para renderizar a tabela
- Rodapé com número de páginas
- `doc.save("relatorio-[titulo]-[data].pdf")`

**exportToExcel(titulo, dados)**:
- Use `xlsx` para criar workbook
- Primeira linha em negrito como cabeçalho
- `XLSX.writeFile(wb, "relatorio-[titulo]-[data].xlsx")`

### 3. Adicione botões na página `src/app/(dashboard)/$ARGUMENTS/page.tsx`
```tsx
"use client";
import { exportToPDF, exportToExcel } from "@/lib/export";

// No header da página:
<div className="flex gap-2">
  <button onClick={() => exportToPDF(...)} className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
    <FileText className="h-4 w-4" /> Exportar PDF
  </button>
  <button onClick={() => exportToExcel(...)} className="flex items-center gap-2 border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors">
    <Download className="h-4 w-4" /> Exportar Excel
  </button>
</div>
```

### 4. Dados para exportar
Passe os dados já exibidos na tabela — não faça nova requisição. Se a página for Server Component, transforme apenas a parte do botão em Client Component separado recebendo `data` como prop.

Após implementar, rode `npm run build` para confirmar.
