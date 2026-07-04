/**
 * Judge a full submission:
 * 1. Authenticate the user
 * 2. Load hidden test cases (service role)
 * 3. Run all cases via CodeBox (expo-server runTask)
 * 4. Persist submission + per-case results
 * 5. Mark problem_solved when every case is accepted
 */

import {
  outcomeStatusLabel,
  parseTestCases,
  runAllTestCases,
  type CaseResult,
  type RunOutcome,
} from '@/lib/judge'
import type { LanguageId } from '@/lib/problems'
import { runTaskAsync } from '@/lib/run-task'
import { getSupabaseAdmin, getUserFromRequest } from '@/lib/supabase-admin'
import { StatusError } from 'expo-server'

type SubmitBody = {
  problemId: string
  language: LanguageId
  sourceCode: string
}

const SUPPORTED_LANGUAGES: LanguageId[] = ['javascript', 'python', 'java']

function overallStatus(results: CaseResult[]): RunOutcome {
  if (results.every((r) => r.outcome === 'accepted')) return 'accepted'
  if (results.some((r) => r.outcome === 'error')) return 'error'
  return 'wrong-answer'
}

function formatTime(results: CaseResult[]) {
  const times = results
    .map((r) => r.timeSec)
    .filter((t): t is number => typeof t === 'number')
  if (times.length === 0) return null
  const max = Math.max(...times)
  return `${max.toFixed(3)} s`
}

function formatMemory(results: CaseResult[]) {
  const memories = results
    .map((r) => r.memoryKb)
    .filter((m): m is number => typeof m === 'number')
  if (memories.length === 0) return null
  const max = Math.max(...memories)
  return `${max} KB`
}

export async function POST(request: Request) {
  const user = await getUserFromRequest(request)
  if (!user) {
    throw new StatusError(401, 'Unauthorized')
  }

  let body: SubmitBody
  try {
    body = (await request.json()) as SubmitBody
  } catch {
    throw new StatusError(400, 'Invalid JSON body.')
  }

  const problemId = body.problemId?.trim()
  const language = body.language
  const sourceCode = body.sourceCode

  if (!problemId || !sourceCode?.trim()) {
    throw new StatusError(400, '`problemId` and `sourceCode` are required.')
  }

  if (!SUPPORTED_LANGUAGES.includes(language)) {
    throw new StatusError(400, `Unsupported language: ${language}`)
  }

  const admin = getSupabaseAdmin()

  const { data: problem, error: problemError } = await admin
    .from('problems')
    .select('id, title, test_cases')
    .eq('id', problemId)
    .maybeSingle()

  if (problemError) {
    return Response.json({ error: problemError.message }, { status: 500 })
  }
  if (!problem) {
    throw new StatusError(404, 'Problem not found.')
  }

  const testCases = parseTestCases(problem.test_cases)
  if (testCases.length === 0) {
    throw new StatusError(400, 'Problem has no test cases configured.')
  }

  // Long-running judge work — keep the serverless request alive via runTask.
  const results = await runTaskAsync(() =>
    runAllTestCases({
      language,
      sourceCode,
      testCases,
    })
  )

  const status = overallStatus(results)
  const statusLabel = outcomeStatusLabel(status)
  const allPassed = status === 'accepted'

  const { data: submission, error: submissionError } = await admin
    .from('submissions')
    .insert({
      user_id: user.id,
      problem_id: problemId,
      source_code: { [language]: sourceCode },
      language,
      stdin: testCases.map((tc) => tc.input).join('\n---\n'),
      stdout: results.map((r) => r.actualOutput).join('\n---\n'),
      stderr: results
        .map((r) => r.stderr)
        .filter(Boolean)
        .join('\n---\n'),
      status: statusLabel,
      memory: formatMemory(results),
      time: formatTime(results),
    })
    .select('id')
    .single()

  if (submissionError || !submission) {
    return Response.json(
      { error: submissionError?.message ?? 'Failed to save submission.' },
      { status: 500 }
    )
  }

  const testCaseRows = results.map((result) => ({
    submission_id: submission.id,
    test_case: result.index + 1,
    passed: result.outcome === 'accepted',
    stdout: result.actualOutput,
    expected: result.expectedOutput,
    stderr: result.stderr || null,
    status: outcomeStatusLabel(result.outcome),
    memory: result.memoryKb != null ? `${result.memoryKb} KB` : null,
    time: result.timeSec != null ? `${result.timeSec.toFixed(3)} s` : null,
  }))

  const { error: resultsError } = await admin
    .from('test_case_results')
    .insert(testCaseRows)

  if (resultsError) {
    return Response.json({ error: resultsError.message }, { status: 500 })
  }

  let solved = false
  if (allPassed) {
    const { error: solvedError } = await admin.from('problem_solved').upsert(
      {
        user_id: user.id,
        problem_id: problemId,
      },
      { onConflict: 'user_id,problem_id', ignoreDuplicates: true }
    )

    if (solvedError) {
      return Response.json({ error: solvedError.message }, { status: 500 })
    }
    solved = true
  }

  return Response.json({
    submissionId: submission.id,
    status: statusLabel,
    solved,
    passed: results.filter((r) => r.outcome === 'accepted').length,
    total: results.length,
    results,
  })
}
