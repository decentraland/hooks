import { useState } from "react"
import { UAParser } from "ua-parser-js"
import { isAppleSilicon } from "ua-parser-js/device-detection"
import { AdvancedNavigatorUAData } from "./useAdvancedUserAgentData.type"
import { useAsyncEffect } from "../useAsyncEffect"
const DEFAULT_VALUE = "Unknown"

// Module-level cache: the user agent never changes during a session, so once
// resolved the result is reused across component remounts (React StrictMode,
// Suspense boundaries, lazy chunks, etc.).  Without this cache every remount
// re-runs the async Client Hints call, resetting state to undefined in between
// and causing a visible flash in any UI that depends on the detected OS.
let _cachedData: AdvancedNavigatorUAData | undefined
let _cacheResolved = false

/**
 * extract or infer the [UserAgentData](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgentData)
 * that is an object which can be used to access the User-Agent Client Hints API.
 */
export function useAdvancedUserAgentData(): [
  boolean,
  AdvancedNavigatorUAData | undefined,
] {
  const [isLoading, setLoading] = useState(!_cacheResolved)
  const [data, setData] = useState<AdvancedNavigatorUAData>(_cachedData)

  useAsyncEffect(async () => {
    if (_cacheResolved && _cachedData) {
      setData(_cachedData)
      setLoading(false)
      return
    }

    setLoading(true)
    const ua = new UAParser(navigator.userAgent)
    const uaData = ua.getResult()

    const browser = {
      name: uaData.browser.name ?? DEFAULT_VALUE,
      version: uaData.browser.version ?? DEFAULT_VALUE,
    }
    const engine = {
      name: uaData.engine.name ?? DEFAULT_VALUE,
      version: uaData.engine.version ?? DEFAULT_VALUE,
    }
    const [uaDataWithClientHints, osData, cpuData] = await Promise.all([
      uaData.withClientHints(),
      ua.getOS().withClientHints(),
      ua.getCPU().withClientHints(),
    ])

    const os = {
      name: osData.name ?? DEFAULT_VALUE,
      version: osData.version ?? DEFAULT_VALUE,
    }

    let architecture: string
    if (!cpuData.architecture) {
      architecture =
        os.name === "macOS" && isAppleSilicon(uaDataWithClientHints)
          ? "arm64"
          : "Unknown"
    } else {
      architecture = cpuData.architecture
    }

    const result: AdvancedNavigatorUAData = {
      browser,
      engine,
      os,
      cpu: {
        architecture,
      },
      mobile: ua.getDevice().is("mobile"),
      tablet: ua.getDevice().is("tablet"),
    }

    _cachedData = result
    _cacheResolved = true

    setData(result)
    setLoading(false)
  }, [])

  return [isLoading, _cachedData ?? data]
}
