import { colors } from '@/lib/theme'
import { supabase } from '@/lib/supabase'

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD'

export type LanguageId = 'javascript' | 'python' | 'java'

export type LanguageExample = {
  input: string
  output: string
  explanation?: string
}

export type ProblemListItem = {
  id: string
  title: string
  difficulty: Difficulty
  tags: string[]
  created_at: string
}

export type Problem = ProblemListItem & {
  description: string
  constraints: string
  hints: string | null
  editorial: string | null
  examples: Record<string, LanguageExample>
  code_snippets: Record<string, string>
  updated_at: string
}

const LIST_COLUMNS =
  'id, title, difficulty, tags, created_at' as const

const DETAIL_COLUMNS =
  'id, title, description, difficulty, tags, examples, constraints, hints, editorial, code_snippets, created_at, updated_at' as const

export function difficultyLabel(difficulty: Difficulty) {
  switch (difficulty) {
    case 'EASY':
      return 'Easy'
    case 'MEDIUM':
      return 'Medium'
    case 'HARD':
      return 'Hard'
  }
}

export function difficultyTint(difficulty: Difficulty) {
  switch (difficulty) {
    case 'EASY':
      return { fg: colors.success, bg: colors.successBg }
    case 'MEDIUM':
      return { fg: colors.warning, bg: colors.warningBg }
    case 'HARD':
      return { fg: colors.danger, bg: colors.dangerBg }
  }
}

export const LANGUAGE_LABEL: Record<LanguageId, string> = {
  javascript: 'JavaScript',
  python: 'Python',
  java: 'Java',
}

export const LANGUAGE_TINT: Record<LanguageId, string> = {
  javascript: '#f7df1e',
  python: '#3776ab',
  java: '#f89820',
}

export const LANGUAGE_BADGE: Record<LanguageId, string> = {
  javascript: 'JS',
  python: 'PY',
  java: 'JV',
}

export const LANGUAGE_ORDER: LanguageId[] = ['javascript', 'python', 'java']

const LANGUAGE_KEYS: Record<LanguageId, string> = {
  javascript: 'JAVASCRIPT',
  python: 'PYTHON',
  java: 'JAVA',
}

export function getAvailableLanguages(problem: Problem): LanguageId[] {
  return LANGUAGE_ORDER.filter((lang) => {
    const key = LANGUAGE_KEYS[lang]
    return typeof problem.code_snippets?.[key] === 'string'
  })
}

export function getStarterCode(problem: Problem, language: LanguageId) {
  return problem.code_snippets?.[LANGUAGE_KEYS[language]] ?? ''
}

export function getExamples(problem: Problem): LanguageExample[] {
  const examples = problem.examples
  if (!examples || typeof examples !== 'object') return []
  if (Array.isArray(examples)) return examples as LanguageExample[]
  return Object.values(examples).filter(
    (item): item is LanguageExample =>
      !!item && typeof item === 'object' && 'input' in item && 'output' in item
  )
}

export function getConstraintLines(constraints: string) {
  return constraints
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
}

export async function fetchProblems() {
  const { data, error } = await supabase
    .from('problems')
    .select(LIST_COLUMNS)
    .order('created_at', { ascending: true })

  if (error) throw error
  return (data ?? []) as ProblemListItem[]
}

export async function fetchProblemById(id: string) {
  const { data, error } = await supabase
    .from('problems')
    .select(DETAIL_COLUMNS)
    .eq('id', id)
    .maybeSingle()

  if (error) throw error
  return data as Problem | null
}

export async function fetchSolvedCount(userId: string) {
  const { count, error } = await supabase
    .from('problem_solved')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) throw error
  return count ?? 0
}
