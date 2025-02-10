import { useCallback, useState } from "react"

/**
 * Use a patch state to update a state object
 * @param initialState - The initial state object
 * @returns A tuple containing the state and a function to patch the state
 */
const usePatchState = <T extends {}>(initialState: T) => {
  const [state, setState] = useState<T>(initialState)

  const patchState = useCallback((newState: Partial<T>) => {
    return setState((current) => ({ ...current, ...newState }))
  }, [])

  return [state, patchState] as const
}

export { usePatchState }
