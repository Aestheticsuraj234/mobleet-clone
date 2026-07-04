import { runTask } from 'expo-server'

/**
 * Schedule work with expo-server `runTask` (keeps the request alive on
 * serverless runtimes) while still awaiting the result for the response body.
 */
export function runTaskAsync<T>(fn: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const settle = async () => {
      try {
        resolve(await fn())
      } catch (error) {
        reject(error)
      }
    }

    try {
      runTask(settle)
    } catch {
      // Fallback when not inside a request context (e.g. tests).
      void settle()
    }
  })
}
