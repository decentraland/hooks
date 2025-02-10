import { renderHook } from "@testing-library/react/pure"
import { useAsyncEffect } from "../../src/hooks/useAsyncEffect"

jest.mock("../__mocks__/sentry")

describe("useAsyncEffect", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should execute effect", async () => {
    const mockEffect = jest.fn().mockResolvedValue(undefined)
    renderHook(() => useAsyncEffect(mockEffect, []))
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(mockEffect).toHaveBeenCalled()
  })

  it("should execute cleanup", async () => {
    const mockCleanup = jest.fn()
    const mockEffect = jest.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
      return () => mockCleanup()
    })
    const { unmount } = renderHook(() => useAsyncEffect(mockEffect, []))
    await new Promise((resolve) => setTimeout(resolve, 100))
    unmount()
    await new Promise((resolve) => setTimeout(resolve, 50))
    expect(mockCleanup).toHaveBeenCalled()
  })

  it("should re-run effect when dependencies change", async () => {
    const mockEffect = jest.fn().mockResolvedValue(undefined)
    const { rerender } = renderHook(
      ({ dep }) => useAsyncEffect(mockEffect, [dep]),
      { initialProps: { dep: 1 } }
    )
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(mockEffect).toHaveBeenCalledTimes(1)
    rerender({ dep: 2 })
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(mockEffect).toHaveBeenCalledTimes(2)
  })

  it("should handle errors", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()
    const mockError = new Error("Test error")
    const mockEffect = jest.fn().mockRejectedValue(mockError)
    renderHook(() => useAsyncEffect(mockEffect, []))
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "AsyncEffect error: ",
      mockError
    )
    consoleErrorSpy.mockRestore()
  })
})
