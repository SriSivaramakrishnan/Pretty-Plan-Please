import PptxGenJS from "pptxgenjs";
import {
  Plan,
  monthsBetween,
  parseDate,
  pct,
  planRange,
  uniqueLanes,
  formatMonth,
  quartersBetween,
} from "./timeline";
import { getTheme, type Theme, type ThemeId } from "./themes";

type Style = "swimlane" | "milestone" | "roadmap";
export type BarShape = "rounded" | "rectangle" | "pill" | "chevron" | "parallelogram" | "arrow";

function pptxShapeFor(shape: BarShape): { name: string; rectRadius?: number } {
  switch (shape) {
    case "rectangle":
      return { name: "rect" };
    case "pill":
      return { name: "roundRect", rectRadius: 0.5 };
    case "chevron":
      return { name: "chevron" };
    case "arrow":
      return { name: "rightArrow" };
    case "parallelogram":
      return { name: "parallelogram" };
    case "rounded":
    default:
      return { name: "roundRect", rectRadius: 0.12 };
  }
}

function colorAt(theme: Theme, i?: number): string {
  const idx = ((i ?? 1) - 1 + 6) % 6;
  return theme.pptx.palette[idx];
}

// Pick a readable foreground given a hex background.
function readableOn(hex: string): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luma > 0.6 ? "111111" : "FFFFFF";
}

const SLIDE_W = 13.333; // widescreen inches

export async function exportPlanToPptx(
  plan: Plan,
  style: Style,
  shape: BarShape = "rounded",
  themeOrId: Theme | ThemeId = "executive",
) {
  const theme: Theme =
    typeof themeOrId === "string" ? getTheme(themeOrId) : themeOrId;

  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = plan.title;

  const slide = pptx.addSlide();
  slide.background = { color: theme.pptx.background };

  // Title
  slide.addText(plan.title, {
    x: 0.5,
    y: 0.3,
    w: 12.3,
    h: 0.6,
    fontFace: theme.pptx.headingFont,
    fontSize: 28,
    bold: true,
    color: theme.pptx.ink,
  });
  if (plan.subtitle) {
    slide.addText(plan.subtitle, {
      x: 0.5,
      y: 0.85,
      w: 12.3,
      h: 0.3,
      fontFace: theme.pptx.bodyFont,
      fontSize: 12,
      color: theme.pptx.muted,
    });
  }

  if (style === "swimlane") drawSwimlane(slide, plan, shape, theme);
  else if (style === "milestone") drawMilestone(slide, plan, theme);
  else drawRoadmap(slide, plan, theme);

  await pptx.writeFile({ fileName: `${plan.title.replace(/\s+/g, "_")}.pptx` });
}

