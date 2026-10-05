import { useState } from "react"
import { UAParser } from "ua-parser-js"
import { isAppleSilicon } from "ua-parser-js/device-detection"
import { AdvancedNavigatorUAData } from "./useAdvancedUserAgentData.type"
import { useAsyncEffect } from "../useAsyncEffect"
const DEFAULT_VALUE = "Unknown"

// Upper bound for the Client Hints round trip. `getHighEntropyValues` can
// reject (permissions policy, blocked by the browser) or never settle, and the
// hook must still leave `isLoading` in a bounded time.
const CLIENT_HINTS_TIMEOUT_MS = 1500

// Module-level cache: the user agent never changes during a session, so once
// resolved the result is reused across component remounts (React StrictMode,
// Suspense boundaries, lazy chunks, etc.).  Without this cache every remount
// re-runs the async Client Hints call, resetting state to undefined in between
// and causing a visible flash in any UI that depends on the detected OS.
let _cachedData: AdvancedNavigatorUAData | undefined
let _cacheResolved = false

type NameAndVersion = { name?: string; version?: string }

type UAParts = {
  os: NameAndVersion
  architecture?: string
  uaResult: ReturnType<UAParser["getResult"]>
  // Browser name reported by Client Hints, only used to spot the Brave brand.
  hintsBrowserName?: string
}

/**
 * Resolves with the value of `promise`, or `undefined` if it rejects or does
 * not settle within `ms`. The timer is always cleared.
 */
async function settleWithin<T>(
  promise: Promise<T>,
  ms: number
): Promise<T | undefined> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<undefined>((resolve) => {
    timer = setTimeout(() => resolve(undefined), ms)
  })
  try {
    return await Promise.race([promise, timeout])
  } catch {
    return undefined
  } finally {
    clearTimeout(timer)
  }
}

async function readWithClientHints(
  ua: UAParser,
  uaResult: UAParts["uaResult"]
): Promise<UAParts> {
  const [uaResultWithClientHints, os, cpu] = await Promise.all([
    uaResult.withClientHints(),
    ua.getOS().withClientHints(),
    ua.getCPU().withClientHints(),
  ])
  return {
    os,
    architecture: cpu.architecture,
    uaResult: uaResultWithClientHints,
    hintsBrowserName: uaResultWithClientHints.browser.name,
  }
}

// A fresh result: `uaResult` may still be updated by Client Hints that settle later.
function readFromUserAgent(ua: UAParser): UAParts {
  return {
    os: ua.getOS(),
    architecture: ua.getCPU().architecture,
    uaResult: ua.getResult(),
  }
}

/** @internal Reset module-level cache — only for testing. */
function resetUserAgentCache(): void {
  _cachedData = undefined
  _cacheResolved = false
}

/**
 * extract or infer the [UserAgentData](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgentData)
 * that is an object which can be used to access the User-Agent Client Hints API.
 */
function useAdvancedUserAgentData(): [
  boolean,
  AdvancedNavigatorUAData | undefined,
] {
  const [isLoading, setLoading] = useState(!_cacheResolved)
  const [data, setData] = useState<AdvancedNavigatorUAData | undefined>(
    _cachedData
  )

  useAsyncEffect(async () => {
    // useState initializers already picked up the cached values,
    // so no setter calls needed — just skip the async work.
    if (_cacheResolved) {
      return
    }

    setLoading(true)
    const ua = new UAParser(navigator.userAgent)
    const uaResult = ua.getResult()

    // Browser and engine come from the user-agent string. They are copied before
    // the Client Hints call because `uaResult.withClientHints()` updates `uaResult`
    // in place (and keeps doing so if the hints settle after the timeout).
    const engine = {
      name: uaResult.engine.name ?? DEFAULT_VALUE,
      version: uaResult.engine.version ?? DEFAULT_VALUE,
    }
    const browser = {
      name: uaResult.browser.name ?? DEFAULT_VALUE,
      version: uaResult.browser.version ?? DEFAULT_VALUE,
    }

    // OS and CPU also use Client Hints, which are optional: if they reject or take
    // too long, the user-agent string alone is used.
    const parts =
      (await settleWithin(
        readWithClientHints(ua, uaResult),
        CLIENT_HINTS_TIMEOUT_MS
      )) ?? readFromUserAgent(ua)

    // Brave sends a Chrome-form user agent. It is told apart by its Client Hints
    // brand or, when the hints are missing, late or rejected, by `navigator.brave`
    // (synchronous in ua-parser-js 2.x although typed as possibly async).
    const featureChecked = ua.getBrowser().withFeatureCheck() as ReturnType<
      UAParser["getBrowser"]
    >
    if (parts.hintsBrowserName === "Brave" || featureChecked.name === "Brave") {
      browser.name = "Brave"
    }

    const os = {
      name: parts.os.name ?? DEFAULT_VALUE,
      version: parts.os.version ?? DEFAULT_VALUE,
    }

    let architecture: string
    if (!parts.architecture) {
      architecture =
        os.name === "macOS" && isAppleSilicon(parts.uaResult)
          ? "arm64"
          : "Unknown"
    } else {
      architecture = parts.architecture
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

export { resetUserAgentCache, useAdvancedUserAgentData }
