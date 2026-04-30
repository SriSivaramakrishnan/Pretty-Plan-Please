import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { toPng } from "html-to-image";
import { SwimlaneGantt } from "@/components/timeline/SwimlaneGantt";
import { MilestoneTimeline } from "@/components/timeline/MilestoneTimeline";
import { RoadmapQuarters } from "@/components/timeline/RoadmapQuarters";
import { Plan, SAMPLE_PLAN, parsePlanInput } from "@/lib/timeline";
import { exportPlanToPptx } from "@/lib/exportPptx";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Sparkles, Download, Image as ImageIcon, Upload, ScanLine, Loader2 } from "lucide-react";
import { extractPlanFromImage } from "@/server/extractPlan.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  component: Index,
});

type Style = "swimlane" | "milestone" | "roadmap";

const SAMPLE_CSV = `name,start,end,swimlane,kind,color
Discovery,2026-01-06,2026-02-20,Product,task,1
Kickoff,2026-01-12,,Product,milestone,3
Design sprints,2026-02-15,2026-04-10,Design,task,5
MVP build,2026-03-02,2026-06-15,Engineering,task,2
Beta release,2026-06-22,,Engineering,milestone,3
Marketing,2026-05-04,2026-09-12,Marketing,task,4
Public launch,2026-10-05,,Marketing,milestone,3
Sales enablement,2026-07-01,2026-09-30,Sales,task,6`;

