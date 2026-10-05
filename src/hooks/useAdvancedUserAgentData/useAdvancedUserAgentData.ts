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
  browser: NameAndVersion
  os: NameAndVersion
  architecture?: string
  uaResult: ReturnType<UAParser["getResult"]>
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
  const [browser, uaResultWithClientHints, os, cpu] = await Promise.all([
    ua.getBrowser().withClientHints(),
    uaResult.withClientHints(),
    ua.getOS().withClientHints(),
    ua.getCPU().withClientHints(),
  ])
  return {
    browser,
    os,
    architecture: cpu.architecture,
    uaResult: uaResultWithClientHints,
  }
}

function readFromUserAgent(
  ua: UAParser,
  uaResult: UAParts["uaResult"]
): UAParts {
  return {
    browser: ua.getBrowser(),
    os: ua.getOS(),
    architecture: ua.getCPU().architecture,
    uaResult,
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

    // Client Hints refine the result but are optional: if they reject or take
    // too long, the User-Agent string alone is used. Everything below copies
    // values into plain objects, so a Client Hints call that settles after the
    // timeout cannot alter what is cached.
    const parts =
      (await settleWithin(
        readWithClientHints(ua, uaResult),
        CLIENT_HINTS_TIMEOUT_MS
      )) ?? readFromUserAgent(ua, uaResult)

    // Brave sends a Chrome-form User-Agent (and Client Hints brands) and is
    // only identifiable through `navigator.brave`, which the feature check reads.
    const browserFeatureChecked = await ua.getBrowser().withFeatureCheck()
    const isBrave = browserFeatureChecked.name === "Brave"

    const browser = {
      name: isBrave ? "Brave" : (parts.browser.name ?? DEFAULT_VALUE),
      version: parts.browser.version ?? DEFAULT_VALUE,
    }
    const engine = {
      name: uaResult.engine.name ?? DEFAULT_VALUE,
      version: uaResult.engine.version ?? DEFAULT_VALUE,
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
