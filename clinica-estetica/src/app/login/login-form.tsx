"use client";

import { useActionState } from "react";
import { login } from "./actions";

export function LoginForm() {
  const [state, formAction, pending] = useActionState(login, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className="text-[12.5px] font-semibold text-muted">
          E-mail
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          className="rounded-[10px] border border-line bg-bg px-4 py-3 text-[14px] text-ink outline-none transition-colors focus:border-gold"
          placeholder="voce@clinica.com"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className="text-[12.5px] font-semibold text-muted">
          Senha
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          autoComplete="current-password"
          className="rounded-[10px] border border-line bg-bg px-4 py-3 text-[14px] text-ink outline-none transition-colors focus:border-gold"
          placeholder="••••••••"
        />
      </div>

      {state?.error && (
        <div className="rounded-[10px] border border-bad bg-badbg px-4 py-2.5 text-[12.5px] font-semibold text-bad">
          {state.error}
        </div>
      )}

      <button
        type="submit"
        disabled={pending}
        className="mt-2 rounded-[10px] bg-gradient-to-br from-gold to-gold2 px-5 py-3 text-[13.5px] font-bold text-[#fffdfa] transition-opacity disabled:opacity-60"
      >
        {pending ? "Entrando…" : "Entrar"}
      </button>
    </form>
  );
}
