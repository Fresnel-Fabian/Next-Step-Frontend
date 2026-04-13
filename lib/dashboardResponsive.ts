import { useWindowDimensions } from 'react-native';

/** Matches app shell `(admin|staff|student)/_layout` mobile breakpoint */
export const DASHBOARD_COMPACT_BREAKPOINT = 768;

export function useDashboardCompact() {
  const { width } = useWindowDimensions();
  const isCompact = width < DASHBOARD_COMPACT_BREAKPOINT;
  return {
    isCompact,
    /** Scroll content horizontal padding */
    contentPaddingX: isCompact ? 14 : 24,
    contentPaddingY: isCompact ? 16 : 24,
    greetingFontSize: isCompact ? 22 : 26,
    secondaryFontSize: isCompact ? 13 : 14,
    cardPadding: isCompact ? 16 : 24,
    sectionGap: isCompact ? 16 : 28,
  };
}
