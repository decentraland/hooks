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
