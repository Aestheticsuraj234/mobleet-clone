import Constants from 'expo-constants'

import type { CaseResult } from '@/lib/judge'
import type { LanguageId } from '@/lib/problems'
import { supabase } from '@/lib/supabase'

export type { CaseResult } from '@/lib/judge'

export type SubmitResponse = {
  submissionId: string
  status: string
  solved: boolean
  passed: number
  total: number
  results: CaseResult[]
}

/** Resolves the URL of our local Expo dev server / API route handler. */
export function resolveApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_BASE_URL) {
    return process.env.EXPO_PUBLIC_API_BASE_URL
  }

  const hostUri =
    Constants.expoConfig?.hostUri ??
    (Constants as { manifest?: { hostUri?: string } }).manifest?.hostUri

  if (hostUri) {
    const host = hostUri.split('/')[0]
    return `http://${host}`
  }

  return 'http://localhost:8081'
}

export async function submitSolution(params: {
  problemId: string
  language: LanguageId
  sourceCode: string
}): Promise<SubmitResponse> {
  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (!session?.access_token) {
    throw new Error('You must be signed in to submit a solution.')
  }

  const baseUrl = resolveApiBaseUrl()
  const response = await fetch(`${baseUrl}/api/submit`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      problemId: params.problemId,
      language: params.language,
      sourceCode: params.sourceCode,
    }),
  })

  const text = await response.text()
  let payload: SubmitResponse | { error?: string; detail?: string; message?: string } =
    {}
  try {
    payload = text ? (JSON.parse(text) as typeof payload) : {}
  } catch {
    if (!response.ok) {
      throw new Error(text || `Submit failed (HTTP ${response.status})`)
    }
    throw new Error('Invalid response from submit API.')
  }

  if (!response.ok) {
    const message =
      ('error' in payload && payload.error) ||
      ('message' in payload && payload.message) ||
      ('detail' in payload && payload.detail) ||
      text ||
      `Submit failed (HTTP ${response.status})`
    throw new Error(message)
  }

  return payload as SubmitResponse
}
