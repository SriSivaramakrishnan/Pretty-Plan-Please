import PptxGenJS from "pptxgenjs";
import {
  Plan,
  hexOf,
  monthsBetween,
  parseDate,
  pct,
  planRange,
  uniqueLanes,
  formatMonth,
  quartersBetween,
} from "./timeline";

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

const SLIDE_W = 13.333; // widescreen inches
const SLIDE_H = 7.5;

export async function exportPlanToPptx(plan: Plan, style: Style, shape: BarShape = "rounded") {
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.title = plan.title;

  const slide = pptx.addSlide();
  slide.background = { color: "F7F9FC" };

  // Title
  slide.addText(plan.title, {
    x: 0.5,
    y: 0.3,
    w: 12.3,
    h: 0.6,
    fontFace: "Georgia",
    fontSize: 28,
    bold: true,
    color: "1A2340",
  });
  if (plan.subtitle) {
    slide.addText(plan.subtitle, {
      x: 0.5,
      y: 0.85,
      w: 12.3,
      h: 0.3,
      fontFace: "Calibri",
      fontSize: 12,
      color: "6B7280",
    });
  }

  if (style === "swimlane") drawSwimlane(slide, plan, shape);
  else if (style === "milestone") drawMilestone(slide, plan);
  else drawRoadmap(slide, plan);

  await pptx.writeFile({ fileName: `${plan.title.replace(/\s+/g, "_")}.pptx` });
}

