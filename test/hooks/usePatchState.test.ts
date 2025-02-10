import { act, renderHook } from "@testing-library/react/pure"
import { usePatchState } from "../../src/hooks/usePatchState"

describe("usePatchState", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should initialize with default state", () => {
    const { result } = renderHook(() => usePatchState({ count: 0 }))
    expect(result.current[0]).toEqual({ count: 0 })
  })

  it("should update state partially", () => {
    const { result } = renderHook(() =>
      usePatchState({ count: 0, text: "hello" })
    )

    act(() => {
      result.current[1]({ count: 1 })
    })

    expect(result.current[0]).toEqual({ count: 1, text: "hello" })
  })

  it("should handle multiple updates", () => {
    const { result } = renderHook(() =>
      usePatchState({ count: 0, text: "hello", flag: true })
    )

    act(() => {
      result.current[1]({ count: 1 })
      result.current[1]({ text: "world" })
    })

    expect(result.current[0]).toEqual({ count: 1, text: "world", flag: true })
  })

  it("should handle nested objects", () => {
    const { result } = renderHook(() =>
      usePatchState({ nested: { count: 0, text: "hello" } })
    )

    act(() => {
      result.current[1]({ nested: { count: 1, text: "hello" } })
    })

    expect(result.current[0]).toEqual({ nested: { count: 1, text: "hello" } })
  })
})
