import { useCallback, useMemo, useState } from "react"

type DCLShareData = ShareData & {
  thumbnail?: string
}

const checkShareSupport = () =>
  typeof navigator !== "undefined" && !!navigator.share

type ShareState = {
  isSharing: boolean
  error: Error | null
}

const useShare = () => {
  const [state, setState] = useState<ShareState>({
    isSharing: false,
    error: null,
  })

  const share = useCallback(async (shareData: DCLShareData) => {
    if (!checkShareSupport()) {
      return
    }

    try {
      setState((prev) => ({ ...prev, isSharing: true, error: null }))
      await navigator.share(shareData)
      setState((prev) => ({ ...prev, isSharing: false }))
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isSharing: false,
        error:
          error instanceof Error ? error : new Error("Error sharing content"),
      }))
    }
  }, [])

  const close = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }))
  }, [])

  const shareState = useMemo(
    () => ({
      ...state,
      isSupported: checkShareSupport(),
      close,
    }),
    [state, close]
  )

  return [share, shareState] as const
}

export { useShare, checkShareSupport as isShareSupported }
export type { DCLShareData, ShareState }
