import { act, renderHook } from "@testing-library/react"
import { useAsyncMemo } from "../../src/hooks/useAsyncMemo"

jest.mock("../__mocks__/sentry")

describe("useAsyncMemo", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should behave like useAsyncState", async () => {
    const mockData = { test: "data" }
    const mockCallback = jest.fn().mockResolvedValue(mockData)
    const { result } = renderHook(() => useAsyncMemo(mockCallback, []))

    expect(result.current[0]).toBe(null)
    expect(result.current[1].loading).toBe(true)
    expect(result.current[1].error).toBe(null)

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(result.current[0]).toEqual(mockData)
    expect(result.current[1].loading).toBe(false)
    expect(result.current[1].error).toBe(null)
    expect(result.current[1].loaded).toBe(true)
  })

  it("should handle errors like useAsyncState", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()
    const mockError = new Error("Test error")
    const mockCallback = jest.fn().mockRejectedValue(mockError)
    const { result } = renderHook(() => useAsyncMemo(mockCallback, []))

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(result.current[0]).toBe(null)
    expect(result.current[1].loading).toBe(false)
    expect(result.current[1].error).toBe(mockError)
    expect(consoleErrorSpy).toHaveBeenCalledWith(mockError)

    consoleErrorSpy.mockRestore()
  })

  it("should handle dependencies like useAsyncState", async () => {
    const mockData = { test: "data" }
    const mockCallback = jest.fn().mockResolvedValue(mockData)
    const { result, rerender } = renderHook(
      ({ dep }) => useAsyncMemo(mockCallback, [dep]),
      { initialProps: { dep: 1 } }
    )

    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(mockCallback).toHaveBeenCalledTimes(1)
    expect(result.current[0]).toEqual(mockData)

    rerender({ dep: 2 })
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    expect(mockCallback).toHaveBeenCalledTimes(2)
    expect(result.current[0]).toEqual(mockData)
  })
})
