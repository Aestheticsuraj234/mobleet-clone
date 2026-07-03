import { signInWithOAuth } from '@/lib/auth'
import { useEffect, useState } from 'react'
import { ActivityIndicator, Button, View } from 'react-native'

import * as WebBrowser from 'expo-web-browser'

export default function SignInScreen() {
    const [loading, setLoading] = useState<null | 'github' | 'google'>(null)

    useEffect(() => {
        void WebBrowser.warmUpAsync()
        return () => {
            void WebBrowser.coolDownAsync()
        }
    }, [])

    async function handleSignIn(provider: 'github' | 'google') {
        try {
            setLoading(provider)
            await signInWithOAuth(provider)
        } finally {
            setLoading(null)
        }
    }

    return (
        <View style={{ flex: 1, justifyContent: 'center', gap: 12, padding: 24 }}>
                <Button
                    title="Continue with GitHub"
                    onPress={() => handleSignIn('github')}
                    disabled={!!loading}
            />
            <Button
                title="Continue with Google"
                onPress={() => handleSignIn('google')}
                disabled={!!loading}
            />
            {loading && <ActivityIndicator />}
        </View>
    )
}