import type { LanguageId } from '@/lib/problems'

/** Mapping from our language ids to CodeBox `language_id` values. */
export const LANGUAGE_ID_MAP: Record<LanguageId, number> = {
  javascript: 63,
  python: 71,
  java: 62,
}

export type RunOutcome = 'accepted' | 'wrong-answer' | 'error'

export type CaseResult = {
  index: number
  input: string
  expectedOutput: string
  actualOutput: string
  stderr: string
  status: { id: number; description: string }
  outcome: RunOutcome
  timeSec: number | null
  memoryKb: number | null
}

export type ProblemTestCase = {
  input: string
  output: string
}

type CodeBoxResponse = {
  stdout: string | null
  stderr: string | null
  status: { id: number; description: string }
  time: string | null
  memory: number | null
}

const CODEBOX_BASE_URL = 'https://chaicode.net'

/** Normalise output so trailing whitespace / newlines don't fail comparisons. */
export function normalise(value: string | null | undefined): string {
  if (!value) return ''
  return value.replace(/\r\n/g, '\n').trim()
}

export function parseTestCases(raw: unknown): ProblemTestCase[] {
  if (!Array.isArray(raw)) return []
  return raw.filter(
    (item): item is ProblemTestCase =>
      !!item &&
      typeof item === 'object' &&
      typeof (item as ProblemTestCase).input === 'string' &&
      typeof (item as ProblemTestCase).output === 'string'
  )
}

export async function executeOnCodeBox(params: {
  languageId: number
  sourceCode: string
  stdin: string
  expectedOutput: string
}): Promise<CodeBoxResponse> {
  const token = 'cbx_76ce298b27744a0592a115f2dd1b94f3'
  if (!token) {
    throw new Error('CODEBOX_TOKEN is not configured on the server.')
  }

  const upstream = await fetch(`${CODEBOX_BASE_URL}/api/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': token,
    },
    body: JSON.stringify({
      language_id: params.languageId,
      source_code: params.sourceCode,
      stdin: params.stdin,
      expected_output: params.expectedOutput,
      cpu_time_limit: 5,
      memory_limit: 256000,
    }),
  })

  const text = await upstream.text()
  if (!upstream.ok) {
    throw new Error(`CodeBox responded with ${upstream.status}: ${text}`)
  }

  return JSON.parse(text) as CodeBoxResponse
}

export function toCaseResult(
  index: number,
  testCase: ProblemTestCase,
  data: CodeBoxResponse
): CaseResult {
  const actualOutput = normalise(data.stdout)
  const expectedOutput = normalise(testCase.output)

  let outcome: RunOutcome
  if (data.status.id === 3 && actualOutput === expectedOutput) {
    outcome = 'accepted'
  } else if (data.status.id === 3 || data.status.id === 4) {
    outcome = actualOutput === expectedOutput ? 'accepted' : 'wrong-answer'
  } else {
    outcome = 'error'
  }

  return {
    index,
    input: testCase.input,
    expectedOutput,
    actualOutput,
    stderr: normalise(data.stderr),
    status: data.status,
    outcome,
    timeSec: data.time ? Number(data.time) : null,
    memoryKb: data.memory ?? null,
  }
}

export function errorCaseResult(
  index: number,
  testCase: ProblemTestCase,
  message: string
): CaseResult {
  return {
    index,
    input: testCase.input,
    expectedOutput: normalise(testCase.output),
    actualOutput: '',
    stderr: message,
    status: { id: -1, description: 'Network Error' },
    outcome: 'error',
    timeSec: null,
    memoryKb: null,
  }
}

export async function runAllTestCases(params: {
  language: LanguageId
  sourceCode: string
  testCases: ProblemTestCase[]
}): Promise<CaseResult[]> {
  const languageId = LANGUAGE_ID_MAP[params.language]

  return Promise.all(
    params.testCases.map(async (testCase, index) => {
      try {
        const data = await executeOnCodeBox({
          languageId,
          sourceCode: params.sourceCode,
          stdin: testCase.input,
          expectedOutput: testCase.output,
        })
        return toCaseResult(index, testCase, data)
      } catch (err) {
        return errorCaseResult(
          index,
          testCase,
          err instanceof Error ? err.message : String(err)
        )
      }
    })
  )
}

export function outcomeStatusLabel(outcome: RunOutcome) {
  switch (outcome) {
    case 'accepted':
      return 'Accepted'
    case 'wrong-answer':
      return 'Wrong Answer'
    case 'error':
      return 'Error'
  }
}
