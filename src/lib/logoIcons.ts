import { BookOpen, Building2, GraduationCap, Landmark, School, Sparkles } from "lucide-react";

export const LOGO_ICONS = {
  graduation: GraduationCap,
  book: BookOpen,
  building: Building2,
  landmark: Landmark,
  school: School,
  sparkles: Sparkles,
} as const;

export type LogoIconKey = keyof typeof LOGO_ICONS;

export const LOGO_ICON_KEYS = Object.keys(LOGO_ICONS) as LogoIconKey[];

export function getLogoIcon(key: string) {
  return (LOGO_ICONS as Record<string, (typeof LOGO_ICONS)[LogoIconKey]>)[key] ?? GraduationCap;
}
