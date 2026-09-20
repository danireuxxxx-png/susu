/**
 * Conferência de um ambiente já publicado — de fora, como um usuário.
 *
 *   API_URL=https://sua-api.onrender.com \
 *   OWNER_EMAIL=voce@empresa.com OWNER_PASSWORD='...' \
 *   SITE_URL=https://seu-crm.vercel.app \
 *   npm run smoke
 *
 * Não toca no banco: só HTTP. Serve depois de cada deploy e é o que o
 * workflow "CRM — banco" roda na ação `conferir`.
 */
const apiUrl = (process.env.API_URL ?? '').replace(/\/+$/, '')
const siteUrl = (process.env.SITE_URL ?? '').replace(/\/+$/, '')
const email = process.env.OWNER_EMAIL
const password = process.env.OWNER_PASSWORD

if (!apiUrl) {
  console.error('Defina API_URL com o endereço da API publicada.')
  process.exit(1)
}

const base = apiUrl.endsWith('/api/v1') ? apiUrl.slice(0, -'/api/v1'.length) : apiUrl
const problems: string[] = []

const ok = (line: string) => console.log(`  ✓ ${line}`)
const bad = (line: string) => {
  console.log(`  ✗ ${line}`)
  problems.push(line)
}

async function json(response: Response): Promise<Record<string, unknown>> {
  try {
    return (await response.json()) as Record<string, unknown>
  } catch {
    return {}
  }
}

console.log(`\nConferindo ${base}\n${'─'.repeat(34)}`)

// 1. A API está de pé.
let token: string | undefined
try {
  const health = await fetch(`${base}/health`, { signal: AbortSignal.timeout(60_000) })
  if (health.ok) ok(`saúde da API (${health.status})`)
  else bad(`saúde da API devolveu ${health.status}`)
} catch (error) {
  bad(`API inacessível: ${(error as Error).message}`)
}

// 2. O login funciona de ponta a ponta.
if (email && password) {
  try {
    const response = await fetch(`${base}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(30_000),
    })

    if (!response.ok) {
      bad(`login devolveu ${response.status} — confira SUPABASE_URL e SUPABASE_ANON_KEY na API`)
    } else {
      const body = await json(response)
      const data = body.data as { session?: { accessToken?: string }; memberships?: unknown[] } | undefined
      token = data?.session?.accessToken
      const memberships = data?.memberships?.length ?? 0
      if (token) ok(`login (${memberships} organização(ões))`)
      else bad('login respondeu sem token')
      if (memberships === 0) bad('o usuário não pertence a nenhuma organização — rode a instalação do banco')
    }
  } catch (error) {
    bad(`login falhou: ${(error as Error).message}`)
  }
} else {
  console.log('  · login não testado (sem OWNER_EMAIL/OWNER_PASSWORD)')
}

// 3. Os números vêm do backend.
if (token) {
  try {
    const response = await fetch(`${base}/api/v1/dashboard/summary`, {
      headers: { authorization: `Bearer ${token}` },
      signal: AbortSignal.timeout(30_000),
    })
    if (!response.ok) {
      bad(`dashboard devolveu ${response.status} — confira SUPABASE_JWT_SECRET`)
    } else {
      const body = await json(response)
      const summary = body.data as Record<string, unknown> | undefined
      ok(`cálculos financeiros respondendo (${Object.keys(summary ?? {}).length} indicadores)`)
    }
  } catch (error) {
    bad(`dashboard falhou: ${(error as Error).message}`)
  }
}

// 4. O site responde e está apontado para esta API.
if (siteUrl) {
  try {
    const response = await fetch(siteUrl, { signal: AbortSignal.timeout(30_000) })
    if (response.ok) ok(`site no ar (${response.status})`)
    else bad(`site devolveu ${response.status}`)

    // O CORS é o erro mais comum depois de publicar: pergunta-se à API
    // se ela aceitaria o domínio do site.
    const preflight = await fetch(`${base}/api/v1/auth/login`, {
      method: 'OPTIONS',
      headers: {
        origin: siteUrl,
        'access-control-request-method': 'POST',
        'access-control-request-headers': 'content-type',
      },
      signal: AbortSignal.timeout(30_000),
    })
    const allowed = preflight.headers.get('access-control-allow-origin')
    if (allowed && (allowed === '*' || allowed.includes(new URL(siteUrl).host))) ok('CORS libera o site')
    else bad(`CORS não libera ${siteUrl} — inclua o domínio em CORS_ORIGINS na API`)
  } catch (error) {
    bad(`site falhou: ${(error as Error).message}`)
  }
} else {
  console.log('  · site não testado (sem SITE_URL)')
}

console.log('─'.repeat(34))

if (problems.length) {
  console.error(`\n${problems.length} problema(s):`)
  for (const problem of problems) console.error(`  · ${problem}`)
  process.exit(1)
}

console.log('\nTudo no ar.\n')
