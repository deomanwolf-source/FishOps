export interface ThemePalette {
  primary: string;
  accent: string;
  background: string;
  card: string;
  text_primary: string;
  text_secondary: string;
  success: string;
  warning: string;
  danger: string;
  info: string;
  table_header_bg: string;
}

export interface ThemeShape {
  border_radius_px: number;
  shadow: string;
}

export interface ThemeTypography {
  font_family: string;
  title_size_px_min: number;
  title_size_px_max: number;
  section_size_px_min: number;
  section_size_px_max: number;
  body_size_px: number;
}

export interface ThemeButtons {
  primary: string;
  secondary: string;
  danger: string;
  soft: string;
}

export interface OperationalTheme {
  name: string;
  feel: string;
  palette: ThemePalette;
  shape: ThemeShape;
  typography: ThemeTypography;
  buttons: ThemeButtons;
  status_chips: Record<"OK" | "LOW" | "CRITICAL", string>;
}

export const OPERATIONAL_BLUE_TEAL_THEME: OperationalTheme = {
  name: "Operational Blue + Teal",
  feel: "professional, clean, not flashy",
  palette: {
    primary: "#1E3A8A",
    accent: "#0D9488",
    background: "#F8FAFC",
    card: "#FFFFFF",
    text_primary: "#0F172A",
    text_secondary: "#475569",
    success: "#16A34A",
    warning: "#F59E0B",
    danger: "#DC2626",
    info: "#3B82F6",
    table_header_bg: "#EEF2FF"
  },
  shape: {
    border_radius_px: 10,
    shadow: "0 4px 12px rgba(0,0,0,0.06)"
  },
  typography: {
    font_family: "Inter, Segoe UI, sans-serif",
    title_size_px_min: 22,
    title_size_px_max: 26,
    section_size_px_min: 16,
    section_size_px_max: 18,
    body_size_px: 14
  },
  buttons: {
    primary: "solid-blue",
    secondary: "outline",
    danger: "solid-red",
    soft: "light-teal"
  },
  status_chips: {
    OK: "#16A34A",
    LOW: "#F59E0B",
    CRITICAL: "#DC2626"
  }
};
