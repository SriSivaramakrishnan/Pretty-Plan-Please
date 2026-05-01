// Theme presets for the timeline canvas + PPTX export.
// Each theme drives:
//  - CSS variables consumed by the on-screen components
//  - Hex equivalents + fonts used by the PPTX exporter

export type ThemeId =
  | "executive"
  | "midnight"
  | "sunrise"
  | "forest"
  | "mono"
  | "candy";

export interface Theme {
  id: ThemeId;
  label: string;
  description: string;
  // CSS variables applied to the canvas wrapper (style attribute)
  cssVars: Record<string, string>;
  // Tailwind classes for the container background
  canvasBg: string;
  // PPTX equivalents
  pptx: {
    headingFont: string;
    bodyFont: string;
    background: string; // hex (no #)
    ink: string; // hex
    muted: string; // hex
    rule: string; // hex
    laneA: string; // hex
    laneB: string; // hex
    palette: [string, string, string, string, string, string]; // 6 task colors
  };
}

export const THEMES: Theme[] = [
  {
    id: "executive",
    label: "Executive",
    description: "Crisp boardroom blues",
    canvasBg: "bg-card",
    cssVars: {
      "--tl-ink": "oklch(0.18 0.04 250)",
      "--tl-rule": "oklch(0.88 0.02 250)",
      "--tl-soft": "oklch(0.97 0.01 250)",
      "--tl-1": "#4F6BED",
      "--tl-2": "#2BB6B0",
      "--tl-3": "#F25C54",
      "--tl-4": "#E8A93A",
      "--tl-5": "#8E5CD9",
      "--tl-6": "#3FB682",
    },
    pptx: {
      headingFont: "Georgia",
      bodyFont: "Calibri",
      background: "F7F9FC",
      ink: "1A2340",
      muted: "6B7280",
      rule: "D7DCE6",
      laneA: "F1F4FA",
      laneB: "FFFFFF",
      palette: ["4F6BED", "2BB6B0", "F25C54", "E8A93A", "8E5CD9", "3FB682"],
    },
  },
  {
    id: "midnight",
    label: "Midnight",
    description: "Dark slide, neon accents",
    canvasBg: "bg-[#0F1530]",
    cssVars: {
      "--tl-ink": "oklch(0.97 0.01 250)",
      "--tl-rule": "oklch(0.35 0.05 250)",
      "--tl-soft": "oklch(0.22 0.04 250)",
      "--tl-1": "#7AA2FF",
      "--tl-2": "#37E5D2",
      "--tl-3": "#FF7A8A",
      "--tl-4": "#FFD166",
      "--tl-5": "#C4A2FF",
      "--tl-6": "#7BE495",
    },
    pptx: {
      headingFont: "Calibri",
      bodyFont: "Calibri",
      background: "0F1530",
      ink: "F4F6FF",
      muted: "9AA3C7",
      rule: "2A335C",
      laneA: "151C3D",
      laneB: "10162F",
      palette: ["7AA2FF", "37E5D2", "FF7A8A", "FFD166", "C4A2FF", "7BE495"],
    },
  },
  {
    id: "sunrise",
    label: "Sunrise",
    description: "Warm coral & amber",
    canvasBg: "bg-[#FFF7F0]",
    cssVars: {
      "--tl-ink": "oklch(0.22 0.06 30)",
      "--tl-rule": "oklch(0.86 0.04 40)",
      "--tl-soft": "oklch(0.96 0.03 50)",
      "--tl-1": "#F2643D",
      "--tl-2": "#F4A261",
      "--tl-3": "#E76F51",
      "--tl-4": "#E9C46A",
      "--tl-5": "#A87C5F",
      "--tl-6": "#2A9D8F",
    },
    pptx: {
      headingFont: "Palatino",
      bodyFont: "Calibri",
      background: "FFF7F0",
      ink: "3B2415",
      muted: "8C6A55",
      rule: "E8D4C2",
      laneA: "FBEEDE",
      laneB: "FFF7F0",
      palette: ["F2643D", "F4A261", "E76F51", "E9C46A", "A87C5F", "2A9D8F"],
    },
  },
  {
    id: "forest",
    label: "Forest",
    description: "Earthy greens & moss",
    canvasBg: "bg-[#F2F5EE]",
    cssVars: {
      "--tl-ink": "oklch(0.22 0.05 150)",
      "--tl-rule": "oklch(0.84 0.03 150)",
      "--tl-soft": "oklch(0.95 0.02 150)",
      "--tl-1": "#2C5F2D",
      "--tl-2": "#97BC62",
      "--tl-3": "#3E885B",
      "--tl-4": "#B8B42D",
      "--tl-5": "#56666B",
      "--tl-6": "#D9A441",
    },
    pptx: {
      headingFont: "Cambria",
      bodyFont: "Calibri",
      background: "F2F5EE",
      ink: "1F2D1F",
      muted: "6E7B66",
      rule: "D5DDC8",
      laneA: "E8EEDA",
      laneB: "F2F5EE",
      palette: ["2C5F2D", "97BC62", "3E885B", "B8B42D", "56666B", "D9A441"],
    },
  },
  {
    id: "mono",
    label: "Monochrome",
    description: "Editorial black & white",
    canvasBg: "bg-white",
    cssVars: {
      "--tl-ink": "oklch(0.15 0 0)",
      "--tl-rule": "oklch(0.85 0 0)",
      "--tl-soft": "oklch(0.96 0 0)",
      "--tl-1": "#111111",
      "--tl-2": "#3A3A3A",
      "--tl-3": "#6B6B6B",
      "--tl-4": "#9A9A9A",
      "--tl-5": "#C4C4C4",
      "--tl-6": "#E2E2E2",
    },
    pptx: {
      headingFont: "Arial Black",
      bodyFont: "Arial",
      background: "FFFFFF",
      ink: "111111",
      muted: "6B6B6B",
      rule: "DDDDDD",
      laneA: "F5F5F5",
      laneB: "FFFFFF",
      palette: ["111111", "3A3A3A", "6B6B6B", "9A9A9A", "C4C4C4", "E2E2E2"],
    },
  },
  {
    id: "candy",
    label: "Candy",
    description: "Playful pop palette",
    canvasBg: "bg-[#FBF5FF]",
    cssVars: {
      "--tl-ink": "oklch(0.22 0.08 320)",
      "--tl-rule": "oklch(0.86 0.04 320)",
      "--tl-soft": "oklch(0.96 0.03 320)",
      "--tl-1": "#F96197",
      "--tl-2": "#7C5CFF",
      "--tl-3": "#FFB347",
      "--tl-4": "#22C1C3",
      "--tl-5": "#FF6F61",
      "--tl-6": "#5BC0BE",
    },
    pptx: {
      headingFont: "Trebuchet MS",
      bodyFont: "Calibri",
      background: "FBF5FF",
      ink: "2A1242",
      muted: "7B6A92",
      rule: "E5D9F2",
      laneA: "F2E6FB",
      laneB: "FBF5FF",
      palette: ["F96197", "7C5CFF", "FFB347", "22C1C3", "FF6F61", "5BC0BE"],
    },
  },
];

export function getTheme(id: ThemeId): Theme {
  return THEMES.find((t) => t.id === id) || THEMES[0];
}
