import { useWindowDimensions } from 'react-native';
import { MOBILE_BREAKPOINT } from './breakpoints';

export function useDashboardCompact() {
  const { width } = useWindowDimensions();
  const isCompact = width < MOBILE_BREAKPOINT;
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