function Index() {
  const [plan, setPlan] = useState<Plan>(SAMPLE_PLAN);
  const [style, setStyle] = useState<Style>("swimlane");
  const [raw, setRaw] = useState(SAMPLE_CSV);
  const [error, setError] = useState<string | null>(null);
  const [extracting, setExtracting] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const view = useMemo(() => {
    if (style === "milestone") return <MilestoneTimeline plan={plan} />;
    if (style === "roadmap") return <RoadmapQuarters plan={plan} />;
    return <SwimlaneGantt plan={plan} />;
  }, [plan, style]);

  const handleApply = () => {
    try {
      const next = parsePlanInput(raw);
      if (!next.tasks.length) throw new Error("No tasks found");
      setPlan(next);
      setError(null);
    } catch (e: any) {
      setError(e.message || "Could not parse input");
    }
  };

  const handlePng = async () => {
    if (!canvasRef.current) return;
    const dataUrl = await toPng(canvasRef.current, {
      pixelRatio: 2,
      backgroundColor: "#ffffff",
    });
    const a = document.createElement("a");
    a.download = `${plan.title.replace(/\s+/g, "_")}.png`;
    a.href = dataUrl;
    a.click();
  };

  const handleScreenshot = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload an image file (PNG, JPG, etc.)");
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      toast.error("Image must be under 8 MB.");
      return;
    }
    setExtracting(true);
    try {
      const dataUrl: string = await new Promise((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(r.result as string);
        r.onerror = () => reject(new Error("Could not read file"));
        r.readAsDataURL(file);
      });
      const { csv } = await extractPlanFromImage({ data: { imageDataUrl: dataUrl } });
      if (!csv || !csv.toLowerCase().includes("name")) {
        throw new Error("AI didn't return a usable plan. Try a clearer screenshot.");
      }
      setRaw(csv);
      const next = parsePlanInput(csv);
      if (!next.tasks.length) throw new Error("No tasks found in the screenshot.");
      setPlan(next);
      setError(null);
      toast.success(`Extracted ${next.tasks.length} tasks from your screenshot.`);
    } catch (e: any) {
      toast.error(e.message || "Could not extract plan from image.");
    } finally {
      setExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <div
      className="min-h-screen"
      style={{ background: "var(--gradient-canvas), var(--background)" }}
    >
      {/* Top bar */}
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-9 w-9 items-center justify-center rounded-xl text-primary-foreground shadow-md"
              style={{ background: "var(--gradient-hero)" }}
            >
              <Sparkles className="h-4 w-4" />
            </div>
            <div className="leading-tight">
              <div className="font-display text-lg font-bold">Plan Studio</div>
              <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground">
                Beautiful project timelines
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handlePng}>
              <ImageIcon className="mr-2 h-4 w-4" />
              PNG
            </Button>
            <Button
              size="sm"
              onClick={() => exportPlanToPptx(plan, style)}
              style={{ background: "var(--gradient-hero)" }}
            >
              <Download className="mr-2 h-4 w-4" />
              Export PowerPoint
            </Button>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-[1400px] px-6 pt-10">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div className="max-w-2xl">
            <span className="inline-flex items-center gap-2 rounded-full border bg-background/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-widest text-primary backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
              Office Timeline–style planner
            </span>
            <h1 className="font-display mt-4 text-5xl font-bold leading-[1.05] tracking-tight text-foreground md:text-6xl">
              Plan it once.{" "}
              <span
                className="bg-clip-text text-transparent"
                style={{ backgroundImage: "var(--gradient-hero)" }}
              >
                Present it beautifully.
              </span>
            </h1>
            <p className="mt-4 max-w-xl text-base text-muted-foreground">
              Paste a CSV or JSON plan, choose a style, and produce a
              boardroom-ready timeline you can drop straight into PowerPoint.
            </p>
          <p className="mt-2 text-xs font-medium text-primary">
            ✓ PowerPoint exports are fully editable — every bar, milestone, and label is a native shape you can recolor, resize, or rewrite in PowerPoint.
          </p>
          </div>
          <div className="flex items-center gap-3">
            <Tabs value={style} onValueChange={(v) => setStyle(v as Style)}>
              <TabsList className="rounded-full p-1">
                <TabsTrigger className="rounded-full px-4" value="swimlane">
                  Swimlane
                </TabsTrigger>
                <TabsTrigger className="rounded-full px-4" value="milestone">
                  Milestone
                </TabsTrigger>
                <TabsTrigger className="rounded-full px-4" value="roadmap">
                  Roadmap
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
        </div>
      </section>

      {/* Canvas */}
      <section className="mx-auto max-w-[1400px] px-6 py-10">
        <div ref={canvasRef}>{view}</div>
      </section>

      {/* Data editor */}
      <section className="mx-auto max-w-[1400px] px-6 pb-20">
        <div className="rounded-2xl border bg-card p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-widest">
                Plan data — paste CSV/JSON or upload a screenshot
              </h3>
            </div>
            <div className="flex gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleScreenshot(f);
                }}
              />
              <Button
                variant="outline"
                size="sm"
                disabled={extracting}
                onClick={() => fileInputRef.current?.click()}
              >
                {extracting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <ScanLine className="mr-2 h-4 w-4" />
                )}
                {extracting ? "Reading screenshot…" : "Upload screenshot"}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setRaw(SAMPLE_CSV);
                  setPlan(SAMPLE_PLAN);
                  setError(null);
                }}
              >
                Reset sample
              </Button>
              <Button size="sm" onClick={handleApply}>
                Apply
              </Button>
            </div>
          </div>
          <textarea
            value={raw}
            onChange={(e) => setRaw(e.target.value)}
            spellCheck={false}
            className="h-64 w-full resize-none rounded-xl border bg-background/60 p-4 font-mono text-xs leading-relaxed text-foreground outline-none focus:ring-2 focus:ring-ring"
          />
          {error && (
            <p className="mt-2 text-xs font-medium text-destructive">{error}</p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            CSV columns: <code>name,start,end,swimlane,kind,color</code>. Leave{" "}
            <code>end</code> blank for a milestone. <code>color</code> is 1–6.
            JSON: <code>{`{ title, subtitle, tasks: [...] }`}</code> or an array
            of tasks.
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            Tip: click <strong>Upload screenshot</strong> to drop in an image of an Excel sheet — AI will read it and fill the editor automatically.
          </p>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        Crafted with care · Plan Studio
      </footer>
    </div>
  );
}
