import { useCallback, useMemo, useState } from "react"

type DCLShareData = ShareData & {
  thumbnail?: string
}

type ShareState = {
  data: DCLShareData | null
  isSupported: boolean
  isSharing: boolean
  error: Error | null
}

const useShare = () => {
  const [state, setState] = useState<ShareState>({
    data: null,
    isSupported: typeof navigator !== "undefined" && !!navigator.share,
    isSharing: false,
    error: null,
  })

  const share = useCallback(
    async (shareData: DCLShareData) => {
      if (!state.isSupported) {
        setState((prev) => ({ ...prev, data: shareData }))
        return
      }

      try {
        setState((prev) => ({ ...prev, isSharing: true, error: null }))
        await navigator.share(shareData)
        setState((prev) => ({ ...prev, isSharing: false, data: null }))
      } catch (error) {
        setState((prev) => ({
          ...prev,
          isSharing: false,
          error:
            error instanceof Error ? error : new Error("Error al compartir"),
          data: shareData,
        }))
      }
    },
    [state.isSupported]
  )

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, data: null, error: null }))
  }, [])

  const shareState = useMemo(
    () => ({
      ...state,
      close,
    }),
    [state, close]
  )

  return [share, shareState] as const
}

export { useShare }
export type { DCLShareData, ShareState }
