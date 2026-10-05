import type { AdvancedNavigatorUAData } from "../../src/hooks/useAdvancedUserAgentData"

// These cases run against the real ua-parser-js (no mock): browser detection
// depends on how the library combines the User-Agent string, Client Hints and
// `navigator.brave`, which a mock would only restate.

const USER_AGENTS = {
  chrome:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36 Edg/124.0.2478.67",
  opera:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/110.0.0.0 Safari/537.36 OPR/96.0.0.0",
  chromeAndroid:
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Mobile Safari/537.36",
  firefox:
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0",
  safari:
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
}

type Environment = {
  userAgent: string
  brave?: boolean
  getHighEntropyValues?: () => Promise<unknown>
}

type HookModule = {
  renderHook: typeof import("@testing-library/react/pure").renderHook
  act: typeof import("@testing-library/react/pure").act
  cleanup: typeof import("@testing-library/react/pure").cleanup
  useAdvancedUserAgentData: typeof import("../../src/hooks/useAdvancedUserAgentData").useAdvancedUserAgentData
}

const NAVIGATOR_OVERRIDES = ["userAgent", "brave", "userAgentData"] as const
const originalDescriptors = Object.fromEntries(
  NAVIGATOR_OVERRIDES.map((key) => [
    key,
    Object.getOwnPropertyDescriptor(window.navigator, key),
  ])
)

// loadHook redefines these properties on the shared navigator; put them back.
function restoreNavigator(): void {
  NAVIGATOR_OVERRIDES.forEach((key) => {
    const original = originalDescriptors[key]
    if (original) {
      Object.defineProperty(window.navigator, key, original)
    } else {
      delete (window.navigator as unknown as Record<string, unknown>)[key]
    }
  })
}

// ua-parser-js reads `navigator.userAgentData` once, when it is first loaded,
// so every case loads a fresh copy of the library, React and the hook.
function loadHook({
  userAgent,
  brave,
  getHighEntropyValues,
}: Environment): HookModule {
  Object.defineProperty(window.navigator, "userAgent", {
    value: userAgent,
    configurable: true,
  })
  Object.defineProperty(window.navigator, "brave", {
    value: brave ? { isBrave: () => Promise.resolve(true) } : undefined,
    configurable: true,
  })
  Object.defineProperty(window.navigator, "userAgentData", {
    value: getHighEntropyValues
      ? { brands: [], mobile: false, platform: "macOS", getHighEntropyValues }
      : undefined,
    configurable: true,
  })

  let loaded: HookModule | undefined
  jest.isolateModules(() => {
    const testingLibrary = require("@testing-library/react/pure")
    const {
      useAdvancedUserAgentData,
    } = require("../../src/hooks/useAdvancedUserAgentData")
    loaded = {
      renderHook: testingLibrary.renderHook,
      act: testingLibrary.act,
      cleanup: testingLibrary.cleanup,
      useAdvancedUserAgentData,
    }
  })
  return loaded as HookModule
}

async function detect(
  environment: Environment
): Promise<AdvancedNavigatorUAData | undefined> {
  const { renderHook, act, cleanup, useAdvancedUserAgentData } =
    loadHook(environment)
  const { result } = renderHook(() => useAdvancedUserAgentData())
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 50))
  })
  const data = result.current[1]
  cleanup()
  return data
}

