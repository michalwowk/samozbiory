/**
 * Design tokens — the single source of truth for this product's visual identity.
 *
 * ADR 0008: these are authored as TypeScript and `styles/theme.css` is GENERATED from them
 * (`pnpm --filter @repo/ui run build:theme`). Never edit the CSS by hand.
 *
 * The reason is not tidiness. shadcn components are Tailwind, Base UI and `className`, all of which are
 * DOM — they can never be shared with React Native. Tokens can be, but only as data. Hand-written CSS
 * closes that door; a TypeScript object keeps it open at no cost today.
 *
 * Colours are OKLCH, matching what shadcn 4 emits. OKLCH is perceptually uniform, so a scale built by
 * varying lightness alone keeps its hue and saturation looking consistent.
 */

/** `oklch(L C H)` — lightness 0–1, chroma, hue in degrees. */
type Oklch = `oklch(${string})`;

/** Raw palette. Nothing outside this file should reference these directly — use `semantic` below. */
export const palette = {
  /**
   * Brand: the green of a field in June. Hue 145 sits between grass and leaf, warm enough to avoid
   * the clinical teal that generic UI kits default to.
   */
  green: {
    50: "oklch(0.975 0.015 145)",
    100: "oklch(0.94 0.035 145)",
    200: "oklch(0.885 0.065 145)",
    300: "oklch(0.81 0.1 145)",
    400: "oklch(0.72 0.13 145)",
    500: "oklch(0.63 0.145 145)",
    600: "oklch(0.54 0.135 145)",
    700: "oklch(0.45 0.115 145)",
    800: "oklch(0.37 0.09 145)",
    900: "oklch(0.3 0.07 145)",
    950: "oklch(0.21 0.05 145)",
  },
  /**
   * Neutrals carry a trace of chroma at hue 85 (soil, straw) instead of being pure grey. At 0.006 it
   * reads as warmth rather than colour, which stops photo-heavy pages looking cold.
   */
  stone: {
    50: "oklch(0.985 0.003 85)",
    100: "oklch(0.97 0.005 85)",
    200: "oklch(0.925 0.006 85)",
    300: "oklch(0.87 0.007 85)",
    400: "oklch(0.71 0.008 85)",
    500: "oklch(0.56 0.008 85)",
    600: "oklch(0.44 0.007 85)",
    700: "oklch(0.36 0.006 85)",
    800: "oklch(0.27 0.005 85)",
    900: "oklch(0.2 0.004 85)",
    950: "oklch(0.145 0.003 85)",
  },
  /** Ripe-fruit accent: used for in-season badges and calls to action that must beat green. */
  berry: {
    100: "oklch(0.93 0.05 15)",
    400: "oklch(0.7 0.16 15)",
    500: "oklch(0.62 0.19 15)",
    600: "oklch(0.54 0.18 15)",
  },
  red: {
    400: "oklch(0.704 0.191 22.216)",
    500: "oklch(0.577 0.245 27.325)",
  },
  white: "oklch(1 0 0)",
} as const;

/**
 * Semantic layer. These names are shadcn's contract — its components reference `bg-primary`,
 * `text-muted-foreground` and so on, so the keys here must not be renamed.
 */
export const semantic = {
  light: {
    background: palette.white,
    foreground: palette.stone[950],
    card: palette.white,
    "card-foreground": palette.stone[950],
    popover: palette.white,
    "popover-foreground": palette.stone[950],
    primary: palette.green[600],
    "primary-foreground": palette.green[50],
    secondary: palette.stone[100],
    "secondary-foreground": palette.stone[900],
    muted: palette.stone[100],
    "muted-foreground": palette.stone[500],
    accent: palette.green[100],
    "accent-foreground": palette.green[800],
    destructive: palette.red[500],
    border: palette.stone[200],
    input: palette.stone[200],
    ring: palette.green[500],
    "chart-1": palette.green[500],
    "chart-2": palette.green[700],
    "chart-3": palette.berry[500],
    "chart-4": palette.stone[400],
    "chart-5": palette.stone[600],
    sidebar: palette.stone[50],
    "sidebar-foreground": palette.stone[950],
    "sidebar-primary": palette.green[600],
    "sidebar-primary-foreground": palette.green[50],
    "sidebar-accent": palette.green[100],
    "sidebar-accent-foreground": palette.green[800],
    "sidebar-border": palette.stone[200],
    "sidebar-ring": palette.green[500],
  },
  dark: {
    background: palette.stone[950],
    foreground: palette.stone[100],
    card: palette.stone[900],
    "card-foreground": palette.stone[100],
    popover: palette.stone[900],
    "popover-foreground": palette.stone[100],
    primary: palette.green[400],
    "primary-foreground": palette.green[950],
    secondary: palette.stone[800],
    "secondary-foreground": palette.stone[100],
    muted: palette.stone[800],
    "muted-foreground": palette.stone[400],
    accent: palette.green[900],
    "accent-foreground": palette.green[100],
    destructive: palette.red[400],
    // Borders as translucent white read better than a fixed grey over photography.
    border: "oklch(1 0 0 / 10%)" as Oklch,
    input: "oklch(1 0 0 / 15%)" as Oklch,
    ring: palette.green[500],
    "chart-1": palette.green[400],
    "chart-2": palette.green[600],
    "chart-3": palette.berry[400],
    "chart-4": palette.stone[500],
    "chart-5": palette.stone[300],
    sidebar: palette.stone[900],
    "sidebar-foreground": palette.stone[100],
    "sidebar-primary": palette.green[400],
    "sidebar-primary-foreground": palette.green[950],
    "sidebar-accent": palette.green[900],
    "sidebar-accent-foreground": palette.green[100],
    "sidebar-border": "oklch(1 0 0 / 10%)" as Oklch,
    "sidebar-ring": palette.green[500],
  },
} as const;

/** Non-colour tokens. `--radius` is the base; shadcn derives its scale from it with `calc()`. */
export const shape = {
  radius: "0.625rem",
} as const;

export type SemanticToken = keyof typeof semantic.light;
