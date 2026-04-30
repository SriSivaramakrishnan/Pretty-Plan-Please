import {
  Plan,
  colorOf,
  monthsBetween,
  parseDate,
  pct,
  planRange,
  uniqueLanes,
  formatMonth,
} from "@/lib/timeline";

interface Props {
  plan: Plan;
}

export function SwimlaneGantt({ plan }: Props) {
  const { start, end } = planRange(plan);
  const months = monthsBetween(start, end);
  const lanes = uniqueLanes(plan);
  const rowH = 56;
  const headerH = 76;
  const labelW = 180;
  const totalH = headerH + lanes.length * rowH + 40;

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
          Swimlane Gantt
        </span>
      </header>

      <div className="relative" style={{ height: totalH }}>
        {/* Header months */}
        <div
          className="absolute left-0 right-0 top-0 flex border-b"
          style={{ paddingLeft: labelW, height: headerH }}
        >
          {months.map((m, i) => {
            const next = new Date(m.getFullYear(), m.getMonth() + 1, 1);
            const w = pct(next, start, end) - pct(m, start, end);
            const isQuarterStart = m.getMonth() % 3 === 0;
            return (
              <div
                key={i}
                className="flex flex-col justify-end pb-2"
                style={{ width: `${w}%` }}
              >
                {isQuarterStart && (
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">
                    Q{Math.floor(m.getMonth() / 3) + 1} {m.getFullYear()}
                  </div>
                )}
                <div className="text-xs font-medium text-foreground/80">
                  {formatMonth(m)}
                </div>
              </div>
            );
          })}
        </div>

        {/* Lanes */}
        {lanes.map((lane, li) => {
          const top = headerH + li * rowH;
          return (
            <div key={lane}>
              {/* lane label */}
              <div
                className="absolute left-0 flex items-center pr-3 text-sm font-semibold text-foreground"
                style={{ top, height: rowH, width: labelW }}
              >
                <span className="inline-block h-6 w-1 rounded-full bg-primary/70 mr-3" />
                {lane}
              </div>
              {/* lane track */}
              <div
                className="absolute right-0"
                style={{
                  top,
                  left: labelW,
                  height: rowH,
                  background:
                    li % 2 === 0 ? "var(--tl-soft)" : "transparent",
                  borderTop: "1px dashed var(--tl-rule)",
                }}
              />
              {/* month gridlines */}
              {months.map((m, i) => (
                <div
                  key={i}
                  className="absolute"
                  style={{
                    top,
                    height: rowH,
                    left: `calc(${labelW}px + ${pct(m, start, end)}% * (100% - ${labelW}px) / 100)`,
                    width: 1,
                    background:
                      m.getMonth() % 3 === 0
                        ? "var(--tl-rule)"
                        : "transparent",
                  }}
                />
              ))}
              {/* Tasks */}
              {plan.tasks
                .filter((t) => (t.swimlane || "General") === lane)
                .map((t) => {
                  const sd = parseDate(t.start);
                  const ed = parseDate(t.end || t.start);
                  const left = pct(sd, start, end);
                  const right = pct(ed, start, end);
                  if (t.kind === "milestone" || !t.end) {
                    return (
                      <div
                        key={t.id}
                        className="absolute -translate-x-1/2"
                        style={{
                          top: top + rowH / 2 - 12,
                          left: `calc(${labelW}px + ${left}% * (100% - ${labelW}px) / 100)`,
                        }}
                      >
                        <div
                          className="h-6 w-6 rotate-45 rounded-sm shadow-md"
                          style={{ background: colorOf(t.color) }}
                        />
                        <div className="absolute left-1/2 top-7 -translate-x-1/2 whitespace-nowrap rounded-md bg-foreground/90 px-2 py-0.5 text-[10px] font-medium text-background">
                          {t.name}
                        </div>
                      </div>
                    );
                  }
                  return (
                    <div
                      key={t.id}
                      className="absolute flex items-center overflow-hidden rounded-full px-3 text-xs font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5"
                      style={{
                        top: top + 14,
                        height: 28,
                        left: `calc(${labelW}px + ${left}% * (100% - ${labelW}px) / 100)`,
                        width: `calc((${right - left}%) * (100% - ${labelW}px) / 100)`,
                        background: `linear-gradient(90deg, ${colorOf(t.color)}, color-mix(in oklab, ${colorOf(t.color)} 70%, white))`,
                      }}
                    >
                      <span className="truncate drop-shadow-sm">{t.name}</span>
                    </div>
                  );
                })}
            </div>
          );
        })}
      </div>
    </div>
  );
}