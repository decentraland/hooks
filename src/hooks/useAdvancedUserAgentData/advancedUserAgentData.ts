// The user agent data without React: this module imports nothing but ua-parser-js, so code outside a component
// (a click handler, an analytics call) can read it without pulling the hooks' Sentry reporting into its bundle.
import { UAParser } from "ua-parser-js"
import { isAppleSilicon } from "ua-parser-js/device-detection"
import type { AdvancedNavigatorUAData } from "./useAdvancedUserAgentData.type"
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
// The read in flight, shared by every caller that asks before it settles.
let _pending: Promise<AdvancedNavigatorUAData> | undefined

// The first-render guess, parsed once (each mount gets a copy, see `copyUserAgentData`): the user agent does not change, and until
// the cache resolves every mount would otherwise parse it again during render.
let _seedData: AdvancedNavigatorUAData | undefined

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

type BrowserAndEngine = Pick<AdvancedNavigatorUAData, "browser" | "engine">

// Browser and engine come from the user-agent string. They are copied out because
// `uaResult.withClientHints()` updates `uaResult` in place (and keeps doing so if
// the hints settle after the timeout).
function readBrowserAndEngine(uaResult: UAParts["uaResult"]): BrowserAndEngine {
  return {
    browser: {
      name: uaResult.browser.name ?? DEFAULT_VALUE,
      version: uaResult.browser.version ?? DEFAULT_VALUE,
    },
    engine: {
      name: uaResult.engine.name ?? DEFAULT_VALUE,
      version: uaResult.engine.version ?? DEFAULT_VALUE,
    },
  }
}

function toUserAgentData(
  ua: UAParser,
  parts: UAParts,
  { browser, engine }: BrowserAndEngine,
  detectAppleSilicon: boolean
): AdvancedNavigatorUAData {
  // Brave sends a Chrome-form user agent. It is told apart by its Client Hints
  // brand or, when the hints are missing, late or rejected, by `navigator.brave`
  // (synchronous in ua-parser-js 2.x although typed as possibly async).
  const featureChecked = ua.getBrowser().withFeatureCheck() as ReturnType<
    UAParser["getBrowser"]
  >
  const browserName =
    parts.hintsBrowserName === "Brave" || featureChecked.name === "Brave"
      ? "Brave"
      : browser.name

  const os = {
    name: parts.os.name ?? DEFAULT_VALUE,
    version: parts.os.version ?? DEFAULT_VALUE,
  }

  let architecture: string
  if (parts.architecture) {
    architecture = parts.architecture
  } else {
    architecture =
      detectAppleSilicon &&
      os.name === "macOS" &&
      isAppleSilicon(parts.uaResult)
        ? "arm64"
        : "Unknown"
  }

  return {
    browser: { ...browser, name: browserName },
    engine,
    os,
    cpu: {
      architecture,
    },
    mobile: ua.getDevice().is("mobile"),
    tablet: ua.getDevice().is("tablet"),
  }
}

// Consumers may write into the object they get (ui2 sets the OS and architecture
// from a `?os=` param), so every mount receives its own copy of the parsed guess.
function copyUserAgentData(
  data: AdvancedNavigatorUAData
): AdvancedNavigatorUAData {
  return {
    browser: { ...data.browser },
    engine: { ...data.engine },
    os: { ...data.os },
    cpu: { ...data.cpu },
    mobile: data.mobile,
    tablet: data.tablet,
  }
}

/**
 * First guess from the user-agent string alone, available on the very first
 * render so a consumer never has to render an "unknown OS" state while the
 * Client Hints round trip is pending. The architecture is always `Unknown`:
 * the reduced user agent reports Intel/x64 on Apple Silicon Safari, Windows on
 * ARM, ARM Linux and ARM ChromeOS alike, and the Apple Silicon probe is skipped
 * because it creates a WebGL context, too costly for a render.
 *
 * Returns `undefined` on the server. Node 21+ defines a global `navigator`
 * whose user agent is `Node.js/<version>`, so `window` is checked too.
 */
function readUserAgentDataSync(): AdvancedNavigatorUAData | undefined {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return undefined
  }
  if (_seedData) return copyUserAgentData(_seedData)

  const ua = new UAParser(navigator.userAgent)
  const data = toUserAgentData(
    ua,
    readFromUserAgent(ua),
    readBrowserAndEngine(ua.getResult()),
    false
  )
  // The user agent's architecture is distrusted on purpose, even when it parses to
  // one (`amd64` on ARM Linux, Windows on ARM and Apple Silicon Safari): the real
  // value only comes from the Client Hints, in the async path.
  _seedData = { ...data, cpu: { architecture: DEFAULT_VALUE } }
  return copyUserAgentData(_seedData)
}

/** @internal Reset module-level cache — only for testing. */
function resetUserAgentCache(): void {
  _cachedData = undefined
  _cacheResolved = false
  _pending = undefined
  _seedData = undefined
}

/** The resolved data, shared with every mount of the hook; `undefined` until a read has settled. */
function getCachedUserAgentData(): AdvancedNavigatorUAData | undefined {
  return _cacheResolved ? _cachedData : undefined
}

/** Reads once per page and caches the result; concurrent callers share one read. */
function resolveAdvancedUserAgentData(): Promise<AdvancedNavigatorUAData> {
  if (_cacheResolved && _cachedData) return Promise.resolve(_cachedData)
  _pending ??= (async () => {
    const ua = new UAParser(navigator.userAgent)
    const uaResult = ua.getResult()
    const browserAndEngine = readBrowserAndEngine(uaResult)

    // OS and CPU also use Client Hints, which are optional: if they reject or take
    // too long, the user-agent string alone is used.
    const parts =
      (await settleWithin(
        readWithClientHints(ua, uaResult),
        CLIENT_HINTS_TIMEOUT_MS
      )) ?? readFromUserAgent(ua)

    const result = toUserAgentData(ua, parts, browserAndEngine, true)
    _cachedData = result
    _cacheResolved = true
    return result
  })().finally(() => {
    _pending = undefined
  })
  return _pending
}

/**
 * The same data `useAdvancedUserAgentData` resolves (Client Hints included, bounded to 1.5 seconds), for code
 * outside React. It shares the hook's cache, so a page reads the Client Hints once whichever asks first. Each
 * call gets its own copy. Resolves `undefined` on the server (no `window`).
 */
async function getAdvancedUserAgentData(): Promise<
  AdvancedNavigatorUAData | undefined
> {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return undefined
  }
  return copyUserAgentData(await resolveAdvancedUserAgentData())
}

export {
  getAdvancedUserAgentData,
  getCachedUserAgentData,
  readUserAgentDataSync,
  resetUserAgentCache,
  resolveAdvancedUserAgentData,
}
