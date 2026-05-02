import {
  Plan,
  colorOf,
  formatDate,
  parseDate,
  pct,
  planRange,
  ticksFor,
  type TimeScale,
} from "@/lib/timeline";

interface Props {
  plan: Plan;
  scale?: TimeScale;
}

export function MilestoneTimeline({ plan, scale = "month" }: Props) {
  const { start, end } = planRange(plan);
  const ticks = ticksFor(scale, start, end);
  const milestones = plan.tasks.filter((t) => t.kind === "milestone" || !t.end);
  const bars = plan.tasks.filter((t) => t.kind !== "milestone" && t.end);

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border bg-card p-10"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <header className="mb-10 flex items-end justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
            {plan.title}
          </h2>
          {plan.subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{plan.subtitle}</p>
          )}
        </div>
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Milestone Timeline
        </span>
      </header>

      <div className="relative h-[340px]">
        {/* horizontal axis */}
        <div
          className="absolute left-0 right-0 top-1/2 h-1 -translate-y-1/2 rounded-full"
          style={{ background: "var(--gradient-hero)" }}
        />
        {/* month ticks */}
        {ticks.map((t, i) => (
          <div
            key={i}
            className="absolute flex -translate-x-1/2 flex-col items-center"
            style={{ left: `${pct(t.date, start, end)}%`, top: "calc(50% + 12px)" }}
          >
            <div className="h-2 w-px bg-foreground/40" />
            <div className="mt-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
              {t.label}{t.superLabel ? ` ${t.superLabel}` : ""}
            </div>
          </div>
        ))}

        {/* phase bars (subtle, behind axis) */}
        {bars.map((t, i) => {
          const sd = parseDate(t.start);
          const ed = parseDate(t.end!);
          const left = pct(sd, start, end);
          const w = pct(ed, start, end) - left;
          return (
            <div
              key={t.id}
              className="absolute rounded-full opacity-90 shadow-sm"
              style={{
                left: `${left}%`,
                width: `${w}%`,
                top: `calc(50% - 26px - ${(i % 2) * 0}px)`,
                height: 14,
                background: `linear-gradient(90deg, ${colorOf(t.color)}, color-mix(in oklab, ${colorOf(t.color)} 60%, white))`,
                transform: "translateY(-100%)",
              }}
            >
              <span className="absolute left-3 top-1/2 -translate-y-1/2 whitespace-nowrap text-[10px] font-semibold text-white">
                {t.name}
              </span>
            </div>
          );
        })}

        {/* milestones above/below axis alternating */}
        {milestones.map((m, i) => {
          const d = parseDate(m.start);
          const left = pct(d, start, end);
          const above = i % 2 === 0;
          return (
            <div
              key={m.id}
              className="absolute -translate-x-1/2"
              style={{ left: `${left}%`, top: "50%" }}
            >
              <div
                className="absolute left-1/2 -translate-x-1/2"
                style={{
                  top: above ? -90 : 14,
                  width: 2,
                  height: 76,
                  background: colorOf(m.color),
                  opacity: 0.6,
                }}
              />
              <div
                className="absolute left-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm shadow-lg"
                style={{ background: colorOf(m.color) }}
              />
              <div
                className="absolute w-44 -translate-x-1/2 rounded-xl border bg-background/95 px-3 py-2 text-center shadow-md backdrop-blur"
                style={{
                  left: "50%",
                  top: above ? -160 : 90,
                  borderColor: "var(--tl-rule)",
                }}
              >
                <div
                  className="text-[10px] font-bold uppercase tracking-widest"
                  style={{ color: colorOf(m.color) }}
                >
                  {m.swimlane || "Milestone"}
                </div>
                <div className="mt-0.5 text-sm font-semibold text-foreground">
                  {m.name}
                </div>
                <div className="mt-0.5 text-[10px] text-muted-foreground">
                  {formatDate(d)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}