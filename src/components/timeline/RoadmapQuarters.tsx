import {
  Plan,
  colorOf,
  parseDate,
  pct,
  planRange,
  quartersBetween,
  uniqueLanes,
} from "@/lib/timeline";

interface Props {
  plan: Plan;
}

export function RoadmapQuarters({ plan }: Props) {
  const { start, end } = planRange(plan);
  const quarters = quartersBetween(start, end);
  const lanes = uniqueLanes(plan);
  const labelW = 160;
  const rowH = 80;

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
          Roadmap · Quarters
        </span>
      </header>

      {/* Quarter header */}
      <div className="flex" style={{ paddingLeft: labelW }}>
        {quarters.map((q, i) => (
          <div
            key={i}
            className="flex-1 rounded-t-xl px-4 py-3 text-sm font-bold uppercase tracking-wider"
            style={{
              background:
                i % 2 === 0
                  ? "color-mix(in oklab, var(--primary) 12%, white)"
                  : "color-mix(in oklab, var(--accent) 18%, white)",
              color: "var(--tl-ink)",
              borderRight: "2px solid white",
            }}
          >
            {q.label}
          </div>
        ))}
      </div>

      <div className="flex">
        {/* Lane labels */}
        <div style={{ width: labelW }} className="pt-4">
          {lanes.map((lane) => (
            <div
              key={lane}
              className="flex items-center text-sm font-semibold text-foreground"
              style={{ height: rowH }}
            >
              <span className="mr-3 inline-block h-7 w-1 rounded-full bg-primary/70" />
              {lane}
            </div>
          ))}
        </div>

        {/* Grid */}
        <div className="relative flex-1 pt-4">
          {/* quarter columns */}
          <div className="absolute inset-0 flex">
            {quarters.map((_, i) => (
              <div
                key={i}
                className="flex-1"
                style={{
                  background: i % 2 === 0 ? "var(--tl-soft)" : "white",
                  borderRight: "1px dashed var(--tl-rule)",
                }}
              />
            ))}
          </div>

          {/* lanes */}
          {lanes.map((lane, li) => (
            <div
              key={lane}
              className="relative"
              style={{
                height: rowH,
                borderTop: li === 0 ? "none" : "1px dashed var(--tl-rule)",
              }}
            >
              {plan.tasks
                .filter((t) => (t.swimlane || "General") === lane && t.end)
                .map((t) => {
                  const sd = parseDate(t.start);
                  const ed = parseDate(t.end!);
                  const left = pct(sd, start, end);
                  const w = pct(ed, start, end) - left;
                  return (
                    <div
                      key={t.id}
                      className="absolute flex items-center rounded-xl px-3 text-xs font-semibold text-white shadow-md"
                      style={{
                        top: rowH / 2 - 16,
                        height: 32,
                        left: `${left}%`,
                        width: `${w}%`,
                        background: `linear-gradient(135deg, ${colorOf(t.color)}, color-mix(in oklab, ${colorOf(t.color)} 55%, black))`,
                      }}
                    >
                      <span className="truncate">{t.name}</span>
                    </div>
                  );
                })}
              {/* milestones in this lane */}
              {plan.tasks
                .filter(
                  (t) =>
                    (t.swimlane || "General") === lane &&
                    (t.kind === "milestone" || !t.end),
                )
                .map((m) => {
                  const d = parseDate(m.start);
                  const left = pct(d, start, end);
                  return (
                    <div
                      key={m.id}
                      className="absolute -translate-x-1/2"
                      style={{ left: `${left}%`, top: rowH / 2 - 8 }}
                      title={m.name}
                    >
                      <div
                        className="h-4 w-4 rotate-45 rounded-sm ring-2 ring-white"
                        style={{ background: colorOf(m.color) }}
                      />
                    </div>
                  );
                })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}