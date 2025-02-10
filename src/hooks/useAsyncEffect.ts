import { DependencyList, useEffect } from "react"
import { sentry } from "../utils/development/sentry"

/**
 * Execute an async function and return a loading state and a function to call the async function
 * @param callback - The async function to execute
 * @param dependencies - The dependencies of the async function
 * @returns A tuple containing the loading state and a function to call the async function
 */
const useAsyncEffect = (
  callback: () => Promise<void | (() => void)>,
  dependencies?: DependencyList
) => {
  return useEffect(() => {
    const promise = callback().catch((err) => {
      console.error(`AsyncEffect error: `, err)
      sentry((sentry) =>
        sentry.captureException("AsyncEffect error: " + err.message, {
          extra: err,
        })
      )
    })

    return function () {
      promise.then((unsubscribe) => {
        if (typeof unsubscribe === "function") {
          unsubscribe()
        }
      })
    }
  }, dependencies)
}

export { useAsyncEffect }
