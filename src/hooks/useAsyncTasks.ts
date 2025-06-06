/* eslint-disable @typescript-eslint/no-explicit-any */
import { DependencyList, useCallback, useMemo, useState } from "react"
import { sentry } from "../utils/development/sentry"

type AsyncTaskIdentity = (id: string, ...extra: any[]) => Promise<any>

/**
 * Use async tasks to execute async functions and return a list of task ids and a function to add a task
 * @param callback - The async function to execute
 * @param deps - The dependencies of the async function
 * @returns A tuple containing the list of task ids and a function to add a task
 */
const useAsyncTasks = <C extends AsyncTaskIdentity = AsyncTaskIdentity>(
  callback: C,
  deps: DependencyList
): readonly [string[], C] => {
  const [tasks, setTasks] = useState<[string, Promise<any> | null][]>([])
  const tasksIds = useMemo(() => tasks.map(([id]) => id), [tasks])

  const addTask = useCallback(
    (id: string, ...extra: any[]) => {
      if (tasks.find(([currentId]) => currentId === id)) {
        return
      }

      const task = Promise.resolve()
        .then(() => callback(id, ...extra))
        .then(() => {
          setTasks((current) =>
            current.filter(([currentId]) => currentId !== id)
          )
        })
        .catch((err) => {
          console.error(err)
          sentry((sentry) => sentry.captureException(err))
          setTasks((current) =>
            current.filter(([currentId]) => currentId !== id)
          )
        })

      setTasks((current) => [...current, [id, task]])
    },
    [tasks, ...deps]
  )

  return [tasksIds, addTask as C] as const
}

export type { AsyncTaskIdentity }
export { useAsyncTasks }
