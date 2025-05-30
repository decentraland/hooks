import { act, renderHook } from "@testing-library/react"
import { usePatchState } from "../../src/hooks/usePatchState"

describe("usePatchState", () => {
  it("should initialize with default state", () => {
    const initialState = { count: 0 }
    const { result } = renderHook(() => usePatchState(initialState))

    expect(result.current[0]).toEqual(initialState)
    expect(result.current[1]).toBeInstanceOf(Function)
  })

  it("should update state partially while preserving other fields", () => {
    const initialState = { count: 0, text: "hello", flag: true }
    const { result } = renderHook(() => usePatchState(initialState))

    act(() => {
      result.current[1]({ count: 1 })
    })

    expect(result.current[0]).toEqual({
      ...initialState,
      count: 1,
    })
  })

  it("should handle multiple sequential updates", () => {
    const initialState = { count: 0, text: "hello", flag: true }
    const { result } = renderHook(() => usePatchState(initialState))

    act(() => {
      result.current[1]({ count: 1 })
    })

    expect(result.current[0]).toEqual({
      ...initialState,
      count: 1,
    })

    act(() => {
      result.current[1]({ text: "world" })
    })

    expect(result.current[0]).toEqual({
      ...initialState,
      count: 1,
      text: "world",
    })
  })

  it("should handle nested object updates", () => {
    const initialState = {
      nested: { count: 0, text: "hello" },
      other: { value: true },
    }
    const { result } = renderHook(() => usePatchState(initialState))

    act(() => {
      result.current[1]({
        nested: { count: 1, text: "world" },
      })
    })

    expect(result.current[0]).toEqual({
      nested: { count: 1, text: "world" },
      other: { value: true },
    })
  })

  it("should handle function updaters", () => {
    const initialState = { count: 0 }
    const { result } = renderHook(() => usePatchState(initialState))

    act(() => {
      result.current[1]({ count: result.current[0].count + 1 })
    })

    expect(result.current[0]).toEqual({ count: 1 })
  })

  it("should maintain stable setState reference across renders", () => {
    const { result, rerender } = renderHook(() => usePatchState({ count: 0 }))

    const [, initialSetState] = result.current
    rerender()
    const [, newSetState] = result.current

    expect(newSetState).toBe(initialSetState)
  })

  it("should handle empty updates", () => {
    const initialState = { count: 0, text: "hello" }
    const { result } = renderHook(() => usePatchState(initialState))

    act(() => {
      result.current[1]({})
    })

    expect(result.current[0]).toEqual(initialState)
  })

  it("should handle updates with undefined values", () => {
    const initialState = { count: 0, text: "hello" }
    const { result } = renderHook(() => usePatchState(initialState))

    act(() => {
      result.current[1]({ count: undefined })
    })

    expect(result.current[0]).toEqual({
      ...initialState,
      count: undefined,
    })
  })
})
