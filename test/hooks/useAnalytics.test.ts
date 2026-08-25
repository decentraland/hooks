import React from "react"
import { act, cleanup, render, renderHook } from "@testing-library/react/pure"
import { AnalyticsProvider } from "../../src/contexts/analytics/AnalyticsProvider"
import { getAnalytics } from "../../src/contexts/analytics/registry"
import { useAnalytics } from "../../src/hooks/useAnalytics"
import type { AnalyticsContextType } from "../../src/contexts/analytics/types"

// Mock Segment Analytics
const mockAnalyticsMethods = {
  track: jest.fn().mockImplementation(() => Promise.resolve()),
  identify: jest.fn().mockImplementation(() => Promise.resolve()),
  page: jest.fn().mockImplementation(() => Promise.resolve()),
}

const mockAnalyticsBrowser = {
  track: mockAnalyticsMethods.track,
  identify: mockAnalyticsMethods.identify,
  page: mockAnalyticsMethods.page,
}

jest.mock("@segment/analytics-next", () => ({
  AnalyticsBrowser: {
    load: jest.fn().mockReturnValue(mockAnalyticsBrowser),
  },
}))

// Mock isbot
jest.mock("isbot", () => ({
  isbot: jest.fn().mockReturnValue(false),
}))

describe("useAnalytics", () => {
  let result: { current: AnalyticsContextType }
  const mockWriteKey = "test-write-key"
  const mockUserId = "test-user-id"
  const mockTraits = { name: "Test User" }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  // The pure entrypoint does not auto-unmount: without this a provider stays mounted across tests and
  // its instance leaks into the registry the next one reads.
  afterEach(() => {
    cleanup()
  })

  describe("when used outside of AnalyticsProvider", () => {
    it("should throw error", () => {
      const errorMessage = "useAnalytics must be used within AnalyticsProvider"
      expect(() => renderHook(() => useAnalytics())).toThrow(errorMessage)
    })
  })

  describe("when no write key is provided", () => {
    beforeEach(() => {
      const rendered = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) =>
          AnalyticsProvider({ writeKey: "", children }),
      })
      result = rendered.result
    })

    it("should return non-initialized state", () => {
      expect(result.current.isInitialized).toBe(false)
    })
  })

  describe("when user agent is a bot", () => {
    const { isbot } = jest.requireMock("isbot")

    beforeEach(() => {
      isbot.mockReturnValue(true)
      const rendered = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) =>
          AnalyticsProvider({ writeKey: mockWriteKey, children }),
      })
      result = rendered.result
    })

    afterEach(() => {
      isbot.mockRestore()
    })

    it("should return non-initialized state", () => {
      expect(result.current.isInitialized).toBe(false)
    })
  })

  describe("when write key is provided", () => {
    beforeEach(async () => {
      const rendered = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) =>
          AnalyticsProvider({ writeKey: mockWriteKey, children }),
      })
      result = rendered.result
      await act(async () => {})
    })

    it("should return initialized state", () => {
      expect(result.current.isInitialized).toBe(true)
    })

    describe("when tracking an event", () => {
      const eventName = "test_event"
      const eventProperties = { test: "data" }

      beforeEach(() => {
        result.current.track(eventName, eventProperties)
      })

      it("should call track with correct parameters", () => {
        expect(mockAnalyticsMethods.track).toHaveBeenCalledWith(
          eventName,
          eventProperties
        )
      })
    })
  })

  describe("when no first party proxy is configured", () => {
    const { AnalyticsBrowser } = jest.requireMock("@segment/analytics-next")

    beforeEach(async () => {
      renderHook(() => useAnalytics(), {
        wrapper: ({ children }) =>
          AnalyticsProvider({ writeKey: mockWriteKey, children }),
      })
      await act(async () => {})
    })

    it("should load analytics against Segment's own cdn and ingestion endpoint", () => {
      expect(AnalyticsBrowser.load).toHaveBeenCalledWith(
        { writeKey: mockWriteKey },
        {}
      )
    })
  })

  describe("when a first party proxy is configured", () => {
    const { AnalyticsBrowser } = jest.requireMock("@segment/analytics-next")

    beforeEach(async () => {
      renderHook(() => useAnalytics(), {
        wrapper: ({ children }) =>
          AnalyticsProvider({
            writeKey: mockWriteKey,
            cdnUrl: "https://analytics.example.com",
            apiHost: "analytics.example.com/v1",
            children,
          }),
      })
      await act(async () => {})
    })

    it("should load analytics resolving its settings from the proxy", () => {
      expect(AnalyticsBrowser.load).toHaveBeenCalledWith(
        { writeKey: mockWriteKey, cdnURL: "https://analytics.example.com" },
        expect.anything()
      )
    })

    it("should load analytics delivering its events to the proxy", () => {
      expect(AnalyticsBrowser.load).toHaveBeenCalledWith(expect.anything(), {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        integrations: { "Segment.io": { apiHost: "analytics.example.com/v1" } },
      })
    })
  })

  describe("when the configured first party proxy is not a valid https url", () => {
    const { AnalyticsBrowser } = jest.requireMock("@segment/analytics-next")
    let consoleWarn: jest.SpyInstance

    beforeEach(async () => {
      consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {})
      renderHook(() => useAnalytics(), {
        wrapper: ({ children }) =>
          AnalyticsProvider({
            writeKey: mockWriteKey,
            cdnUrl: "http://analytics.example.com",
            apiHost: "http://analytics.example.com/v1",
            children,
          }),
      })
      await act(async () => {})
    })

    afterEach(() => {
      consoleWarn.mockRestore()
    })

    it("should warn about it and fall back to Segment's own endpoints", () => {
      expect(consoleWarn).toHaveBeenCalled()
      expect(AnalyticsBrowser.load).toHaveBeenCalledWith(
        { writeKey: mockWriteKey },
        {}
      )
    })
  })

  describe("when the configuration changes after analytics loaded", () => {
    const { AnalyticsBrowser } = jest.requireMock("@segment/analytics-next")
    let loaded: { track: jest.Mock }[]
    let analytics: AnalyticsContextType
    let consoleWarn: jest.SpyInstance

    // Probe that exposes the context value of whichever provider is mounted
    const probe = () => {
      analytics = useAnalytics()
      return null
    }

    const renderWithCdnUrl = (cdnUrl: string) =>
      React.createElement(AnalyticsProvider, {
        writeKey: mockWriteKey,
        cdnUrl,
        children: React.createElement(probe),
      })

    beforeEach(async () => {
      consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {})
      loaded = []
      AnalyticsBrowser.load.mockImplementation(() => {
        const instance = {
          track: jest.fn().mockImplementation(() => Promise.resolve()),
          identify: jest.fn().mockImplementation(() => Promise.resolve()),
          page: jest.fn().mockImplementation(() => Promise.resolve()),
        }
        loaded.push(instance)
        return instance
      })

      const { rerender } = render(renderWithCdnUrl("https://one.example.com"))
      await act(async () => {})

      rerender(renderWithCdnUrl("https://two.example.com"))
      await act(async () => {})
    })

    afterEach(() => {
      AnalyticsBrowser.load.mockReturnValue(mockAnalyticsBrowser)
      consoleWarn.mockRestore()
    })

    it("should load analytics again with the new configuration", () => {
      expect(loaded).toHaveLength(2)
      expect(AnalyticsBrowser.load).toHaveBeenLastCalledWith(
        { writeKey: mockWriteKey, cdnURL: "https://two.example.com" },
        {}
      )
    })

    it("should not warn about multiple providers, the previous instance unregistered first", () => {
      expect(consoleWarn).not.toHaveBeenCalledWith(
        expect.stringContaining("more than one AnalyticsProvider")
      )
    })

    it("should route the calls to the instance of the latest load", () => {
      analytics.track("test_event")

      expect(loaded[1].track).toHaveBeenCalledWith("test_event", undefined)
      expect(loaded[0].track).not.toHaveBeenCalled()
    })
  })

  describe("when code outside react reads the analytics instance", () => {
    const { AnalyticsBrowser } = jest.requireMock("@segment/analytics-next")

    describe("and a provider loaded analytics", () => {
      let rendered: ReturnType<typeof renderHook<AnalyticsContextType, unknown>>

      beforeEach(async () => {
        rendered = renderHook(() => useAnalytics(), {
          wrapper: ({ children }) =>
            AnalyticsProvider({ writeKey: mockWriteKey, children }),
        })
        await act(async () => {})
      })

      afterEach(() => {
        rendered.unmount()
      })

      it("should return the instance the load produced", () => {
        expect(getAnalytics()).toBe(mockAnalyticsBrowser)
      })
    })

    describe("and the provider that loaded analytics unmounts", () => {
      beforeEach(async () => {
        const { unmount } = renderHook(() => useAnalytics(), {
          wrapper: ({ children }) =>
            AnalyticsProvider({ writeKey: mockWriteKey, children }),
        })
        await act(async () => {})
        unmount()
      })

      it("should return null", () => {
        expect(getAnalytics()).toBeNull()
      })
    })

    describe("and the provider is reconfigured without a write key", () => {
      let analytics: AnalyticsContextType

      // Probe that exposes the context value of whichever provider is mounted
      const probe = () => {
        analytics = useAnalytics()
        return null
      }

      const renderWithWriteKey = (writeKey: string) =>
        React.createElement(AnalyticsProvider, {
          writeKey,
          children: React.createElement(probe),
        })

      beforeEach(async () => {
        const { rerender } = render(renderWithWriteKey(mockWriteKey))
        await act(async () => {})

        rerender(renderWithWriteKey(""))
        await act(async () => {})
      })

      it("should return null", () => {
        expect(getAnalytics()).toBeNull()
      })

      it("should report the still mounted consumer as non initialized", () => {
        expect(analytics.isInitialized).toBe(false)
      })

      it("should no-op the calls the still mounted consumer makes", () => {
        analytics.track("test_event")

        expect(mockAnalyticsMethods.track).not.toHaveBeenCalled()
      })
    })

    describe("and the provider unmounts before the pending load resolves", () => {
      beforeEach(async () => {
        const { unmount } = renderHook(() => useAnalytics(), {
          wrapper: ({ children }) =>
            AnalyticsProvider({ writeKey: mockWriteKey, children }),
        })
        unmount()
        await act(async () => {})
      })

      it("should not load analytics at all", () => {
        expect(AnalyticsBrowser.load).not.toHaveBeenCalled()
      })

      it("should return null", () => {
        expect(getAnalytics()).toBeNull()
      })
    })

    describe("and the load throws while setting analytics up", () => {
      let consoleError: jest.SpyInstance

      beforeEach(async () => {
        consoleError = jest.spyOn(console, "error").mockImplementation(() => {})
        AnalyticsBrowser.load.mockImplementationOnce(() => {
          throw new Error("load failed")
        })
        renderHook(() => useAnalytics(), {
          wrapper: ({ children }) =>
            AnalyticsProvider({ writeKey: mockWriteKey, children }),
        })
        await act(async () => {})
      })

      afterEach(() => {
        consoleError.mockRestore()
      })

      it("should return null", () => {
        expect(getAnalytics()).toBeNull()
      })
    })

    describe("and identifying the user throws right after the load", () => {
      let consoleError: jest.SpyInstance

      beforeEach(async () => {
        consoleError = jest.spyOn(console, "error").mockImplementation(() => {})
        AnalyticsBrowser.load.mockReturnValueOnce({
          ...mockAnalyticsBrowser,
          identify: jest.fn().mockImplementation(() => {
            throw new Error("identify failed")
          }),
        })
        renderHook(() => useAnalytics(), {
          wrapper: ({ children }) =>
            AnalyticsProvider({
              writeKey: mockWriteKey,
              userId: mockUserId,
              children,
            }),
        })
        await act(async () => {})
      })

      afterEach(() => {
        consoleError.mockRestore()
      })

      it("should return null", () => {
        expect(getAnalytics()).toBeNull()
      })
    })
  })

  describe("when userId is provided", () => {
    beforeEach(async () => {
      const rendered = renderHook(() => useAnalytics(), {
        wrapper: ({ children }) =>
          AnalyticsProvider({
            writeKey: mockWriteKey,
            userId: mockUserId,
            traits: mockTraits,
            children,
          }),
      })
      result = rendered.result
      await act(async () => {})
    })

    it("should return initialized state", () => {
      expect(result.current.isInitialized).toBe(true)
    })

    describe("when calling identify", () => {
      beforeEach(() => {
        result.current.identify(mockUserId, mockTraits)
      })

      it("should call identify with correct parameters", () => {
        expect(mockAnalyticsMethods.identify).toHaveBeenCalledWith(
          mockUserId,
          mockTraits
        )
      })
    })
  })
})
