import { useMemo } from 'react'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type ScreenInsetsOptions = {
  /** Extra space below scroll content (default 24). */
  bottomExtra?: number
  /** Extra space above content under the status bar (default 8). */
  topExtra?: number
  /**
   * When true, include the bottom safe-area inset (home indicator / nav bar).
   * Use on full-screen stack routes where the tab bar is hidden.
   * Leave false on tab roots — the tab bar already consumes the bottom inset.
   */
  includeBottomInset?: boolean
}

/**
 * Consistent padding for scrollable screens across notched / gesture devices.
 */
export function useScreenInsets(options: ScreenInsetsOptions = {}) {
  const {
    bottomExtra = 24,
    topExtra = 8,
    includeBottomInset = false,
  } = options
  const insets = useSafeAreaInsets()

  return useMemo(() => {
    const bottom = bottomExtra + (includeBottomInset ? insets.bottom : 0)

    return {
      insets,
      /** Apply to ScrollView contentContainerStyle */
      contentPadding: {
        paddingTop: topExtra,
        paddingBottom: bottom,
        paddingHorizontal: 20,
      },
      /** Apply to bottom sheets / modals */
      sheetPaddingBottom: Math.max(insets.bottom, 12) + 20,
      /** Sticky footer padding when sitting above the home indicator */
      footerPaddingBottom: Math.max(insets.bottom, 12) + 12,
    }
  }, [bottomExtra, includeBottomInset, insets, topExtra])
}
