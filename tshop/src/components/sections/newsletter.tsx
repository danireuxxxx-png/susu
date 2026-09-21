"use client";

import { useState } from "react";
import { ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Client-side validation only decides what to *show*. Any real submission
 * must be validated and rate-limited server-side before it reaches a list —
 * see README, "Antes de publicar".
 */
export function Newsletter() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">(
    "idle",
  );

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      setState("error");
      return;
    }
    setState("loading");
    // No endpoint is wired up: point this at a server action that validates
    // and stores the address. Never post straight to a third-party list from
    // the client with a key in the bundle.
    await new Promise((r) => setTimeout(r, 700));
    setState("done");
  };

  return (
    <section className="shell py-16" aria-labelledby="newsletter-title">
      <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-3">
          <p className="eyebrow">Novidades</p>
          <h2 id="newsletter-title" className="text-h3 max-w-[20ch]">
            Lançamentos e condições especiais, antes de todo mundo.
          </h2>
        </div>

        <form
          onSubmit={submit}
          className="w-full max-w-md"
          noValidate
        >
          {state === "done" ? (
            <p className="flex items-center gap-2.5 text-sm font-medium text-success">
              <Check className="size-4" aria-hidden />
              Pronto. Você está na lista.
            </p>
          ) : (
            <>
              <label htmlFor="newsletter-email" className="sr-only">
                Seu e-mail
              </label>
              <div
                className={cn(
                  "flex items-center gap-2 border-b pb-3 transition-colors duration-300",
                  state === "error"
                    ? "border-error"
                    : "border-line-strong focus-within:border-ink",
                )}
              >
                <input
                  id="newsletter-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (state === "error") setState("idle");
                  }}
                  placeholder="seu@email.com"
                  aria-invalid={state === "error"}
                  aria-describedby={state === "error" ? "newsletter-error" : undefined}
                  className="w-full bg-transparent text-base outline-none placeholder:text-ink-faint"
                />
                <Button
                  type="submit"
                  variant="icon"
                  size="sm"
                  loading={state === "loading"}
                  aria-label="Inscrever-se"
                >
                  {state !== "loading" && (
                    <ArrowRight className="size-4" aria-hidden />
                  )}
                </Button>
              </div>
              {state === "error" && (
                <p id="newsletter-error" className="mt-2 text-xs text-error">
                  Digite um e-mail válido.
                </p>
              )}
            </>
          )}
        </form>
      </div>
    </section>
  );
}
