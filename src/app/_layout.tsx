import { useAuthStore } from '@/state/auth-store'
import { Stack, useRouter, useSegments } from 'expo-router'
import { StatusBar } from 'expo-status-bar'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect } from 'react'
import 'react-native-url-polyfill/auto'

SplashScreen.preventAutoHideAsync()

function RootNavigator() {
  const session = useAuthStore((s) => s.session)
  const isLoading = useAuthStore((s) => s.isLoading)
  const initialize = useAuthStore((s) => s.initialize)
  const segments = useSegments()
  const router = useRouter()

  useEffect(() => {
    const cleanup = initialize()
    return cleanup
  }, [initialize])

  useEffect(() => {
    if (isLoading) return

    const inAuthGroup = segments[0] === '(auth)'

    if (!session && !inAuthGroup) {
      router.replace('/(auth)/sign-in')
    } else if (session && inAuthGroup) {
      router.replace('/')
    }

    SplashScreen.hideAsync()
  }, [session, isLoading, segments, router])

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#0a0a0c' },
        animation: 'fade',
      }}
    />
  )
}

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <RootNavigator />
    </>
  )
}
