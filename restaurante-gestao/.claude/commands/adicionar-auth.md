Implemente autenticação completa no sistema de restaurante usando NextAuth.js v5.

## Passos

### 1. Instale as dependências
```bash
npm install next-auth@beta bcryptjs
npm install -D @types/bcryptjs
```

### 2. Crie `src/lib/auth.ts`
Configure NextAuth com Credentials provider:
- Busque usuário no banco via `db.user.findUnique({ where: { email } })`
- Compare senha com `bcryptjs.compare(password, user.password)`
- Retorne `null` se inválido, ou o objeto de usuário
- Configure `session: { strategy: "jwt" }` e `pages: { signIn: "/login" }`

### 3. Crie `src/app/api/auth/[...nextauth]/route.ts`
```ts
import { handlers } from "@/lib/auth";
export const { GET, POST } = handlers;
```

### 4. Crie a página de login `src/app/(auth)/login/page.tsx`
- Formulário com email + senha
- Chame `signIn("credentials", { email, password, redirectTo: "/dashboard" })`
- Estilo: fundo branco, card centralizado, logo ChefHat laranja no topo
- Link "Esqueci a senha" (sem funcionalidade por ora)

### 5. Proteja as rotas com middleware `src/middleware.ts`
```ts
export { auth as middleware } from "@/lib/auth";
export const config = { matcher: ["/((?!login|api/auth|_next).*)"] };
```

### 6. Adicione variáveis de ambiente no `.env.example`
```
NEXTAUTH_SECRET="gere-com-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"
```

### 7. Atualize o Header
- Busque a sessão com `auth()` (server component) ou `useSession()` (client)
- Mostre nome e email do usuário logado
- Botão de logout chama `signOut()`

### 8. Crie um usuário admin inicial no seed (`prisma/seed.ts`):
```ts
await db.user.upsert({
  where: { email: "admin@restaurante.com" },
  update: {},
  create: { email: "admin@restaurante.com", name: "Admin", password: await bcrypt.hash("admin123", 12), role: "ADMIN" }
});
```

Após implementar, rode `npm run build` para confirmar.
