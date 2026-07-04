import { executeOnCodeBox } from '@/lib/judge'
import { runTaskAsync } from '@/lib/run-task'
import { StatusError } from 'expo-server'

export async function POST(request: Request) {
  const body = await request.json()
  if (!body?.language_id || !body?.source_code) {
    throw new StatusError(400, '`language_id` and `source_code` are required.')
  }

  const data = await runTaskAsync(() =>
    executeOnCodeBox({
      languageId: body.language_id,
      sourceCode: body.source_code,
      stdin: body.stdin ?? '',
      expectedOutput: body.expected_output ?? '',
    })
  )

  return Response.json(data)
}
