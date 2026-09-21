import { Reveal } from "./reveal";
import { cn } from "@/lib/utils";

type Props = {
  eyebrow?: string;
  title: React.ReactNode;
  lead?: string;
  align?: "left" | "center";
  className?: string;
  /** Renders as h2 by default; pass h3 inside an already-nested section. */
  as?: "h2" | "h3";
};

export function SectionTitle({
  eyebrow,
  title,
  lead,
  align = "left",
  className,
  as: Heading = "h2",
}: Props) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4",
        align === "center" && "items-center text-center",
        className,
      )}
    >
      {eyebrow && (
        <Reveal>
          <p className="eyebrow flex items-center gap-3">
            <span
              aria-hidden
              className="inline-block h-px w-8 bg-accent"
            />
            {eyebrow}
          </p>
        </Reveal>
      )}

      <Reveal delay={80}>
        <Heading className="text-h2 max-w-[18ch]">{title}</Heading>
      </Reveal>

      {lead && (
        <Reveal delay={160}>
          <p
            className={cn(
              "text-lead text-ink-secondary max-w-[46ch]",
              align === "center" && "mx-auto",
            )}
          >
            {lead}
          </p>
        </Reveal>
      )}
    </div>
  );
}
