import {
  Plan,
  colorOf,
  parseDate,
  pct,
  planRange,
  uniqueLanes,
  ticksFor,
  type TimeScale,
} from "@/lib/timeline";

export type BarShape = "rounded" | "rectangle" | "pill" | "chevron" | "parallelogram" | "arrow";

interface Props {
  plan: Plan;
  shape?: BarShape;
  scale?: TimeScale;
}

function clipFor(shape: BarShape): string | undefined {
  switch (shape) {
    case "chevron":
      return "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%, 14px 50%)";
    case "arrow":
      return "polygon(0 0, calc(100% - 14px) 0, 100% 50%, calc(100% - 14px) 100%, 0 100%)";
    case "parallelogram":
      return "polygon(12px 0, 100% 0, calc(100% - 12px) 100%, 0 100%)";
    default:
      return undefined;
  }
}

function radiusFor(shape: BarShape): string {
  if (shape === "pill") return "9999px";
  if (shape === "rounded") return "8px";
  return "2px";
}

export function SwimlaneGantt({ plan, shape = "rounded", scale = "month" }: Props) {
  const { start, end } = planRange(plan);
  const ticks = ticksFor(scale, start, end);
  const lanes = uniqueLanes(plan);
  const rowH = 56;
  const headerH = 64;
  const labelW = 180;
  const totalH = headerH + lanes.length * rowH + 24;
  const clip = clipFor(shape);
  const radius = radiusFor(shape);

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

      <div
        className="grid"
        style={{
          gridTemplateColumns: `${labelW}px 1fr`,
          height: totalH,
        }}
      >
        {/* Header: empty label cell */}
        <div style={{ height: headerH }} />
        {/* Header: months track */}
        <div className="relative border-b" style={{ height: headerH }}>
          {ticks.map((t, i) => {
            const left = pct(t.date, start, end);
            return (
              <div
                key={i}
                className="absolute bottom-2 flex flex-col"
                style={{ left: `${left}%` }}
              >
                {t.superLabel && (
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-primary/70">
                    {t.superLabel}
                  </div>
                )}
                <div className="text-xs font-medium text-foreground/80">
                  {t.label}
                </div>
              </div>
            );
          })}
        </div>

        {/* Lanes */}
        {lanes.map((lane, li) => (
          <LaneRow
            key={lane}
            lane={lane}
            li={li}
            rowH={rowH}
            ticks={ticks}
            start={start}
            end={end}
            plan={plan}
            shape={shape}
            clip={clip}
            radius={radius}
          />
        ))}
      </div>
    </div>
  );
}

function LaneRow({
  lane,
  li,
  rowH,
  ticks,
  start,
  end,
  plan,
  shape,
  clip,
  radius,
}: {
  lane: string;
  li: number;
  rowH: number;
  ticks: { date: Date; major?: boolean }[];
  start: Date;
  end: Date;
  plan: Plan;
  shape: BarShape;
  clip?: string;
  radius: string;
}) {
  const tasks = plan.tasks.filter((t) => (t.swimlane || "General") === lane);
  return (
    <>
      {/* Label cell */}
      <div
        className="flex items-center pr-3 text-sm font-semibold text-foreground"
        style={{ height: rowH }}
      >
        <span className="inline-block h-6 w-1 rounded-full bg-primary/70 mr-3" />
        {lane}
      </div>
      {/* Track cell */}
      <div
        className="relative"
        style={{
          height: rowH,
          background: li % 2 === 0 ? "var(--tl-soft)" : "transparent",
          borderTop: "1px dashed var(--tl-rule)",
        }}
      >
        {/* major gridlines */}
        {ticks.map((t, i) =>
          t.major ? (
            <div
              key={i}
              className="absolute top-0 bottom-0 w-px"
              style={{
                left: `${pct(t.date, start, end)}%`,
                background: "var(--tl-rule)",
              }}
            />
          ) : null,
        )}
        {/* tasks */}
        {tasks.map((t) => {
          const sd = parseDate(t.start);
          const ed = parseDate(t.end || t.start);
          const left = pct(sd, start, end);
          const right = pct(ed, start, end);
          const width = Math.max(0.5, right - left);
          const isMilestone = t.kind === "milestone" || !t.end;
          if (isMilestone) {
            return (
              <div
                key={t.id}
                className="absolute -translate-x-1/2"
                style={{ top: rowH / 2 - 12, left: `${left}%` }}
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
              className="absolute flex items-center overflow-hidden px-3 text-xs font-semibold text-white shadow-md transition-transform hover:-translate-y-0.5"
              style={{
                top: 14,
                height: 28,
                left: `${left}%`,
                width: `${width}%`,
                borderRadius: radius,
                clipPath: clip,
                background: `linear-gradient(90deg, ${colorOf(t.color)}, color-mix(in oklab, ${colorOf(t.color)} 70%, white))`,
              }}
            >
              <span
                className="truncate drop-shadow-sm"
                style={{
                  paddingLeft: shape === "parallelogram" ? 8 : 0,
                  paddingRight: shape === "chevron" || shape === "arrow" ? 12 : 0,
                }}
              >
                {t.name}
              </span>
            </div>
          );
        })}
      </div>
    </>
  );
}
