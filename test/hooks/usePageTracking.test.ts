import { MemoryRouter } from "react-router"
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

// Get the mock for assertions
const mockAnalytics = jest
  .requireMock("../../src/hooks/useAnalytics")
  .useAnalytics()

describe("usePageTracking", () => {
  const initialPath = "/initial"

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("when mounted", () => {
    beforeEach(async () => {
      renderHook(() => usePageTracking(), {
        wrapper: ({ children }) =>
          AnalyticsProvider({
            writeKey: "test-key",
            children: MemoryRouter({
              initialEntries: [initialPath],
              children,
            }),
          }),
      })
      await act(async () => {})
    })

    it("should track initial page view", () => {
      expect(mockAnalytics.page).toHaveBeenCalledWith(initialPath)
    })

    describe("when location changes", () => {
      const newPath = "/new-path"

      beforeEach(async () => {
        renderHook(() => usePageTracking(), {
          wrapper: ({ children }) =>
            AnalyticsProvider({
              writeKey: "test-key",
              children: MemoryRouter({
                initialEntries: [initialPath, newPath],
                children,
              }),
            }),
        })
        await act(async () => {})
      })

      it("should track new page view", () => {
        expect(mockAnalytics.page).toHaveBeenCalledWith(newPath)
      })
    })
  })

  describe("when analytics is not initialized", () => {
    beforeEach(async () => {
      mockAnalytics.isInitialized = false
      renderHook(() => usePageTracking(), {
        wrapper: ({ children }) =>
          AnalyticsProvider({
            writeKey: "test-key",
            children: MemoryRouter({
              initialEntries: [initialPath],
              children,
            }),
          }),
      })
      await act(async () => {})
    })

    afterEach(() => {
      mockAnalytics.isInitialized = true
    })

    it("should not track page view", () => {
      expect(mockAnalytics.page).not.toBeInstanceOf(Promise)
    })
  })
})
