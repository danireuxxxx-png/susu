Crie um novo módulo completo para o sistema de restaurante chamado "$ARGUMENTS".

Siga exatamente este padrão do projeto:
1. Crie `src/app/(dashboard)/$ARGUMENTS/page.tsx` com:
   - Header com título, subtítulo e botão "Novo [item]"
   - Tabela ou grid de cards com dados mockados realistas
   - Badges de status coloridos
   - Ações de Editar por linha
   - Layout idêntico às páginas existentes (funcionarios, rh, metas, etc.)

2. Adicione o item ao menu lateral em `src/components/layout/sidebar.tsx`:
   - Escolha o ícone mais adequado do lucide-react
   - Insira na posição lógica no array `navItems`

3. Use sempre:
   - `formatCurrency` de `@/lib/utils` para valores monetários
   - `formatDate` de `@/lib/utils` para datas
   - Classes Tailwind consistentes com o projeto (orange-500 para primário, gray-* para texto)
   - TypeScript estrito, sem `any`

4. Adicione o modelo Prisma correspondente em `prisma/schema.prisma` com todos os campos necessários.

Após criar, rode `npm run build` para confirmar que não há erros de TypeScript.
