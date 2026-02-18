import { act, renderHook } from "@testing-library/react/pure"
import { usePageTracking } from "../../src/hooks/usePageTracking"

jest.mock("../../src/hooks/useAnalytics", () => {
  const mock = {
    page: jest.fn(),
    track: jest.fn(),
    identify: jest.fn(),
    isInitialized: true,
  }
  return {
    useAnalytics: jest.fn().mockReturnValue(mock),
  }
})

const mockAnalytics = jest
  .requireMock("../../src/hooks/useAnalytics")
  .useAnalytics()

const renderPageTracking = (path: string) =>
  renderHook(({ path }) => usePageTracking(path), {
    initialProps: { path },
  })

describe("usePageTracking", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe("when mounted", () => {
    let initialPath: string

    beforeEach(async () => {
      initialPath = "/initial"
      renderPageTracking(initialPath)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
    })

    it("should track initial page view", () => {
      expect(mockAnalytics.page).toHaveBeenCalledWith(initialPath)
    })

    it("should track page view only once", () => {
      expect(mockAnalytics.page).toHaveBeenCalledTimes(1)
    })
  })

  describe("when the path changes", () => {
    let initialPath: string
    let newPath: string

    beforeEach(async () => {
      initialPath = "/initial"
      newPath = "/new-page"
      const { rerender } = renderPageTracking(initialPath)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
      jest.clearAllMocks()
      rerender({ path: newPath })
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
    })

    it("should track the new page view", () => {
      expect(mockAnalytics.page).toHaveBeenCalledWith(newPath)
    })

    it("should track page view only once after the change", () => {
      expect(mockAnalytics.page).toHaveBeenCalledTimes(1)
    })
  })

  describe("when the path does not change on rerender", () => {
    let initialPath: string

    beforeEach(async () => {
      initialPath = "/same-page"
      const { rerender } = renderPageTracking(initialPath)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
      jest.clearAllMocks()
      rerender({ path: initialPath })
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 0))
      })
    })

    it("should not track page view again", () => {
      expect(mockAnalytics.page).not.toHaveBeenCalled()
    })
  })
})
