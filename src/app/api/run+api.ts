/**
 * Server-side proxy for the ChaiCode CodeBox execution API.
 * Keeps `CODEBOX_TOKEN` off the client.
 */

import { executeOnCodeBox } from '@/lib/judge'
import { runTaskAsync } from '@/lib/run-task'
import { StatusError } from 'expo-server'

type RunRequest = {
  language_id: number
  source_code: string
  stdin?: string
  expected_output?: string
}

export async function POST(request: Request) {
  let body: RunRequest
  try {
    body = (await request.json()) as RunRequest
  } catch {
    throw new StatusError(400, 'Invalid JSON body.')
  }

  if (!body?.language_id || !body?.source_code) {
    throw new StatusError(400, '`language_id` and `source_code` are required.')
  }

  try {
    const data = await runTaskAsync(() =>
      executeOnCodeBox({
        languageId: body.language_id,
        sourceCode: body.source_code,
        stdin: body.stdin ?? '',
        expectedOutput: body.expected_output ?? '',
      })
    )
    return Response.json(data)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    if (message.includes('CODEBOX_TOKEN')) {
      return Response.json({ error: message }, { status: 500 })
    }
    return Response.json(
      { error: 'Failed to reach CodeBox.', detail: message },
      { status: 502 }
    )
  }
}