describe("useAdvancedUserAgentData browser detection", () => {
  beforeEach(() => {
    // isAppleSilicon probes WebGL through a canvas, which jsdom does not implement.
    jest.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null)
  })

  afterEach(() => {
    restoreNavigator()
    jest.useRealTimers()
    jest.restoreAllMocks()
  })

  describe("when the user agent identifies the browser", () => {
    it.each([
      ["Chrome", USER_AGENTS.chrome],
      ["Edge", USER_AGENTS.edge],
      ["Opera", USER_AGENTS.opera],
      ["Firefox", USER_AGENTS.firefox],
      ["Safari", USER_AGENTS.safari],
    ])("should resolve %s", async (name, userAgent) => {
      const data = await detect({ userAgent })
      expect(data?.browser.name).toBe(name)
    })
  })

  describe("when the browser sends a Chrome user agent and exposes navigator.brave", () => {
    it("should resolve Brave", async () => {
      const data = await detect({ userAgent: USER_AGENTS.chrome, brave: true })
      expect(data?.browser.name).toBe("Brave")
    })

    it("should keep the Chrome version", async () => {
      const data = await detect({ userAgent: USER_AGENTS.chrome, brave: true })
      expect(data?.browser.version).toBe("124.0.0.0")
    })

    describe("and Client Hints report a Chrome brand", () => {
      it("should still resolve Brave", async () => {
        const data = await detect({
          userAgent: USER_AGENTS.chrome,
          brave: true,
          getHighEntropyValues: () =>
            Promise.resolve({
              brands: [
                { brand: "Chromium", version: "124" },
                { brand: "Google Chrome", version: "124" },
              ],
              fullVersionList: [
                { brand: "Chromium", version: "124.0.6367.60" },
                { brand: "Google Chrome", version: "124.0.6367.60" },
              ],
            }),
        })
        expect(data?.browser.name).toBe("Brave")
      })
    })
  })

  describe("when Client Hints resolve", () => {
    const fullChromeHints = {
      brands: [
        { brand: "Chromium", version: "124" },
        { brand: "Google Chrome", version: "124" },
      ],
      fullVersionList: [
        { brand: "Chromium", version: "124.0.6367.60" },
        { brand: "Google Chrome", version: "124.0.6367.60" },
      ],
      platform: "Android",
      platformVersion: "10.0.0",
    }
    let hintsCalls: number
    let environment: Environment

    beforeEach(() => {
      hintsCalls = 0
      environment = {
        userAgent: USER_AGENTS.chromeAndroid,
        getHighEntropyValues: () => {
          hintsCalls += 1
          return Promise.resolve(fullChromeHints)
        },
      }
    })

    it("should keep the browser name and the reduced version from the user agent", async () => {
      const data = await detect(environment)
      expect(data?.browser).toEqual({
        name: "Mobile Chrome",
        version: "124.0.0.0",
      })
    })

    it("should keep the engine from the user agent", async () => {
      const withoutHints = await detect({
        userAgent: USER_AGENTS.chromeAndroid,
      })
      const data = await detect(environment)
      expect(data?.engine).toEqual(withoutHints?.engine)
    })

    it("should still take the OS from the hints", async () => {
      const data = await detect(environment)
      expect(data?.os.name).toBe("Android")
    })

    it("should read the Client Hints once for the result, once for the OS and once for the CPU", async () => {
      const { renderHook, act, cleanup, useAdvancedUserAgentData } =
        loadHook(environment)
      // Loading the hook also loads @sentry/browser, whose profiling code calls
      // getHighEntropyValues once on its own (a 4th call that is not ours, and that
      // would change with a Sentry bump). Only the calls made after that count.
      const callsOnImport = hintsCalls
      renderHook(() => useAdvancedUserAgentData())
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
      cleanup()
      expect(hintsCalls - callsOnImport).toBe(3)
    })

    describe("and they report the Brave brand", () => {
      it("should resolve Brave without navigator.brave", async () => {
        const data = await detect({
          userAgent: USER_AGENTS.chrome,
          getHighEntropyValues: () =>
            Promise.resolve({
              brands: [
                { brand: "Chromium", version: "124" },
                { brand: "Brave", version: "124" },
              ],
              fullVersionList: [
                { brand: "Chromium", version: "124.0.6367.60" },
                { brand: "Brave", version: "124.0.6367.60" },
              ],
            }),
        })
        expect(data?.browser).toEqual({ name: "Brave", version: "124.0.0.0" })
      })
    })
  })

  describe("when the browser is Chrome without navigator.brave", () => {
    it("should resolve Chrome", async () => {
      const data = await detect({ userAgent: USER_AGENTS.chrome, brave: false })
      expect(data?.browser.name).toBe("Chrome")
    })
  })

  describe("when Client Hints are rejected", () => {
    let environment: Environment
    let consoleError: jest.SpyInstance

    beforeEach(() => {
      environment = {
        userAgent: USER_AGENTS.edge,
        getHighEntropyValues: () => Promise.reject(new Error("blocked")),
      }
      consoleError = jest
        .spyOn(console, "error")
        .mockImplementation(() => undefined)
    })

    it("should resolve with the user agent data and stop loading", async () => {
      const { renderHook, act, cleanup, useAdvancedUserAgentData } =
        loadHook(environment)
      const { result } = renderHook(() => useAdvancedUserAgentData())
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 50))
      })
      expect(result.current[0]).toBe(false)
      expect(result.current[1]?.browser.name).toBe("Edge")
      cleanup()
    })

    // The rejection is handled by the hook: if it reached useAsyncEffect's catch it would be logged.
    it("should not log anything", async () => {
      await detect(environment)
      expect(consoleError).not.toHaveBeenCalled()
    })

    describe("and the browser is Brave", () => {
      it("should keep Brave from the feature check", async () => {
        const data = await detect({
          ...environment,
          userAgent: USER_AGENTS.chrome,
          brave: true,
        })
        expect(data?.browser.name).toBe("Brave")
      })
    })
  })

  describe("when Client Hints never settle", () => {
    let environment: Environment
    let hintsCalls: number

    beforeEach(() => {
      jest.useFakeTimers()
      hintsCalls = 0
      environment = {
        userAgent: USER_AGENTS.chrome,
        brave: true,
        getHighEntropyValues: () => {
          hintsCalls += 1
          return new Promise(() => undefined)
        },
      }
    })

    it("should stay loading until the timeout elapses", async () => {
      const { renderHook, act, cleanup, useAdvancedUserAgentData } =
        loadHook(environment)
      const { result } = renderHook(() => useAdvancedUserAgentData())
      await act(async () => {
        await jest.advanceTimersByTimeAsync(1000)
      })
      expect(hintsCalls).toBeGreaterThan(0)
      expect(result.current[0]).toBe(true)
      expect(result.current[1]).toBeUndefined()
      cleanup()
    })

    it("should resolve with the user agent data after the timeout and clear its timer", async () => {
      const { renderHook, act, cleanup, useAdvancedUserAgentData } =
        loadHook(environment)
      const { result } = renderHook(() => useAdvancedUserAgentData())
      await act(async () => {
        await jest.advanceTimersByTimeAsync(2000)
      })
      expect(result.current[0]).toBe(false)
      expect(result.current[1]?.browser.name).toBe("Brave")
      expect(jest.getTimerCount()).toBe(0)
      cleanup()
    })
  })

  describe("when Client Hints settle after the timeout", () => {
    // The hook issues several getHighEntropyValues calls; every one of them
    // shares this deferred so the whole Client Hints read completes late.
    let resolveHints: (value: unknown) => void
    let hintsCalls: number
    let environment: Environment
    // Hints that would change the browser version, the OS name/version and the
    // CPU architecture if they were ever applied to the cached result.
    const lateHints = {
      brands: [{ brand: "Google Chrome", version: "125" }],
      fullVersionList: [{ brand: "Google Chrome", version: "125.0.6422.60" }],
      platform: "Windows",
      platformVersion: "15.0.0",
      architecture: "arm",
      bitness: "64",
    }

    beforeEach(() => {
      jest.useFakeTimers()
      hintsCalls = 0
      const hints = new Promise((resolve) => {
        resolveHints = resolve
      })
      environment = {
        userAgent: USER_AGENTS.chrome,
        brave: true,
        getHighEntropyValues: () => {
          hintsCalls += 1
          return hints
        },
      }
    })

    it("should keep the browser, OS and CPU snapshot stable and render a single final outcome", async () => {
      const { renderHook, act, cleanup, useAdvancedUserAgentData } =
        loadHook(environment)
      const seen: Array<[boolean, AdvancedNavigatorUAData | undefined]> = []
      const { result } = renderHook(() => {
        const value = useAdvancedUserAgentData()
        seen.push(value)
        return value
      })
      await act(async () => {
        await jest.advanceTimersByTimeAsync(2000)
      })
      const settled = result.current[1]
      const snapshot = JSON.parse(JSON.stringify(settled))
      const settledRenders = seen.filter(([isLoading]) => !isLoading).length
      expect(hintsCalls).toBeGreaterThanOrEqual(3)
      expect(snapshot.browser).toEqual({ name: "Brave", version: "124.0.0.0" })
      expect(snapshot.os).toEqual({ name: "macOS", version: "10.15.7" })
      expect(snapshot.cpu).toEqual({ architecture: "Unknown" })

      await act(async () => {
        resolveHints(lateHints)
        await jest.advanceTimersByTimeAsync(100)
      })

      expect(result.current[0]).toBe(false)
      expect(result.current[1]).toBe(settled)
      expect(result.current[1]).toEqual(snapshot)
      expect(seen.filter(([isLoading]) => !isLoading)).toHaveLength(
        settledRenders
      )
      expect(jest.getTimerCount()).toBe(0)
      cleanup()
    })

    it("should serve the same snapshot to a later mount", async () => {
      const { renderHook, act, cleanup, useAdvancedUserAgentData } =
        loadHook(environment)
      const first = renderHook(() => useAdvancedUserAgentData())
      await act(async () => {
        await jest.advanceTimersByTimeAsync(2000)
      })
      const snapshot = JSON.parse(JSON.stringify(first.result.current[1]))
      await act(async () => {
        resolveHints(lateHints)
        await jest.advanceTimersByTimeAsync(100)
      })
      const second = renderHook(() => useAdvancedUserAgentData())
      expect(second.result.current[0]).toBe(false)
      expect(second.result.current[1]).toBe(first.result.current[1])
      expect(second.result.current[1]).toEqual(snapshot)
      cleanup()
    })
  })
})
