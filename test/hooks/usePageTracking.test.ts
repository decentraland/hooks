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

const useAnalyticsMock = jest.requireMock(
  "../../src/hooks/useAnalytics"
).useAnalytics
const mockAnalytics = useAnalyticsMock()

const renderPageTracking = (path: string) =>
  renderHook(({ path }) => usePageTracking(path), {
    initialProps: { path },
  })

const renderPageTrackingWithProperties = (
  name: string | undefined,
  properties?: Record<string, unknown>
) =>
  renderHook(({ name, properties }) => usePageTracking(name, properties), {
    initialProps: { name, properties },
  })

const flushEffects = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

describe("usePageTracking", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useAnalyticsMock.mockReturnValue(mockAnalytics)
    mockAnalytics.isInitialized = true
  })

  describe("when mounted", () => {
    let initialPath: string

    beforeEach(async () => {
      initialPath = "/initial"
      renderPageTracking(initialPath)
      await flushEffects()
    })

    it("should track initial page view", () => {
      expect(mockAnalytics.page).toHaveBeenCalledWith(initialPath, undefined)
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
      await flushEffects()
      jest.clearAllMocks()
      rerender({ path: newPath })
      await flushEffects()
    })

    it("should track the new page view", () => {
      expect(mockAnalytics.page).toHaveBeenCalledWith(newPath, undefined)
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
      await flushEffects()
      jest.clearAllMocks()
      rerender({ path: initialPath })
      await flushEffects()
    })

    it("should not track page view again", () => {
      expect(mockAnalytics.page).not.toHaveBeenCalled()
    })
  })

  describe("when called with name and properties", () => {
    beforeEach(async () => {
      renderPageTrackingWithProperties("Blog Post", {
        title: "Hello",
        slug: "hello",
      })
      await flushEffects()
    })

    it("should pass properties to page()", () => {
      expect(mockAnalytics.page).toHaveBeenCalledWith("Blog Post", {
        title: "Hello",
        slug: "hello",
      })
    })

    it("should fire only once for stable args", () => {
      expect(mockAnalytics.page).toHaveBeenCalledTimes(1)
    })
  })

  describe("when properties change between renders", () => {
    beforeEach(async () => {
      const { rerender } = renderPageTrackingWithProperties("Post", {
        title: "A",
      })
      await flushEffects()
      jest.clearAllMocks()
      rerender({ name: "Post", properties: { title: "B" } })
      await flushEffects()
    })

    it("should re-fire page() with the new properties", () => {
      expect(mockAnalytics.page).toHaveBeenCalledWith("Post", { title: "B" })
    })

    it("should fire only once after the change", () => {
      expect(mockAnalytics.page).toHaveBeenCalledTimes(1)
    })
  })

  describe("when properties keep the same shape across rerenders", () => {
    beforeEach(async () => {
      const { rerender } = renderPageTrackingWithProperties("Post", {
        title: "A",
      })
      await flushEffects()
      jest.clearAllMocks()
      rerender({ name: "Post", properties: { title: "A" } })
      await flushEffects()
    })

    it("should not fire page() again", () => {
      expect(mockAnalytics.page).not.toHaveBeenCalled()
    })
  })

  describe("when name is undefined", () => {
    beforeEach(async () => {
      renderPageTrackingWithProperties(undefined, { title: "Hello" })
      await flushEffects()
    })

    it("should not fire page()", () => {
      expect(mockAnalytics.page).not.toHaveBeenCalled()
    })
  })

  describe("when name is an empty string", () => {
    beforeEach(async () => {
      renderPageTrackingWithProperties("", { title: "Hello" })
      await flushEffects()
    })

    it("should not fire page()", () => {
      expect(mockAnalytics.page).not.toHaveBeenCalled()
    })
  })

  describe("when analytics is not initialized", () => {
    beforeEach(async () => {
      useAnalyticsMock.mockReturnValue({
        ...mockAnalytics,
        isInitialized: false,
      })
      renderPageTrackingWithProperties("Post", { title: "Hello" })
      await flushEffects()
    })

    it("should not fire page()", () => {
      expect(mockAnalytics.page).not.toHaveBeenCalled()
    })
  })

  describe("when name is provided later (analytics initializes after mount)", () => {
    beforeEach(async () => {
      useAnalyticsMock.mockReturnValue({
        ...mockAnalytics,
        isInitialized: true,
      })
      const { rerender } = renderPageTrackingWithProperties(undefined, {
        title: "Hello",
      })
      await flushEffects()
      jest.clearAllMocks()
      rerender({ name: "Post", properties: { title: "Hello" } })
      await flushEffects()
    })

    it("should fire page() once name resolves", () => {
      expect(mockAnalytics.page).toHaveBeenCalledWith("Post", {
        title: "Hello",
      })
    })
  })
})
