/* eslint-disable @typescript-eslint/no-explicit-any */
import { DependencyList, useCallback, useEffect, useState } from "react"
import { AsyncTaskState } from "./useAsyncTask.type"
import { sentry } from "../../utils/development/sentry"

/**
 * Execute an async function and return a loading state and a function to call the async function
 * @param callback - The async function to execute
 * @param deps - The dependencies of the async function
 * @returns A tuple containing the loading state and a function to call the async function
 */
const useAsyncTask = <A extends any[] = []>(
  callback: (...args: A) => Promise<any>,
  deps: DependencyList
) => {
  const [{ loading, args }, setLoading] = useState<AsyncTaskState<A>>({
    loading: false,
    args: null,
  })

  useEffect(() => {
    if (!loading) {
      return
    }

    if (args === null) {
      return
    }

    let cancelled = false
    Promise.resolve()
      .then(() => callback(...args))
      .then(() => {
        if (cancelled) {
          return
        }

        setLoading({ loading: false, args: null })
      })
      .catch((err) => {
        console.error(err)
        sentry((sentry) => sentry.captureException(err))
        if (cancelled) {
          return
        }

        setLoading({ loading: false, args: null })
      })

    return () => {
      cancelled = true
    }
  }, [loading])

  const callTask = useCallback(
    (...args: A) => {
      setLoading({ loading: true, args })
    },
    [loading, args, ...deps]
  )

  return [loading, callTask] as const
}

export { useAsyncTask }
