import { Plan, colorOf, parseDate, planRange, monthsBetween } from "@/lib/timeline";

interface Props {
  plan: Plan;
}

// Calendar grid: months as columns, each task spans the months it touches.
export function CalendarGrid({ plan }: Props) {
  const { start, end } = planRange(plan);
  const months = monthsBetween(start, end);
  const monthIndex = (d: Date) =>
    (d.getFullYear() - start.getFullYear()) * 12 + (d.getMonth() - start.getMonth());

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border bg-card p-8"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
            {plan.title}
          </h2>
          {plan.subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{plan.subtitle}</p>
          )}
        </div>
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Calendar Grid
        </span>
      </header>

      <div
        className="grid gap-1"
        style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0,1fr))` }}
      >
        {months.map((m, i) => (
          <div
            key={i}
            className="rounded-lg px-2 py-2 text-center text-xs font-bold uppercase tracking-widest"
            style={{
              background: m.getMonth() % 3 === 0 ? "var(--tl-soft)" : "transparent",
              color: "var(--tl-ink)",
              borderBottom: "2px solid var(--tl-rule)",
            }}
          >
            <div className="text-[9px] opacity-60">
              {m.getMonth() === 0 ? m.getFullYear() : ""}
            </div>
            {m.toLocaleString("en", { month: "short" })}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        {plan.tasks.map((t) => {
          const sd = parseDate(t.start);
          const ed = parseDate(t.end || t.start);
          const startCol = Math.max(0, monthIndex(sd)) + 1;
          const endCol = Math.min(months.length, monthIndex(ed) + 1) + 1;
          const isMilestone = t.kind === "milestone" || !t.end;
          const fill = colorOf(t.color);
          return (
            <div
              key={t.id}
              className="grid gap-1"
              style={{ gridTemplateColumns: `repeat(${months.length}, minmax(0,1fr))` }}
            >
              <div
                className="flex h-9 items-center overflow-hidden rounded-lg px-3 text-xs font-semibold text-white shadow-sm"
                style={{
                  gridColumn: `${startCol} / ${Math.max(startCol + 1, endCol)}`,
                  background: isMilestone
                    ? `repeating-linear-gradient(45deg, ${fill}, ${fill} 6px, color-mix(in oklab, ${fill} 60%, white) 6px, color-mix(in oklab, ${fill} 60%, white) 12px)`
                    : `linear-gradient(90deg, ${fill}, color-mix(in oklab, ${fill} 65%, white))`,
                  border: isMilestone ? `1px dashed ${fill}` : "none",
                }}
              >
                <span className="truncate">
                  {isMilestone ? "◆ " : ""}
                  {t.name}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}