import { act, renderHook } from "@testing-library/react/pure"
import { useAsyncTasks } from "../../hooks/useAsyncTasks"

jest.mock("test/__mocks__/sentry")

describe("useAsyncTasks", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should handle successful task execution", async () => {
    const mockCallback = jest.fn().mockResolvedValue(undefined)
    const { result } = renderHook(() => useAsyncTasks(mockCallback, []))

    act(() => {
      result.current[1]("task1")
    })

    expect(result.current[0]).toEqual(["task1"])

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(result.current[0]).toEqual([])
    expect(mockCallback).toHaveBeenCalledWith("task1")
  })

  it("should handle multiple tasks", async () => {
    const mockCallback = jest.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() => useAsyncTasks(mockCallback, []))

    // Add multiple tasks
    act(() => {
      result.current[1]("task1")
      result.current[1]("task2")
    })

    expect(result.current[0]).toEqual(["task1", "task2"])

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(result.current[0]).toEqual([])
    expect(mockCallback).toHaveBeenCalledWith("task1")
    expect(mockCallback).toHaveBeenCalledWith("task2")
  })

  it("should handle task errors", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()
    const mockError = new Error("Task failed")
    const mockCallback = jest.fn().mockRejectedValue(mockError)

    const { result } = renderHook(() => useAsyncTasks(mockCallback, []))

    act(() => {
      result.current[1]("task1")
    })

    expect(result.current[0]).toEqual(["task1"])

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(result.current[0]).toEqual([])
    expect(mockCallback).toHaveBeenCalledWith("task1")
    expect(consoleErrorSpy).toHaveBeenCalledWith(mockError)

    consoleErrorSpy.mockRestore()
  })

  it("should not add duplicate tasks", async () => {
    const mockCallback = jest.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() => useAsyncTasks(mockCallback, []))

    act(() => {
      result.current[1]("task1")
      result.current[1]("task1") // Trying to add same task
    })

    expect(result.current[0]).toEqual(["task1", "task1"])
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(mockCallback).toHaveBeenCalledTimes(2)
  })

  it("should handle task with extra parameters", async () => {
    const mockCallback = jest.fn().mockResolvedValue(undefined)

    const { result } = renderHook(() => useAsyncTasks(mockCallback, []))

    act(() => {
      result.current[1]("task1", "extra", 123)
    })

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(mockCallback).toHaveBeenCalledWith("task1", "extra", 123)
  })

  it("should re-create task function when dependencies change", async () => {
    const mockCallback = jest.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ dep }) => useAsyncTasks(mockCallback, [dep]),
      { initialProps: { dep: 1 } }
    )

    // Add task with initial dependency
    act(() => {
      result.current[1]("task1")
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(mockCallback).toHaveBeenCalledWith("task1")
    expect(mockCallback).toHaveBeenCalledTimes(1)

    // Change dependency and add new task
    rerender({ dep: 2 })

    act(() => {
      result.current[1]("task2")
    })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(mockCallback).toHaveBeenCalledWith("task2")
    expect(mockCallback).toHaveBeenCalledTimes(2)
  })

  it("should handle dependency changes during task execution", async () => {
    const mockCallback = jest.fn().mockResolvedValue(undefined)
    const { result, rerender } = renderHook(
      ({ dep }) => useAsyncTasks(mockCallback, [dep]),
      { initialProps: { dep: 1 } }
    )

    act(() => {
      result.current[1]("task1")
    })

    // Change dependency while task is running
    rerender({ dep: 2 })

    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(mockCallback).toHaveBeenCalledTimes(1)
    expect(result.current[0]).toEqual([])
  })

  it("should handle task cancellation on unmount", async () => {
    const mockCallback = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 200))
      )
    const { result, unmount } = renderHook(() =>
      useAsyncTasks(mockCallback, [])
    )

    act(() => {
      result.current[1]("task1")
    })

    expect(result.current[0]).toEqual(["task1"])
    unmount()

    await new Promise((resolve) => setTimeout(resolve, 300))
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })
})
