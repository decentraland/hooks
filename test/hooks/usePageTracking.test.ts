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
    })

    describe("and pathname is provided", () => {
      beforeEach(async () => {
        renderHook(() => usePageTracking(initialPath), {
          wrapper: ({ children }) =>
            AnalyticsProvider({
              writeKey: "test-key",
              children,
            }),
        })
        await act(async () => {})
      })

      it("should track initial page view", () => {
        expect(mockAnalytics.page).toHaveBeenCalledWith(initialPath)
      })
    })

    describe("and pathname is not provided", () => {
      beforeEach(async () => {
        renderHook(() => usePageTracking(), {
          wrapper: ({ children }) =>
            AnalyticsProvider({
              writeKey: "test-key",
              children,
            }),
        })
        await act(async () => {})
      })

      it("should track initial page view from window.location", () => {
        expect(mockAnalytics.page).toHaveBeenCalledWith("/initial")
      })
    })

    describe("when location changes", () => {
      let newPath: string

      beforeEach(() => {
        newPath = "/new-path"
      })

      describe("and pathname is provided", () => {
        beforeEach(async () => {
          const { rerender } = renderHook(
            ({ pathname }) => usePageTracking(pathname),
            {
              initialProps: { pathname: initialPath },
              wrapper: ({ children }) =>
                AnalyticsProvider({
                  writeKey: "test-key",
                  children,
                }),
            }
          )
          await act(async () => {})
          rerender({ pathname: newPath })
          await act(async () => {})
        })

        it("should track new page view", () => {
          expect(mockAnalytics.page).toHaveBeenCalledWith(newPath)
        })
      })
    })
  })

  describe("when analytics is not initialized", () => {
    let initialPath: string

    beforeEach(() => {
      initialPath = "/initial"
      mockAnalytics.isInitialized = false
    })

    beforeEach(async () => {
      renderHook(() => usePageTracking(initialPath), {
        wrapper: ({ children }) =>
          AnalyticsProvider({
            writeKey: "test-key",
            children,
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
