import { useAuth } from '@/hooks/use-auth'
import type { User } from '@supabase/supabase-js'
import { Image } from 'expo-image'
import { useState } from 'react'
import { ActivityIndicator, Button, Pressable, Text, View } from 'react-native'

function getUserLabel(user: User) {
  return (
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email ??
    'Signed in'
  )
}

function getUserAvatar(user: User) {
  return user.user_metadata?.avatar_url ?? user.user_metadata?.picture
}

function getUserInitials(user: User) {
  const label = getUserLabel(user)
  const parts = label.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return label.slice(0, 2).toUpperCase()
}

export function UserMenu() {
  const { user, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  if (!user) return null

  const avatarUrl = getUserAvatar(user)
  const label = getUserLabel(user)

  async function handleSignOut() {
    try {
      setSigningOut(true)
      await signOut()
    } finally {
      setSigningOut(false)
    }
  }

  return (
    <View style={{ gap: 12, padding: 16, width: '100%' }}>
      <Pressable
        accessibilityRole="button"
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 12,
          padding: 12,
          borderRadius: 12,
          backgroundColor: '#f4f4f5',
        }}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: 44, height: 44, borderRadius: 22 }}
          />
        ) : (
          <View
            style={{
              width: 44,
              height: 44,
              borderRadius: 22,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#208AEF',
            }}
          >
            <Text style={{ color: '#fff', fontWeight: '600' }}>
              {getUserInitials(user)}
            </Text>
          </View>
        )}
        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: 16, fontWeight: '600' }}>{label}</Text>
          {user.email ? (
            <Text selectable style={{ fontSize: 14, color: '#71717a' }}>
              {user.email}
            </Text>
          ) : null}
        </View>
      </Pressable>

      <Button
        title={signingOut ? 'Signing out…' : 'Sign out'}
        onPress={handleSignOut}
        disabled={signingOut}
      />
      {signingOut ? <ActivityIndicator /> : null}
    </View>
  )
}
