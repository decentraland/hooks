import { act, renderHook } from "@testing-library/react"
import { useAsyncEffect } from "../../src/hooks/useAsyncEffect"

jest.mock("../__mocks__/sentry")

describe("useAsyncEffect", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should execute effect on mount", async () => {
    const mockEffect = jest.fn().mockResolvedValue(undefined)
    renderHook(() => useAsyncEffect(mockEffect, []))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(mockEffect).toHaveBeenCalledTimes(1)
  })

  it("should execute cleanup function when unmounting", async () => {
    const mockCleanup = jest.fn()
    const mockEffect = jest.fn().mockImplementation(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
      return mockCleanup
    })

    const { unmount } = renderHook(() => useAsyncEffect(mockEffect, []))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    unmount()

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(mockCleanup).toHaveBeenCalledTimes(1)
  })

  it("should re-run effect when dependencies change", async () => {
    const mockEffect = jest.fn().mockResolvedValue(undefined)
    const { rerender } = renderHook(
      ({ dep }) => useAsyncEffect(mockEffect, [dep]),
      { initialProps: { dep: 1 } }
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(mockEffect).toHaveBeenCalledTimes(1)
    expect(mockEffect).toHaveBeenLastCalledWith()

    rerender({ dep: 2 })

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(mockEffect).toHaveBeenCalledTimes(2)
    expect(mockEffect).toHaveBeenLastCalledWith()
  })

  it("should handle effect errors and log them", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()
    const mockError = new Error("Test error")
    const mockEffect = jest.fn().mockRejectedValue(mockError)

    renderHook(() => useAsyncEffect(mockEffect, []))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      "AsyncEffect error: ",
      mockError
    )
    expect(mockEffect).toHaveBeenCalledTimes(1)

    consoleErrorSpy.mockRestore()
  })

  it("should not execute effect if dependencies are empty and effect has already run", async () => {
    const mockEffect = jest.fn().mockResolvedValue(undefined)
    const { rerender } = renderHook(() => useAsyncEffect(mockEffect, []))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(mockEffect).toHaveBeenCalledTimes(1)

    rerender()

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(mockEffect).toHaveBeenCalledTimes(1)
  })

  it("should handle effect that returns undefined", async () => {
    const mockEffect = jest.fn().mockResolvedValue(undefined)
    const { unmount } = renderHook(() => useAsyncEffect(mockEffect, []))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // No debería lanzar error al desmontar
    unmount()

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50))
    })

    expect(mockEffect).toHaveBeenCalledTimes(1)
  })
})
