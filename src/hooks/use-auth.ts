// src/hooks/use-auth.ts
import { useAuthStore } from '@/state/auth-store'

export function useAuth() {
  const session = useAuthStore((s) => s.session)
  const user = useAuthStore((s) => s.user)
  const isLoading = useAuthStore((s) => s.isLoading)
  const signOut = useAuthStore((s) => s.signOut)

  return { session, user, isLoading, signOut }
}