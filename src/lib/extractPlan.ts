import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const InputSchema = z.object({
  imageDataUrl: z.string().min(20),
});

const SYSTEM_PROMPT = `You are a data extraction engine. The user uploads a screenshot of a spreadsheet (Excel, Google Sheets, etc.) that contains a project plan.

Extract every task / milestone you can see and return ONLY a CSV with this exact header on the first line:

name,start,end,swimlane,kind,color

Rules:
- One row per task / milestone.
- "start" and "end" must be ISO dates (YYYY-MM-DD). If only a month/year is shown, use day 01 (start) or last day of month (end).
- Leave "end" blank for milestones (no duration). Set kind = "milestone" for those, otherwise kind = "task".
- "swimlane" = the team / category / phase column from the sheet (e.g. Product, Engineering, Marketing). Use "General" if none.
- "color" = an integer 1-6, cycling so the same swimlane gets the same color when possible.
- Quote any field containing a comma.
- DO NOT output markdown fences, commentary, JSON, or anything other than the CSV.`;

export const extractPlanFromImage = createServerFn({ method: "POST" })
  .inputValidator((data) => InputSchema.parse(data))
  .handler(async ({ data }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("LOVABLE_API_KEY is not configured");

    const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Extract the plan from this spreadsheet screenshot." },
              { type: "image_url", image_url: { url: data.imageDataUrl } },
            ],
          },
        ],
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      if (res.status === 429) throw new Error("AI rate limit reached. Please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Cloud → AI.");
      throw new Error(`AI gateway error (${res.status}): ${text.slice(0, 200)}`);
    }

    const json = await res.json();
    const csv: string = json.choices?.[0]?.message?.content ?? "";
    // strip accidental code fences
    const cleaned = csv
      .replace(/^```(?:csv)?\s*/i, "")
      .replace(/```\s*$/i, "")
      .trim();
    return { csv: cleaned };
  });