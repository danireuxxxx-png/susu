Faça uma revisão completa do código do sistema de restaurante.

## Checklist de revisão

### TypeScript
- [ ] Nenhum uso de `any` implícito
- [ ] Todos os props de componentes têm interfaces definidas
- [ ] Todas as funções async têm tratamento de erro
- [ ] Enums do Prisma estão sendo usados corretamente (não strings soltas)

### Performance
- [ ] Páginas Server Component buscam dados em paralelo com `Promise.all()`
- [ ] Imagens usam `next/image` com `width` e `height` definidos
- [ ] Componentes com `"use client"` são mínimos — apenas o necessário
- [ ] Não há `useEffect` buscando dados que poderiam ser Server Components

### Segurança
- [ ] API routes validam input com Zod antes de salvar no banco
- [ ] Rotas protegidas verificam autenticação
- [ ] Nenhuma variável de ambiente exposta no cliente (sem `NEXT_PUBLIC_` para segredos)
- [ ] Queries Prisma não recebem input do usuário diretamente (SQL injection)

### UX/Acessibilidade
- [ ] Todos os `<button>` têm `type="button"` (exceto submits de form)
- [ ] Formulários têm `<label>` associado a cada input
- [ ] Estados de loading durante fetch
- [ ] Mensagens de erro visíveis ao usuário

### Consistência visual
- [ ] Todas as páginas seguem o mesmo padrão de header (título + subtítulo + botão primário)
- [ ] Cores: orange-500 para primário, gray-* para texto, status com cores semânticas
- [ ] Tabelas com `hover:bg-gray-50` nas linhas e `divide-y divide-gray-100`

## O que fazer

Para cada problema encontrado:
1. Mostre o arquivo e linha
2. Explique o problema em uma frase
3. Aplique a correção diretamente

Ao final, rode `npm run build` e `npx tsc --noEmit` para confirmar zero erros.
