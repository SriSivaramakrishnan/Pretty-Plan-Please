export type TaskKind = "task" | "milestone";

export interface PlanTask {
  id: string;
  name: string;
  start: string; // ISO date
  end?: string; // ISO date — optional for milestones
  swimlane?: string;
  kind?: TaskKind;
  color?: number; // 1..6 token index
  progress?: number; // 0..1
}

export interface Plan {
  title: string;
  subtitle?: string;
  tasks: PlanTask[];
}

export const SAMPLE_PLAN: Plan = {
  title: "Atlas Product Launch",
  subtitle: "Q1 — Q4 2026 · Cross-functional plan",
  tasks: [
    { id: "1", name: "Discovery & research", start: "2026-01-06", end: "2026-02-20", swimlane: "Product", color: 1 },
    { id: "2", name: "Design sprints", start: "2026-02-15", end: "2026-04-10", swimlane: "Design", color: 5 },
    { id: "3", name: "Kickoff", start: "2026-01-12", kind: "milestone", swimlane: "Product", color: 3 },
    { id: "4", name: "MVP build", start: "2026-03-02", end: "2026-06-15", swimlane: "Engineering", color: 2 },
    { id: "5", name: "Beta release", start: "2026-06-22", kind: "milestone", swimlane: "Engineering", color: 3 },
    { id: "6", name: "Marketing campaign", start: "2026-05-04", end: "2026-09-12", swimlane: "Marketing", color: 4 },
    { id: "7", name: "Sales enablement", start: "2026-07-01", end: "2026-09-30", swimlane: "Sales", color: 6 },
    { id: "8", name: "Public launch", start: "2026-10-05", kind: "milestone", swimlane: "Marketing", color: 3 },
    { id: "9", name: "Post-launch ops", start: "2026-10-12", end: "2026-12-20", swimlane: "Sales", color: 6 },
  ],
};

export const COLOR_TOKENS = [
  "var(--tl-1)",
  "var(--tl-2)",
  "var(--tl-3)",
  "var(--tl-4)",
  "var(--tl-5)",
  "var(--tl-6)",
];

// Hex equivalents for PPTX export (approx of the oklch tokens)
export const COLOR_HEX = ["4F6BED", "2BB6B0", "F25C54", "E8A93A", "8E5CD9", "3FB682"];

export function colorOf(i?: number) {
  const idx = ((i ?? 1) - 1 + 6) % 6;
  return COLOR_TOKENS[idx];
}

export function hexOf(i?: number) {
  const idx = ((i ?? 1) - 1 + 6) % 6;
  return COLOR_HEX[idx];
}

export function parseDate(s: string): Date {
  const d = new Date(s);
  if (isNaN(d.getTime())) return new Date();
  return d;
}

export function planRange(plan: Plan) {
  const dates = plan.tasks.flatMap((t) => [parseDate(t.start), parseDate(t.end || t.start)]);
  const min = new Date(Math.min(...dates.map((d) => d.getTime())));
  const max = new Date(Math.max(...dates.map((d) => d.getTime())));
  // pad to month boundaries
  const start = new Date(min.getFullYear(), min.getMonth(), 1);
  const end = new Date(max.getFullYear(), max.getMonth() + 1, 0);
  return { start, end };
}

export function monthsBetween(start: Date, end: Date) {
  const months: Date[] = [];
  const d = new Date(start.getFullYear(), start.getMonth(), 1);
  while (d <= end) {
    months.push(new Date(d));
    d.setMonth(d.getMonth() + 1);
  }
  return months;
}

export function quartersBetween(start: Date, end: Date) {
  const out: { label: string; start: Date; end: Date }[] = [];
  const d = new Date(start.getFullYear(), Math.floor(start.getMonth() / 3) * 3, 1);
  while (d <= end) {
    const qStart = new Date(d);
    const qEnd = new Date(d.getFullYear(), d.getMonth() + 3, 0);
    out.push({ label: `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`, start: qStart, end: qEnd });
    d.setMonth(d.getMonth() + 3);
  }
  return out;
}

export type TimeScale = "week" | "month" | "quarter" | "year";

export function weeksBetween(start: Date, end: Date) {
  const out: Date[] = [];
  const d = new Date(start);
  // align to Monday
  const day = d.getDay();
  const diff = (day + 6) % 7;
  d.setDate(d.getDate() - diff);
  while (d <= end) {
    out.push(new Date(d));
    d.setDate(d.getDate() + 7);
  }
  return out;
}

