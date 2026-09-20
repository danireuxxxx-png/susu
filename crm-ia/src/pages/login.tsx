import { AlertCircle, ArrowRight } from 'lucide-react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Field, Input } from '@/components/ui/field'
import { Logo } from '@/components/layout/logo'
import { useSession } from '@/hooks/use-session'

/** Entrada do workspace. Só aparece quando há backend configurado. */
export function LoginPage() {
  const { signIn } = useSession()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signIn(email, password)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-canvas px-4 py-10">
      <div className="w-full max-w-sm">
        <Logo className="mb-8 justify-center" />

        <div className="rounded-card border border-line bg-surface p-6 shadow-elevated-md">
          <h1 className="text-lg font-semibold tracking-tight text-fg">Entrar no CRM</h1>
          <p className="mt-1 text-[13px] text-fg-muted">
            Use o e-mail e a senha da sua conta.
          </p>

          <form onSubmit={handleSubmit} className="mt-5 space-y-4">
            <Field label="E-mail" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="voce@empresa.com.br"
              />
            </Field>

            <Field label="Senha" htmlFor="password">
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </Field>

            {error ? (
              <p className="flex items-start gap-2 rounded-lg bg-critical-soft px-3 py-2 text-[13px] text-critical">
                <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
                {error}
              </p>
            ) : null}

            <Button type="submit" variant="primary" className="w-full" loading={loading}>
              Entrar
              <ArrowRight aria-hidden />
            </Button>
          </form>
        </div>

        <p className="mt-4 text-center text-[12px] text-fg-subtle">
          Problemas para entrar? Fale com quem administra o workspace.
        </p>
      </div>
    </div>
  )
}
