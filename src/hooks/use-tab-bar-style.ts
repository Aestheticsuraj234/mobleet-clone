import { useNavigation } from '@react-navigation/native'
import { useLayoutEffect, useMemo } from 'react'
import type { ViewStyle } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const TAB_BAR_BASE_HEIGHT = 56

type NavParent = {
  getParent: () => NavParent | undefined
  getState?: () => { type?: string }
  setOptions: (options: { tabBarStyle: ViewStyle | { display: string } }) => void
}

/** Shared tab bar style that respects the device home-indicator / nav bar. */
export function useTabBarStyle(): ViewStyle {
  const insets = useSafeAreaInsets()

  return useMemo(
    () => ({
      backgroundColor: '#0f1014',
      borderTopColor: 'rgba(255,255,255,0.07)',
      borderTopWidth: 1,
      height: TAB_BAR_BASE_HEIGHT + insets.bottom,
      paddingTop: 6,
      paddingBottom: Math.max(insets.bottom, 8),
    }),
    [insets.bottom]
  )
}

function findTabNavigator(navigation: NavParent) {
  let parent = navigation.getParent()
  while (parent) {
    const state = parent.getState?.()
    if (state?.type === 'tab') return parent
    parent = parent.getParent()
  }
  return undefined
}

/**
 * Hide the parent tab bar while a nested stack screen is focused
 * (problem details / solve), then restore it on blur/unmount.
 */
export function useHideTabBar() {
  const navigation = useNavigation() as unknown as NavParent
  const tabBarStyle = useTabBarStyle()

  useLayoutEffect(() => {
    const tabs = findTabNavigator(navigation)
    tabs?.setOptions({ tabBarStyle: { display: 'none' } })

    return () => {
      tabs?.setOptions({ tabBarStyle })
    }
  }, [navigation, tabBarStyle])
}