export function yearsBetween(start: Date, end: Date) {
  const out: Date[] = [];
  const d = new Date(start.getFullYear(), 0, 1);
  while (d <= end) {
    out.push(new Date(d));
    d.setFullYear(d.getFullYear() + 1);
  }
  return out;
}

export interface Tick {
  date: Date;
  label: string;
  major?: boolean; // draw stronger gridline
  superLabel?: string; // e.g. year above month, quarter above week
}

export function ticksFor(scale: TimeScale, start: Date, end: Date): Tick[] {
  if (scale === "week") {
    return weeksBetween(start, end).map((d) => ({
      date: d,
      label: `${d.getMonth() + 1}/${d.getDate()}`,
      major: d.getDate() <= 7,
      superLabel:
        d.getDate() <= 7
          ? d.toLocaleString("en", { month: "short", year: "numeric" })
          : undefined,
    }));
  }
  if (scale === "year") {
    return yearsBetween(start, end).map((d) => ({
      date: d,
      label: String(d.getFullYear()),
      major: true,
    }));
  }
  if (scale === "quarter") {
    return quartersBetween(start, end).map((q) => ({
      date: q.start,
      label: q.label,
      major: q.start.getMonth() === 0,
      superLabel: q.start.getMonth() === 0 ? String(q.start.getFullYear()) : undefined,
    }));
  }
  // month
  return monthsBetween(start, end).map((d) => ({
    date: d,
    label: formatMonth(d),
    major: d.getMonth() % 3 === 0,
    superLabel:
      d.getMonth() === 0
        ? String(d.getFullYear())
        : d.getMonth() % 3 === 0
          ? `Q${Math.floor(d.getMonth() / 3) + 1} ${d.getFullYear()}`
          : undefined,
  }));
}

export function pct(date: Date, start: Date, end: Date) {
  const span = end.getTime() - start.getTime();
  return ((date.getTime() - start.getTime()) / span) * 100;
}

export function uniqueLanes(plan: Plan): string[] {
  const set = new Set<string>();
  plan.tasks.forEach((t) => set.add(t.swimlane || "General"));
  return Array.from(set);
}

export function formatMonth(d: Date) {
  return d.toLocaleString("en", { month: "short" });
}

export function formatDate(d: Date) {
  return d.toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" });
}

// Parse pasted CSV / JSON. Accepts either:
// - JSON Plan ({ title, tasks: [...] }) or array of tasks
// - CSV with headers: name,start,end,swimlane,kind,color
export function parsePlanInput(raw: string): Plan {
  const trimmed = raw.trim();
  if (!trimmed) return SAMPLE_PLAN;
  // JSON
  if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return { title: "Imported Plan", tasks: normalizeTasks(parsed) };
      }
      return {
        title: parsed.title || "Imported Plan",
        subtitle: parsed.subtitle,
        tasks: normalizeTasks(parsed.tasks || []),
      };
    } catch {
      throw new Error("Invalid JSON");
    }
  }
  // CSV
  const lines = trimmed.split(/\r?\n/).filter(Boolean);
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const tasks = lines.slice(1).map((line, i) => {
    const cells = splitCSV(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = (cells[idx] || "").trim()));
    return {
      id: String(i + 1),
      name: row.name || row.task || `Task ${i + 1}`,
      start: row.start,
      end: row.end || undefined,
      swimlane: row.swimlane || row.lane || row.team || "General",
      kind: (row.kind || (row.end ? "task" : "milestone")) as TaskKind,
      color: row.color ? Number(row.color) : ((i % 6) + 1),
    };
  });
  return { title: "Imported Plan", tasks: normalizeTasks(tasks) };
}

function splitCSV(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQ = !inQ;
    else if (c === "," && !inQ) {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

function normalizeTasks(items: any[]): PlanTask[] {
  return items.map((t, i) => ({
    id: String(t.id ?? i + 1),
    name: String(t.name || t.task || `Task ${i + 1}`),
    start: t.start,
    end: t.end,
    swimlane: t.swimlane || t.lane || t.team || "General",
    kind: (t.kind || (t.end ? "task" : "milestone")) as TaskKind,
    color: t.color ? Number(t.color) : ((i % 6) + 1),
    progress: t.progress,
  }));
}