function drawSwimlane(slide: any, plan: Plan, shape: BarShape, theme: Theme) {
  const shapeDef = pptxShapeFor(shape);
  const { start, end } = planRange(plan);
  const months = monthsBetween(start, end);
  const lanes = uniqueLanes(plan);
  const x0 = 2.0;
  const y0 = 1.6;
  const w = SLIDE_W - x0 - 0.5;
  const rowH = 0.6;
  const headerH = 0.5;

  months.forEach((m) => {
    const mx = x0 + (pct(m, start, end) / 100) * w;
    slide.addText(formatMonth(m), {
      x: mx,
      y: y0 - 0.4,
      w: 0.8,
      h: 0.3,
      fontSize: 9,
      color: theme.pptx.ink,
      bold: true,
      fontFace: theme.pptx.bodyFont,
    });
    if (m.getMonth() % 3 === 0) {
      slide.addShape("line", {
        x: mx,
        y: y0,
        w: 0,
        h: rowH * lanes.length + headerH,
        line: { color: theme.pptx.rule, width: 0.75 },
      });
    }
  });

  lanes.forEach((lane, li) => {
    const y = y0 + headerH + li * rowH;
    slide.addText(lane, {
      x: 0.4,
      y,
      w: 1.5,
      h: rowH,
      fontSize: 11,
      bold: true,
      color: theme.pptx.ink,
      valign: "middle",
      fontFace: theme.pptx.bodyFont,
    });
    slide.addShape("rect", {
      x: x0,
      y,
      w,
      h: rowH,
      fill: { color: li % 2 === 0 ? theme.pptx.laneA : theme.pptx.laneB },
      line: { color: theme.pptx.background, width: 0 },
    });

    plan.tasks
      .filter((t) => (t.swimlane || "General") === lane)
      .forEach((t) => {
        const sd = parseDate(t.start);
        const ed = parseDate(t.end || t.start);
        const left = (pct(sd, start, end) / 100) * w;
        const right = (pct(ed, start, end) / 100) * w;
        const fill = colorAt(theme, t.color);
        if (t.kind === "milestone" || !t.end) {
          slide.addShape("diamond", {
            x: x0 + left - 0.12,
            y: y + rowH / 2 - 0.12,
            w: 0.24,
            h: 0.24,
            fill: { color: fill },
            line: { color: theme.pptx.background, width: 1 },
          });
          slide.addText(t.name, {
            x: x0 + left - 0.6,
            y: y + rowH / 2 + 0.1,
            w: 1.2,
            h: 0.2,
            fontSize: 8,
            color: theme.pptx.ink,
            align: "center",
            fontFace: theme.pptx.bodyFont,
          });
        } else {
          slide.addShape(shapeDef.name, {
            x: x0 + left,
            y: y + 0.15,
            w: Math.max(0.15, right - left),
            h: rowH - 0.3,
            fill: { color: fill },
            line: { color: theme.pptx.background, width: 0 },
            ...(shapeDef.rectRadius !== undefined ? { rectRadius: shapeDef.rectRadius } : {}),
          });
          slide.addText(t.name, {
            x: x0 + left + 0.05,
            y: y + 0.18,
            w: Math.max(0.15, right - left) - 0.1,
            h: rowH - 0.36,
            fontSize: 9,
            bold: true,
            color: readableOn(fill),
            valign: "middle",
            fontFace: theme.pptx.bodyFont,
          });
        }
      });
  });
}

function drawMilestone(slide: any, plan: Plan, theme: Theme) {
  const { start, end } = planRange(plan);
  const months = monthsBetween(start, end);
  const x0 = 0.6;
  const w = SLIDE_W - 1.2;
  const yAxis = 4.0;

  slide.addShape("roundRect", {
    x: x0,
    y: yAxis - 0.05,
    w,
    h: 0.1,
    fill: { color: theme.pptx.ink },
    line: { color: theme.pptx.ink, width: 0 },
    rectRadius: 0.05,
  });

  months.forEach((m) => {
    const mx = x0 + (pct(m, start, end) / 100) * w;
    slide.addShape("line", {
      x: mx,
      y: yAxis + 0.06,
      w: 0,
      h: 0.12,
      line: { color: theme.pptx.muted, width: 0.75 },
    });
    slide.addText(formatMonth(m), {
      x: mx - 0.3,
      y: yAxis + 0.2,
      w: 0.6,
      h: 0.25,
      fontSize: 8,
      color: theme.pptx.muted,
      align: "center",
      fontFace: theme.pptx.bodyFont,
    });
  });

  plan.tasks
    .filter((t) => t.end && t.kind !== "milestone")
    .forEach((t) => {
      const sd = parseDate(t.start);
      const ed = parseDate(t.end!);
      const left = (pct(sd, start, end) / 100) * w;
      const ww = (pct(ed, start, end) / 100) * w - left;
      const y = yAxis - 0.45;
      const fill = colorAt(theme, t.color);
      slide.addShape("roundRect", {
        x: x0 + left,
        y,
        w: Math.max(0.15, ww),
        h: 0.3,
        fill: { color: fill },
        line: { color: theme.pptx.background, width: 0 },
        rectRadius: 0.15,
      });
      slide.addText(t.name, {
        x: x0 + left + 0.1,
        y: y + 0.04,
        w: Math.max(0.15, ww) - 0.2,
        h: 0.22,
        fontSize: 8,
        bold: true,
        color: readableOn(fill),
        valign: "middle",
        fontFace: theme.pptx.bodyFont,
      });
    });

  plan.tasks
    .filter((t) => t.kind === "milestone" || !t.end)
    .forEach((m, i) => {
      const d = parseDate(m.start);
      const mx = x0 + (pct(d, start, end) / 100) * w;
      const above = i % 2 === 0;
      const cardY = above ? yAxis - 1.7 : yAxis + 0.6;
      const fill = colorAt(theme, m.color);
      slide.addShape("line", {
        x: mx,
        y: above ? cardY + 0.55 : yAxis + 0.05,
        w: 0,
        h: above ? yAxis - cardY - 0.55 : cardY - yAxis - 0.05,
        line: { color: fill, width: 1.5 },
      });
      slide.addShape("diamond", {
        x: mx - 0.12,
        y: yAxis - 0.12,
        w: 0.24,
        h: 0.24,
        fill: { color: fill },
        line: { color: theme.pptx.background, width: 1 },
      });
      slide.addShape("roundRect", {
        x: mx - 0.95,
        y: cardY,
        w: 1.9,
        h: 0.55,
        fill: { color: theme.pptx.laneB },
        line: { color: theme.pptx.rule, width: 0.75 },
        rectRadius: 0.1,
      });
      slide.addText(m.name, {
        x: mx - 0.9,
        y: cardY + 0.05,
        w: 1.8,
        h: 0.25,
        fontSize: 10,
        bold: true,
        color: theme.pptx.ink,
        align: "center",
        fontFace: theme.pptx.bodyFont,
      });
      slide.addText(d.toLocaleDateString("en", { month: "short", day: "numeric" }), {
        x: mx - 0.9,
        y: cardY + 0.3,
        w: 1.8,
        h: 0.2,
        fontSize: 8,
        color: fill,
        align: "center",
        bold: true,
        fontFace: theme.pptx.bodyFont,
      });
    });
}

