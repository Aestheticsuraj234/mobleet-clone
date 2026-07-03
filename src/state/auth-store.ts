import { createSessionFromUrl, isAuthCallbackUrl } from '@/lib/auth'
import { supabase } from '@/lib/supabase'
import type { Session, User } from '@supabase/supabase-js'
import { create } from 'zustand'

interface AuthStore {
  session: Session | null
  user: User | null
  isLoading: boolean
  isInitialized: boolean

  initialize: () => () => void
  handleDeepLink: (url: string) => Promise<void>
  signOut: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  session: null,
  user: null,
  isLoading: true,
  isInitialized: false,

  initialize: () => {
    if (get().isInitialized) {
      return () => {}
    }

    set({ isInitialized: true })

    // Restore persisted session
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({
        session,
        user: session?.user ?? null,
        isLoading: false,
      })
    })

    // Keep store in sync with Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        set({
          session,
          user: session?.user ?? null,
          isLoading: false,
        })
      }
    )

    return () => subscription.unsubscribe()
  },

  handleDeepLink: async (url: string) => {
    if (!isAuthCallbackUrl(url)) return
    await createSessionFromUrl(url)
    // onAuthStateChange will update the store
  },

  signOut: async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  },
}))