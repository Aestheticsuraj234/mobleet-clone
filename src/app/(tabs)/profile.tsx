import { useAuth } from '@/hooks/use-auth'
import { useScreenInsets } from '@/hooks/use-screen-insets'
import { colors } from '@/lib/theme'
import { Feather } from '@expo/vector-icons'
import { useState } from 'react'
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function getDisplayName(user: NonNullable<ReturnType<typeof useAuth>['user']>) {
  return (
    user.user_metadata?.full_name ??
    user.user_metadata?.name ??
    user.email ??
    'MobLeet User'
  )
}

function getAvatar(user: NonNullable<ReturnType<typeof useAuth>['user']>) {
  return user.user_metadata?.avatar_url ?? user.user_metadata?.picture
}

function getInitials(label: string) {
  const parts = label.split(/\s+/).filter(Boolean)
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
  }
  return label.slice(0, 2).toUpperCase()
}

export default function ProfileScreen() {
  const { contentPadding } = useScreenInsets({
    bottomExtra: 24,
    topExtra: 12,
  })
  const { user, isLoading, signOut } = useAuth()
  const [signingOut, setSigningOut] = useState(false)

  async function handleSignOut() {
    if (signingOut) return
    setSigningOut(true)
    try {
      await signOut()
    } catch (err) {
      Alert.alert(
        'Sign out failed',
        err instanceof Error ? err.message : 'Unknown error'
      )
    } finally {
      setSigningOut(false)
    }
  }

  if (isLoading || !user) {
    return (
      <SafeAreaView style={styles.loading} edges={['top', 'bottom']}>
        <ActivityIndicator color={colors.lime} />
      </SafeAreaView>
    )
  }

  const displayName = getDisplayName(user)
  const avatarUrl = getAvatar(user)
  const initials = getInitials(displayName)

  return (
    <View style={styles.screen}>
      <SafeAreaView style={styles.safe} edges={['top']}>
        <ScrollView
          contentContainerStyle={[styles.scroll, contentPadding]}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          <Text style={styles.title}>Profile</Text>
          <Text style={styles.subtitle}>Manage your MobLeet account.</Text>

          <View style={styles.card}>
            <View style={styles.avatar}>
              {avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatarImage} />
              ) : (
                <Text style={styles.avatarInitials}>{initials}</Text>
              )}
            </View>
            <Text style={styles.name}>{displayName}</Text>
            <Text style={styles.email}>{user.email ?? 'No email'}</Text>
          </View>

          <Pressable
            onPress={handleSignOut}
            disabled={signingOut}
            style={({ pressed }) => [
              styles.signOutButton,
              (pressed || signingOut) && styles.pressed,
            ]}
          >
            {signingOut ? (
              <ActivityIndicator color={colors.danger} />
            ) : (
              <>
                <Feather name="log-out" size={16} color={colors.danger} />
                <Text style={styles.signOutLabel}>Sign out</Text>
              </>
            )}
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  safe: {
    flex: 1,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  scroll: {
    flexGrow: 1,
  },
  title: {
    color: colors.foreground,
    fontSize: 30,
    lineHeight: 36,
    fontWeight: '700',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    marginTop: 8,
  },
  card: {
    marginTop: 24,
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: 'rgba(189, 240, 110, 0.16)',
    borderWidth: 2,
    borderColor: colors.lime,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarInitials: {
    color: colors.lime,
    fontSize: 24,
    fontWeight: '700',
  },
  name: {
    color: colors.foreground,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
  },
  email: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  signOutButton: {
    marginTop: 24,
    height: 52,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.cardBorder,
  },
  signOutLabel: {
    color: colors.danger,
    fontSize: 15,
    fontWeight: '600',
  },
  pressed: {
    opacity: 0.7,
  },
})