function drawRoadmap(slide: any, plan: Plan, theme: Theme) {
  const { start, end } = planRange(plan);
  const quarters = quartersBetween(start, end);
  const lanes = uniqueLanes(plan);
  const x0 = 1.6;
  const y0 = 1.4;
  const w = SLIDE_W - x0 - 0.5;
  const rowH = 0.7;

  const qw = w / quarters.length;
  quarters.forEach((q, i) => {
    slide.addShape("rect", {
      x: x0 + i * qw,
      y: y0,
      w: qw - 0.04,
      h: 0.45,
      fill: { color: i % 2 === 0 ? theme.pptx.laneA : theme.pptx.laneB },
      line: { color: theme.pptx.background, width: 0 },
    });
    slide.addText(q.label, {
      x: x0 + i * qw,
      y: y0,
      w: qw - 0.04,
      h: 0.45,
      fontSize: 11,
      bold: true,
      color: theme.pptx.ink,
      align: "center",
      valign: "middle",
      fontFace: theme.pptx.bodyFont,
    });
  });

  lanes.forEach((lane, li) => {
    const y = y0 + 0.55 + li * rowH;
    slide.addText(lane, {
      x: 0.3,
      y,
      w: 1.2,
      h: rowH,
      fontSize: 11,
      bold: true,
      color: theme.pptx.ink,
      valign: "middle",
      fontFace: theme.pptx.bodyFont,
    });
    plan.tasks
      .filter((t) => (t.swimlane || "General") === lane && t.end)
      .forEach((t) => {
        const sd = parseDate(t.start);
        const ed = parseDate(t.end!);
        const left = (pct(sd, start, end) / 100) * w;
        const ww = (pct(ed, start, end) / 100) * w - left;
        const fill = colorAt(theme, t.color);
        slide.addShape("roundRect", {
          x: x0 + left,
          y: y + 0.15,
          w: Math.max(0.2, ww),
          h: rowH - 0.3,
          fill: { color: fill },
          line: { color: theme.pptx.background, width: 0 },
          rectRadius: 0.12,
        });
        slide.addText(t.name, {
          x: x0 + left + 0.08,
          y: y + 0.18,
          w: Math.max(0.2, ww) - 0.16,
          h: rowH - 0.36,
          fontSize: 9,
          bold: true,
          color: readableOn(fill),
          valign: "middle",
          fontFace: theme.pptx.bodyFont,
        });
      });
  });
}