function drawSwimlane(slide: any, plan: Plan, shape: BarShape = "rounded") {
  const shapeDef = pptxShapeFor(shape);
  const { start, end } = planRange(plan);
  const months = monthsBetween(start, end);
  const lanes = uniqueLanes(plan);
  const x0 = 2.0;
  const y0 = 1.6;
  const w = SLIDE_W - x0 - 0.5;
  const rowH = 0.6;
  const headerH = 0.5;

  // month labels
  months.forEach((m) => {
    const mx = x0 + (pct(m, start, end) / 100) * w;
    slide.addText(formatMonth(m), {
      x: mx,
      y: y0 - 0.4,
      w: 0.8,
      h: 0.3,
      fontSize: 9,
      color: "1A2340",
      bold: true,
    });
    if (m.getMonth() % 3 === 0) {
      slide.addShape("line", {
        x: mx,
        y: y0,
        w: 0,
        h: rowH * lanes.length,
        line: { color: "D7DCE6", width: 0.75 },
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
      color: "1A2340",
      valign: "middle",
    });
    slide.addShape("rect", {
      x: x0,
      y,
      w,
      h: rowH,
      fill: { color: li % 2 === 0 ? "F1F4FA" : "FFFFFF" },
      line: { color: "FFFFFF", width: 0 },
    });

    plan.tasks
      .filter((t) => (t.swimlane || "General") === lane)
      .forEach((t) => {
        const sd = parseDate(t.start);
        const ed = parseDate(t.end || t.start);
        const left = (pct(sd, start, end) / 100) * w;
        const right = (pct(ed, start, end) / 100) * w;
        if (t.kind === "milestone" || !t.end) {
          slide.addShape("diamond", {
            x: x0 + left - 0.12,
            y: y + rowH / 2 - 0.12,
            w: 0.24,
            h: 0.24,
            fill: { color: hexOf(t.color) },
            line: { color: "FFFFFF", width: 1 },
          });
          slide.addText(t.name, {
            x: x0 + left - 0.6,
            y: y + rowH / 2 + 0.1,
            w: 1.2,
            h: 0.2,
            fontSize: 8,
            color: "1A2340",
            align: "center",
          });
        } else {
          slide.addShape(shapeDef.name, {
            x: x0 + left,
            y: y + 0.15,
            w: Math.max(0.15, right - left),
            h: rowH - 0.3,
            fill: { color: hexOf(t.color) },
            line: { color: "FFFFFF", width: 0 },
            ...(shapeDef.rectRadius !== undefined ? { rectRadius: shapeDef.rectRadius } : {}),
          });
          slide.addText(t.name, {
            x: x0 + left + 0.05,
            y: y + 0.18,
            w: Math.max(0.15, right - left) - 0.1,
            h: rowH - 0.36,
            fontSize: 9,
            bold: true,
            color: "FFFFFF",
            valign: "middle",
          });
        }
      });
  });
}

function drawMilestone(slide: any, plan: Plan) {
  const { start, end } = planRange(plan);
  const months = monthsBetween(start, end);
  const x0 = 0.6;
  const w = SLIDE_W - 1.2;
  const yAxis = 4.0;

  // axis bar
  slide.addShape("roundRect", {
    x: x0,
    y: yAxis - 0.05,
    w,
    h: 0.1,
    fill: { color: "1A2340" },
    line: { color: "1A2340", width: 0 },
    rectRadius: 0.05,
  });

  months.forEach((m) => {
    const mx = x0 + (pct(m, start, end) / 100) * w;
    slide.addShape("line", {
      x: mx,
      y: yAxis + 0.06,
      w: 0,
      h: 0.12,
      line: { color: "6B7280", width: 0.75 },
    });
    slide.addText(formatMonth(m), {
      x: mx - 0.3,
      y: yAxis + 0.2,
      w: 0.6,
      h: 0.25,
      fontSize: 8,
      color: "6B7280",
      align: "center",
    });
  });

  // bars (above axis)
  plan.tasks
    .filter((t) => t.end && t.kind !== "milestone")
    .forEach((t, i) => {
      const sd = parseDate(t.start);
      const ed = parseDate(t.end!);
      const left = (pct(sd, start, end) / 100) * w;
      const ww = (pct(ed, start, end) / 100) * w - left;
      const y = yAxis - 0.45 - (i % 2) * 0.0;
      slide.addShape("roundRect", {
        x: x0 + left,
        y,
        w: Math.max(0.15, ww),
        h: 0.3,
        fill: { color: hexOf(t.color) },
        line: { color: "FFFFFF", width: 0 },
        rectRadius: 0.15,
      });
      slide.addText(t.name, {
        x: x0 + left + 0.1,
        y: y + 0.04,
        w: Math.max(0.15, ww) - 0.2,
        h: 0.22,
        fontSize: 8,
        bold: true,
        color: "FFFFFF",
        valign: "middle",
      });
    });

  // milestones alternating above/below
  plan.tasks
    .filter((t) => t.kind === "milestone" || !t.end)
    .forEach((m, i) => {
      const d = parseDate(m.start);
      const mx = x0 + (pct(d, start, end) / 100) * w;
      const above = i % 2 === 0;
      const cardY = above ? yAxis - 1.7 : yAxis + 0.6;
      slide.addShape("line", {
        x: mx,
        y: above ? cardY + 0.55 : yAxis + 0.05,
        w: 0,
        h: above ? yAxis - cardY - 0.55 : cardY - yAxis - 0.05,
        line: { color: hexOf(m.color), width: 1.5 },
      });
      slide.addShape("diamond", {
        x: mx - 0.12,
        y: yAxis - 0.12,
        w: 0.24,
        h: 0.24,
        fill: { color: hexOf(m.color) },
        line: { color: "FFFFFF", width: 1 },
      });
      slide.addShape("roundRect", {
        x: mx - 0.95,
        y: cardY,
        w: 1.9,
        h: 0.55,
        fill: { color: "FFFFFF" },
        line: { color: "D7DCE6", width: 0.75 },
        rectRadius: 0.1,
      });
      slide.addText(m.name, {
        x: mx - 0.9,
        y: cardY + 0.05,
        w: 1.8,
        h: 0.25,
        fontSize: 10,
        bold: true,
        color: "1A2340",
        align: "center",
      });
      slide.addText(d.toLocaleDateString("en", { month: "short", day: "numeric" }), {
        x: mx - 0.9,
        y: cardY + 0.3,
        w: 1.8,
        h: 0.2,
        fontSize: 8,
        color: hexOf(m.color),
        align: "center",
        bold: true,
      });
    });
}

function drawRoadmap(slide: any, plan: Plan) {
  const { start, end } = planRange(plan);
  const quarters = quartersBetween(start, end);
  const lanes = uniqueLanes(plan);
  const x0 = 1.6;
  const y0 = 1.4;
  const w = SLIDE_W - x0 - 0.5;
  const rowH = 0.7;

  // quarter headers
  const qw = w / quarters.length;
  quarters.forEach((q, i) => {
    slide.addShape("rect", {
      x: x0 + i * qw,
      y: y0,
      w: qw - 0.04,
      h: 0.45,
      fill: { color: i % 2 === 0 ? "E2E8F4" : "DCEEF0" },
      line: { color: "FFFFFF", width: 0 },
    });
    slide.addText(q.label, {
      x: x0 + i * qw,
      y: y0,
      w: qw - 0.04,
      h: 0.45,
      fontSize: 11,
      bold: true,
      color: "1A2340",
      align: "center",
      valign: "middle",
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
      color: "1A2340",
      valign: "middle",
    });
    plan.tasks
      .filter((t) => (t.swimlane || "General") === lane && t.end)
      .forEach((t) => {
        const sd = parseDate(t.start);
        const ed = parseDate(t.end!);
        const left = (pct(sd, start, end) / 100) * w;
        const ww = (pct(ed, start, end) / 100) * w - left;
        slide.addShape("roundRect", {
          x: x0 + left,
          y: y + 0.15,
          w: Math.max(0.2, ww),
          h: rowH - 0.3,
          fill: { color: hexOf(t.color) },
          line: { color: "FFFFFF", width: 0 },
          rectRadius: 0.12,
        });
        slide.addText(t.name, {
          x: x0 + left + 0.08,
          y: y + 0.18,
          w: Math.max(0.2, ww) - 0.16,
          h: rowH - 0.36,
          fontSize: 9,
          bold: true,
          color: "FFFFFF",
          valign: "middle",
        });
      });
  });
}