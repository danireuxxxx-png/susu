import { ButtonLink } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="shell flex min-h-[70svh] flex-col items-center justify-center gap-6 py-32 text-center">
      <p className="eyebrow">Erro 404</p>
      <h1 className="text-h1 max-w-[16ch]">Essa página não existe.</h1>
      <p className="max-w-[44ch] text-lead text-ink-secondary">
        O link pode ter mudado, ou o produto saiu do catálogo. O caminho de
        volta está logo abaixo.
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-3">
        <ButtonLink href="/" size="lg">
          Voltar ao início
        </ButtonLink>
        <ButtonLink href="/smartphones" variant="secondary" size="lg">
          Ver smartphones
        </ButtonLink>
      </div>
    </div>
  );
}
