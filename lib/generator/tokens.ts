import type { DesignStyle, DesignTokens, ProjectInfo } from "@/lib/types";

export const INDUSTRIES = [
  { label: "Education / IT Training", value: "education" },
  { label: "Technology & Software", value: "technology" },
  { label: "Business & Consulting", value: "business" },
  { label: "Healthcare & Wellness", value: "healthcare" },
  { label: "Creative & Design", value: "creative" },
  { label: "Real Estate", value: "real-estate" },
  { label: "Restaurant & Food", value: "food" },
  { label: "Fitness & Sports", value: "fitness" },
  { label: "E-commerce & Retail", value: "ecommerce" },
  { label: "NGO & Nonprofit", value: "ngo" },
  { label: "Professional Services", value: "services" },
  { label: "Other", value: "other" },
];

export const ACCENT_COLORS: Record<string, { hex: string; rgb: string }> = {
  indigo: { hex: "#4f46e5", rgb: "79, 70, 229" },
  blue: { hex: "#2563eb", rgb: "37, 99, 235" },
  sky: { hex: "#0284c7", rgb: "2, 132, 199" },
  emerald: { hex: "#059669", rgb: "5, 150, 105" },
  violet: { hex: "#7c3aed", rgb: "124, 58, 237" },
  rose: { hex: "#e11d48", rgb: "225, 29, 72" },
  amber: { hex: "#d97706", rgb: "217, 119, 6" },
  slate: { hex: "#475569", rgb: "71, 85, 105" },
};

export const DESIGN_STYLES: Record<DesignStyle, string> = {
  modern: "Modern — clean, bright and confident",
  minimal: "Minimal — restrained, airy and elegant",
  premium: "Premium — refined, editorial and high-end",
  bold: "Bold — dramatic, energetic and assertive",
};

export function hexToRgb(hex: string): string {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const num = parseInt(full, 16);
  if (Number.isNaN(num) || full.length !== 6) return "109, 139, 255";
  return `${(num >> 16) & 255}, ${(num >> 8) & 255}, ${num & 255}`;
}

export function isHexColor(value?: string): boolean {
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value ?? "");
}

export function resolveAccent(info: ProjectInfo): {
  hex: string;
  rgb: string;
  key: string;
} {
  if (info.color && isHexColor(info.color)) {
    return { hex: info.color, rgb: hexToRgb(info.color), key: "custom" };
  }
  const colorKey = info.color?.toLowerCase();
  const match = colorKey && ACCENT_COLORS[colorKey];
  if (match && colorKey) return { hex: match.hex, rgb: match.rgb, key: colorKey };
  return { hex: ACCENT_COLORS.indigo.hex, rgb: ACCENT_COLORS.indigo.rgb, key: "indigo" };
}
export function resolveTokens(info: ProjectInfo): DesignTokens {
  const style: DesignStyle = info.design ?? "modern";
  const accent = resolveAccent(info);

  const perStyle: Record<
    DesignStyle,
    { radius: string; headingFont: string; heroStyle: DesignTokens["heroStyle"]; ctaGradient: boolean; showTopBar: boolean }
  > = {
    modern: { radius: "0.75rem", headingFont: "var(--font-sans)", heroStyle: "split", ctaGradient: true, showTopBar: true },
    minimal: { radius: "0.25rem", headingFont: "var(--font-sans)", heroStyle: "centered", ctaGradient: false, showTopBar: false },
    premium: { radius: "1rem", headingFont: "var(--font-serif)", heroStyle: "split", ctaGradient: false, showTopBar: true },
    bold: { radius: "0.5rem", headingFont: "var(--font-sans)", heroStyle: "overlay", ctaGradient: true, showTopBar: true },
  };

  const s = perStyle[style];
  return {
    name: style,
    accent: accent.hex,
    accentRgb: accent.rgb,
    accentSoft: `rgba(${accent.rgb}, 0.12)`,
    onAccent: "#ffffff",
    radius: s.radius,
    headingFont: s.headingFont,
    heroStyle: s.heroStyle,
    ctaGradient: s.ctaGradient,
    showTopBar: s.showTopBar,
  };
}
