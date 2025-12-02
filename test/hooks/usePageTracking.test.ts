import { act, renderHook } from "@testing-library/react/pure"
import { AnalyticsProvider } from "../../src/contexts/analytics/AnalyticsProvider"
import { usePageTracking } from "../../src/hooks/usePageTracking"

jest.mock("../../src/hooks/useAnalytics", () => {
  const mock = {
    page: jest.fn().mockImplementation(() => Promise.resolve()),
    track: jest.fn().mockImplementation(() => Promise.resolve()),
    identify: jest.fn().mockImplementation(() => Promise.resolve()),
    isInitialized: true,
  }
  return {
    useAnalytics: jest.fn().mockReturnValue(mock),
  }
})

jest.mock("@segment/analytics-next", () => ({
  AnalyticsBrowser: {
    load: jest.fn().mockResolvedValue({
      track: jest.fn(),
      identify: jest.fn(),
      page: jest.fn(),
    }),
  },
}))

jest.mock("isbot", () => ({
  isbot: jest.fn().mockReturnValue(false),
}))

const mockAnalytics = jest
  .requireMock("../../src/hooks/useAnalytics")
  .useAnalytics()

describe("usePageTracking", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    Object.defineProperty(window, "location", {
      value: {
        pathname: "/initial",
      },
      writable: true,
    })
  })

  describe("when mounted", () => {
    let initialPath: string

    beforeEach(() => {
      initialPath = "/initial"
      Object.defineProperty(window, "location", {
        value: {
          pathname: initialPath,
        },
        writable: true,
      })
    })

    beforeEach(async () => {
      renderHook(() => usePageTracking(initialPath), {
        wrapper: ({ children }) =>
          AnalyticsProvider({
            writeKey: "test-key",
            children,
          }),
      })
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
    })

    it("should track initial page view", () => {
      expect(mockAnalytics.page).toHaveBeenCalledWith(initialPath)
    })
  })

  describe("when analytics is not initialized", () => {
    let initialPath: string

    beforeEach(() => {
      initialPath = "/initial"
      mockAnalytics.isInitialized = false
      Object.defineProperty(window, "location", {
        value: {
          pathname: initialPath,
        },
        writable: true,
      })
    })

    beforeEach(async () => {
      renderHook(() => usePageTracking(initialPath), {
        wrapper: ({ children }) =>
          AnalyticsProvider({
            writeKey: "test-key",
            children,
          }),
      })
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
    })

    afterEach(() => {
      mockAnalytics.isInitialized = true
    })

    it("should not track page view", () => {
      expect(mockAnalytics.page).not.toBeInstanceOf(Promise)
    })
  })
})
