Configure a conexão com banco de dados PostgreSQL para o sistema de restaurante.

## O que fazer

1. **Verifique o `.env`** — leia o arquivo `.env` atual para ver o estado da `DATABASE_URL`.

2. **Atualize o `src/lib/db.ts`** para usar a nova API do Prisma 7 com adapter:
```ts
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

function createPrismaClient() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
  return new PrismaClient({ adapter });
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
export const db = globalForPrisma.prisma ?? createPrismaClient();
if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;
```

3. **Rode as migrations**:
```bash
npx prisma migrate dev --name init --schema prisma/schema.prisma
```

4. **Crie o seed** em `prisma/seed.ts` com dados iniciais realistas:
   - 5 funcionários (cargos variados, salários reais)
   - 10 produtos no cardápio com preços e custos
   - 3 metas do mês atual
   - 20 vendas dos últimos 30 dias
   - Despesas dos últimos 3 meses

5. **Adicione o script de seed** no `package.json`:
```json
"prisma": { "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts" }
```

6. **Rode o seed**:
```bash
npx prisma db seed
```

7. **Substitua os dados mockados** nas páginas por queries reais usando `db` — comece pela página de dashboard (`src/app/(dashboard)/dashboard/page.tsx`), tornando-a `async` e buscando os dados reais.

Ao final, confirme com `npm run build` que tudo compila.
