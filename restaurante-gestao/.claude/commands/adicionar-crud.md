Implemente CRUD completo (criar, editar, deletar) para o módulo "$ARGUMENTS" do sistema de restaurante.

## O que criar

### 1. API Routes (`src/app/api/$ARGUMENTS/`)
- `route.ts` — GET (listar) e POST (criar)
- `[id]/route.ts` — GET (um item), PUT (editar), DELETE (deletar)

Use sempre:
```ts
import { db } from "@/lib/db";
import { NextResponse } from "next/server";
```
Retorne `NextResponse.json(dados)` para sucesso e `NextResponse.json({ error: "mensagem" }, { status: 400 })` para erro.

### 2. Validação com Zod
Crie schema de validação no início do `route.ts`:
```ts
import { z } from "zod";
const schema = z.object({ /* campos */ });
```

### 3. Modal de Criação/Edição
Crie `src/components/$ARGUMENTS/form-modal.tsx` como Client Component com:
- `"use client"` no topo
- `useState` para abrir/fechar
- `react-hook-form` + `@hookform/resolvers/zod` para validação
- Submit com `fetch` para a API route
- Botão de trigger e modal com overlay

### 4. Botão de Deletar
Na tabela da página, adicione coluna de ações com:
- Botão "Editar" que abre o modal com dados preenchidos
- Botão "Excluir" com confirmação via `window.confirm("Tem certeza?")`
- Ambos usam `fetch` para as API routes e depois fazem `router.refresh()`

### 5. Página atualizada
Torne a page.tsx `async`, remova dados mockados, busque com `db.[modelo].findMany()` e passe para os componentes.

Após implementar, rode `npm run build` para confirmar que não há erros TypeScript.
