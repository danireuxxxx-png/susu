import type { Metadata } from "next";
import { UserRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { store } from "@/lib/store";

export const metadata: Metadata = {
  title: "Minha conta",
  alternates: { canonical: "/conta" },
};

export default function ContaPage() {
  return (
    <div className="shell flex min-h-[60svh] flex-col items-center justify-center gap-6 py-32 text-center">
      <div className="grid size-16 place-items-center rounded-full bg-surface">
        <UserRound className="size-6 text-ink-muted" aria-hidden />
      </div>
      <h1 className="text-h2 max-w-[18ch]">Área do cliente em breve.</h1>
      <p className="max-w-[46ch] text-lead text-ink-secondary">
        Histórico de pedidos e acompanhamento de entrega chegam com a
        integração de pagamento. Até lá, o atendimento é direto com a loja.
      </p>
      <ButtonLink
        href={store.instagram.value.url}
        target="_blank"
        rel="noopener noreferrer"
        size="lg"
      >
        Falar com a loja
      </ButtonLink>
    </div>
  );
}
