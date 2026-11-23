import { useState } from "react"
import {
  getCachedUserAgentData,
  readUserAgentDataSync,
  resetUserAgentCache,
  resolveAdvancedUserAgentData,
} from "./advancedUserAgentData"
import { useAsyncEffect } from "../useAsyncEffect"
import type { AdvancedNavigatorUAData } from "./useAdvancedUserAgentData.type"

/**
 * extract or infer the [UserAgentData](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgentData)
 * that is an object which can be used to access the User-Agent Client Hints API.
 *
 * `data` is a user-agent-string guess from the first render and is refined with
 * Client Hints once `isLoading` turns false.
 */
function useAdvancedUserAgentData(): [
  boolean,
  AdvancedNavigatorUAData | undefined,
] {
  const [isLoading, setLoading] = useState(!getCachedUserAgentData())
  const [data, setData] = useState<AdvancedNavigatorUAData | undefined>(
    () => getCachedUserAgentData() ?? readUserAgentDataSync()
  )

  useAsyncEffect(async () => {
    // useState initializers already picked up the cached values,
    // so no setter calls needed — just skip the async work.
    if (getCachedUserAgentData()) {
      return
    }

    setLoading(true)
    const result = await resolveAdvancedUserAgentData()
    setData(result)
    setLoading(false)
  }, [])

  return [isLoading, getCachedUserAgentData() ?? data]
}

export { resetUserAgentCache, useAdvancedUserAgentData }
