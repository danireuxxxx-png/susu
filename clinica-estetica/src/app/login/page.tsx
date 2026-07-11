import { LoginForm } from "./login-form";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-6">
      <div className="w-full max-w-[380px] rounded-2xl border border-line bg-card p-10 shadow-[var(--shadow)]">
        <div className="mb-8 text-center">
          <div className="font-serif text-[34px] font-medium tracking-wide text-ink">
            Élan<span className="text-gold">.</span>
          </div>
          <div className="mt-1 text-[10.5px] font-semibold uppercase tracking-[0.24em] text-muted">
            Estética Avançada
          </div>
        </div>
        <LoginForm />
      </div>
    </div>
  );
}
