export function ProgressBar({
  percent,
  color = "linear-gradient(90deg,var(--gold),var(--gold2))",
  height = 6,
}: {
  percent: number;
  color?: string;
  height?: number;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  return (
    <div
      className="rounded-full bg-card2"
      style={{ height }}
    >
      <div
        className="rounded-full transition-[width] duration-500"
        style={{ height, width: `${clamped}%`, background: color }}
      />
    </div>
  );
}
