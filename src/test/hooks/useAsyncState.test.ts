import { act, renderHook } from "@testing-library/react/pure"
import { useAsyncState } from "../../hooks/useAsyncState"

jest.mock("test/__mocks__/sentry")

describe("useAsyncState", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should handle successful async operation", async () => {
    const mockData = { test: "data" }
    const mockCallback = jest.fn().mockResolvedValue(mockData)
    const { result } = renderHook(() => useAsyncState(mockCallback, []))

    expect(result.current[0]).toBe(null)
    expect(result.current[1].loading).toBe(true)
    expect(result.current[1].error).toBe(null)

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(result.current[0]).toEqual(mockData)
    expect(result.current[1].loading).toBe(false)
    expect(result.current[1].error).toBe(null)
    expect(result.current[1].loaded).toBe(true)
  })

  it("should handle errors", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()
    const mockError = new Error("Test error")
    const mockCallback = jest.fn().mockRejectedValue(mockError)
    const { result } = renderHook(() => useAsyncState(mockCallback, []))

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(result.current[0]).toBe(null)
    expect(result.current[1].loading).toBe(false)
    expect(result.current[1].error).toBe(mockError)
    expect(consoleErrorSpy).toHaveBeenCalledWith(mockError)

    consoleErrorSpy.mockRestore()
  })

  it("should handle initial value", async () => {
    const initialValue = { initial: "value" }
    const mockCallback = jest.fn().mockResolvedValue({ test: "data" })
    const { result } = renderHook(() =>
      useAsyncState(mockCallback, [], { initialValue })
    )

    expect(result.current[0]).toEqual(initialValue)
  })

  it("should reload data when dependencies change", async () => {
    const mockData = { test: "data" }
    const mockCallback = jest.fn().mockResolvedValue(mockData)
    const { result, rerender } = renderHook(
      ({ dep }) => useAsyncState(mockCallback, [dep]),
      { initialProps: { dep: 1 } }
    )

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(mockCallback).toHaveBeenCalledTimes(1)
    expect(result.current[0]).toEqual(mockData)

    rerender({ dep: 2 })
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(mockCallback).toHaveBeenCalledTimes(2)
    expect(result.current[0]).toEqual(mockData)
  })

  it("should handle manual reload", async () => {
    const mockCallback = jest.fn().mockResolvedValue({ test: "data" })
    const { result } = renderHook(() => useAsyncState(mockCallback, []))

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(mockCallback).toHaveBeenCalledTimes(1)

    act(() => {
      result.current[1].reload()
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(mockCallback).toHaveBeenCalledTimes(2)
  })

  it("should handle manual value updates", async () => {
    const initialData = { test: "initial" }
    const newData = { test: "updated" }
    const mockCallback = jest.fn().mockResolvedValue(initialData)
    const { result } = renderHook(() => useAsyncState(mockCallback, []))

    await new Promise((resolve) => setTimeout(resolve, 100))

    act(() => {
      result.current[1].set(newData)
    })

    expect(result.current[0]).toEqual(newData)
  })

  it("should not execute when callWithTruthyDeps is true and deps are falsy", async () => {
    const mockCallback = jest.fn().mockResolvedValue({ test: "data" })
    const { result } = renderHook(() =>
      useAsyncState(mockCallback, [null, undefined, false], {
        callWithTruthyDeps: true,
      })
    )

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(result.current[1].loading).toBe(false)
    expect(mockCallback).not.toHaveBeenCalled()
  })

  it("should handle cancellation of async operations", async () => {
    const mockCallback = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 200))
      )
    const { result, unmount } = renderHook(() =>
      useAsyncState(mockCallback, [])
    )

    expect(result.current[1].loading).toBe(true)
    unmount()
    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it("should handle function updaters", async () => {
    const initialValue = { count: 0 }
    const { result } = renderHook(() =>
      useAsyncState<typeof initialValue>(
        () => Promise.resolve({ count: 1 }),
        []
      )
    )

    await new Promise((resolve) => setTimeout(resolve, 100))

    act(() => {
      result.current[1].set((prev) => ({
        count: (prev as typeof initialValue).count + 1,
      }))
    })

    expect(result.current[0]).toEqual({ count: 2 })
  })
})
