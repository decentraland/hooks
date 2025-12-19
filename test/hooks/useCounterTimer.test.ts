import { act, renderHook } from "@testing-library/react/pure"
import { useCounterTimer } from "../../src/hooks/useCounterTimer"

jest.mock("../__mocks__/sentry")
jest.useFakeTimers()

describe("useCounterTimer", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.clearAllTimers()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
  })

  describe("counting down", () => {
    it("should count down from initial value to 0 by default", () => {
      const { result } = renderHook(() => useCounterTimer(5))

      expect(result.current.count).toBe(5)
      expect(result.current.isActive).toBe(false)

      act(() => {
        result.current.start()
      })

      expect(result.current.isActive).toBe(true)

      act(() => {
        jest.advanceTimersByTime(1000)
      })
      expect(result.current.count).toBe(4)

      act(() => {
        jest.advanceTimersByTime(4000)
      })
      expect(result.current.count).toBe(0)
      expect(result.current.isActive).toBe(false)
    })

    it("should count down to custom target", () => {
      const { result } = renderHook(() => useCounterTimer(10, { target: 5 }))

      act(() => {
        result.current.start()
      })

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(result.current.count).toBe(5)
      expect(result.current.isActive).toBe(false)
    })
  })

  describe("counting up", () => {
    it("should count up when target is greater than initial value", () => {
      const { result } = renderHook(() => useCounterTimer(0, { target: 5 }))

      act(() => {
        result.current.start()
      })

      expect(result.current.isActive).toBe(true)

      act(() => {
        jest.advanceTimersByTime(1000)
      })
      expect(result.current.count).toBe(1)

      act(() => {
        jest.advanceTimersByTime(4000)
      })
      expect(result.current.count).toBe(5)
      expect(result.current.isActive).toBe(false)
    })

    it("should count up from 50 to 100", () => {
      const { result } = renderHook(() => useCounterTimer(50, { target: 100 }))

      act(() => {
        result.current.start()
      })

      act(() => {
        jest.advanceTimersByTime(50000)
      })

      expect(result.current.count).toBe(100)
      expect(result.current.isActive).toBe(false)
    })
  })

  describe("start, stop, reset", () => {
    it("should stop counting when stop is called", () => {
      const { result } = renderHook(() => useCounterTimer(10))

      act(() => {
        result.current.start()
      })

      act(() => {
        jest.advanceTimersByTime(2000)
      })
      expect(result.current.count).toBe(8)

      act(() => {
        result.current.stop()
      })
      expect(result.current.isActive).toBe(false)

      act(() => {
        jest.advanceTimersByTime(5000)
      })
      expect(result.current.count).toBe(8)
    })

    it("should reset to initial value", () => {
      const { result } = renderHook(() => useCounterTimer(10))

      act(() => {
        result.current.start()
      })

      act(() => {
        jest.advanceTimersByTime(3000)
      })
      expect(result.current.count).toBe(7)

      act(() => {
        result.current.reset()
      })

      expect(result.current.count).toBe(10)
      expect(result.current.isActive).toBe(false)
    })

    it("should reset to custom value", () => {
      const { result } = renderHook(() => useCounterTimer(10))

      act(() => {
        result.current.start()
      })

      act(() => {
        jest.advanceTimersByTime(3000)
      })

      act(() => {
        result.current.reset(20)
      })

      expect(result.current.count).toBe(20)
      expect(result.current.isActive).toBe(false)
    })

    it("should start from a new value", () => {
      const { result } = renderHook(() => useCounterTimer(10))

      act(() => {
        result.current.start(5)
      })

      expect(result.current.count).toBe(5)
      expect(result.current.isActive).toBe(true)

      act(() => {
        jest.advanceTimersByTime(1000)
      })
      expect(result.current.count).toBe(4)
    })
  })

  describe("onComplete callback", () => {
    it("should call onComplete when reaching target", () => {
      const onComplete = jest.fn()
      const { result } = renderHook(() =>
        useCounterTimer(5, { target: 0, onComplete })
      )

      act(() => {
        result.current.start()
      })

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(result.current.count).toBe(0)
      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it("should call onComplete when counting up reaches target", () => {
      const onComplete = jest.fn()
      const { result } = renderHook(() =>
        useCounterTimer(0, { target: 3, onComplete })
      )

      act(() => {
        result.current.start()
      })

      act(() => {
        jest.advanceTimersByTime(3000)
      })

      expect(result.current.count).toBe(3)
      expect(onComplete).toHaveBeenCalledTimes(1)
    })

    it("should handle onComplete callback updates", () => {
      const onComplete1 = jest.fn()
      const onComplete2 = jest.fn()
      const { result, rerender } = renderHook(
        ({ callback }) => useCounterTimer(3, { onComplete: callback }),
        { initialProps: { callback: onComplete1 } }
      )

      act(() => {
        result.current.start()
      })

      rerender({ callback: onComplete2 })

      act(() => {
        jest.advanceTimersByTime(3000)
      })

      expect(onComplete1).not.toHaveBeenCalled()
      expect(onComplete2).toHaveBeenCalledTimes(1)
    })
  })

  describe("custom interval", () => {
    it("should use custom interval", () => {
      const { result } = renderHook(() => useCounterTimer(5, { interval: 500 }))

      act(() => {
        result.current.start()
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })
      expect(result.current.count).toBe(4)

      act(() => {
        jest.advanceTimersByTime(500)
      })
      expect(result.current.count).toBe(3)
    })
  })

  describe("edge cases", () => {
    it("should not start if already at target", () => {
      const onComplete = jest.fn()
      const { result } = renderHook(() =>
        useCounterTimer(0, { target: 0, onComplete })
      )

      act(() => {
        result.current.start()
      })

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(result.current.count).toBe(0)
      expect(onComplete).toHaveBeenCalledTimes(1)
      expect(result.current.isActive).toBe(false)
    })

    it("should handle starting with target value", () => {
      const onComplete = jest.fn()
      const { result } = renderHook(() =>
        useCounterTimer(10, { target: 5, onComplete })
      )

      act(() => {
        result.current.start(5)
      })

      act(() => {
        jest.advanceTimersByTime(1000)
      })

      expect(result.current.count).toBe(5)
      expect(onComplete).toHaveBeenCalledTimes(1)
      expect(result.current.isActive).toBe(false)
    })

    it("should land exactly on target even with large steps", () => {
      const { result } = renderHook(() => useCounterTimer(10, { target: 5 }))

      act(() => {
        result.current.start()
      })

      act(() => {
        jest.advanceTimersByTime(5000)
      })

      expect(result.current.count).toBe(5)
    })
  })

  describe("cleanup", () => {
    it("should clear interval on unmount", () => {
      const { result, unmount } = renderHook(() => useCounterTimer(10))

      act(() => {
        result.current.start()
      })

      expect(result.current.isActive).toBe(true)

      unmount()

      act(() => {
        jest.advanceTimersByTime(5000)
      })
    })

    it("should clear interval when stopped", () => {
      const clearIntervalSpy = jest.spyOn(global, "clearInterval")
      const { result } = renderHook(() => useCounterTimer(5))

      act(() => {
        result.current.start()
      })

      act(() => {
        result.current.stop()
      })

      expect(clearIntervalSpy).toHaveBeenCalled()

      clearIntervalSpy.mockRestore()
    })
  })
})
