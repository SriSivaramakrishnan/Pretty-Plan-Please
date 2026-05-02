import { Plan, colorOf, parseDate, formatDate } from "@/lib/timeline";

interface Props {
  plan: Plan;
}

// Phase Cards: each task is a card on a flowing path. Great for executive summaries.
export function PhaseCards({ plan }: Props) {
  const tasks = [...plan.tasks].sort(
    (a, b) => parseDate(a.start).getTime() - parseDate(b.start).getTime(),
  );

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl border bg-card p-10"
      style={{ boxShadow: "var(--shadow-card)" }}
    >
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
            {plan.title}
          </h2>
          {plan.subtitle && (
            <p className="mt-1 text-sm text-muted-foreground">{plan.subtitle}</p>
          )}
        </div>
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
          Phase Cards
        </span>
      </header>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {tasks.map((t, i) => {
          const sd = parseDate(t.start);
          const ed = t.end ? parseDate(t.end) : null;
          const fill = colorOf(t.color);
          const isMilestone = t.kind === "milestone" || !t.end;
          return (
            <div
              key={t.id}
              className="relative overflow-hidden rounded-2xl border p-5"
              style={{
                background: "var(--tl-soft)",
                borderColor: "var(--tl-rule)",
              }}
            >
              <div
                className="absolute left-0 top-0 h-full w-1.5"
                style={{ background: fill }}
              />
              <div className="flex items-center justify-between">
                <span
                  className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-white"
                  style={{ background: fill }}
                >
                  {isMilestone ? "Milestone" : "Phase"} {String(i + 1).padStart(2, "0")}
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                  {t.swimlane || "General"}
                </span>
              </div>
              <h3 className="font-display mt-3 text-lg font-bold leading-tight text-foreground">
                {t.name}
              </h3>
              <div className="mt-2 text-xs text-muted-foreground">
                {formatDate(sd)}
                {ed ? ` → ${formatDate(ed)}` : ""}
              </div>
              {ed && (
                <div className="mt-3 h-1 w-full rounded-full bg-white">
                  <div
                    className="h-1 rounded-full"
                    style={{
                      width: `${Math.min(100, ((t.progress ?? 0) * 100) || 100)}%`,
                      background: `linear-gradient(90deg, ${fill}, color-mix(in oklab, ${fill} 60%, white))`,
                    }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}