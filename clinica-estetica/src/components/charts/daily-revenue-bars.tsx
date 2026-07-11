import { fmtBRL, fmtDateShort } from "@/lib/utils";

export function DailyRevenueBars({ data }: { data: { date: string; value: number }[] }) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div>
      <div className="flex h-[150px] items-end gap-1">
        {data.map((d, i) => (
          <div
            key={d.date}
            title={`${fmtDateShort(d.date)}: ${fmtBRL(d.value)}`}
            className="flex-1 rounded-t-[4px] rounded-b-[2px] transition-[height] duration-500 hover:!bg-gold"
            style={{
              height: `${Math.max((d.value / max) * 100, 2)}%`,
              background: i >= data.length - 3 ? "var(--gold2)" : "var(--goldsoft)",
            }}
          />
        ))}
      </div>
      <div className="mt-2.5 flex justify-between text-[10.5px] font-semibold text-muted">
        <span>{fmtDateShort(data[0].date)}</span>
        <span>{fmtDateShort(data[Math.floor(data.length * 0.33)].date)}</span>
        <span>{fmtDateShort(data[Math.floor(data.length * 0.66)].date)}</span>
        <span>{fmtDateShort(data[data.length - 1].date)}</span>
      </div>
    </div>
  );
}
