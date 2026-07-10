import type { ReactNode } from "react";

export function PageHeader({
  eyebrow,
  title,
  action,
}: {
  eyebrow: string;
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-5">
      <div>
        <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold">
          {eyebrow}
        </div>
        <h1 className="mt-1.5 font-serif text-[40px] font-medium leading-none text-ink">
          {title}
        </h1>
      </div>
      {action}
    </div>
  );
}
