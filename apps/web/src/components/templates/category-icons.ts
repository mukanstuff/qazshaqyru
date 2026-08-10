import {
  Cake,
  Heart,
  PartyPopper,
  Sparkles,
  Star,
  Users,
  type LucideIcon,
} from 'lucide-react';

/**
 * Maps Template.category DB enum to a Lucide icon for the catalog chip row.
 * When a category has no icon, callers fall back to a neutral star.
 */
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  wedding: Heart,
  toy: PartyPopper,
  betashar: Sparkles,
  kyz_uzatu: Sparkles,
  sundet_toy: Star,
  tusau_keser: Star,
  birthday: Cake,
  anniversary: Cake,
  corporate: Users,
  other: Sparkles,
};

export function categoryIcon(category: string): LucideIcon {
  return CATEGORY_ICON_MAP[category] ?? Sparkles;
}