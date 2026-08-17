import { act, renderHook } from "@testing-library/react/pure"
import { AnalyticsProvider } from "../../src/contexts/analytics/AnalyticsProvider"
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
