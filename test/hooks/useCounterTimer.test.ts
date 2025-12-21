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

  describe("when initial value is 5 and target is 0", () => {
    describe("when counting down", () => {
      it("should count down from 5 to 0", () => {
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

      it("should land exactly on target", () => {
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
  })

  describe("when initial value is 10 and target is 5", () => {
    describe("when counting down", () => {
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
  })

  describe("when initial value is 0 and target is 5", () => {
    describe("when counting up", () => {
      it("should count up to target", () => {
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
    })
  })

  describe("when initial value equals target", () => {
    describe("when starting", () => {
      it("should not start and call onComplete immediately", () => {
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
    })
  })

  describe("when using start, stop, and reset", () => {
    describe("when stop is called", () => {
      it("should pause counting", () => {
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
    })

    describe("when reset is called", () => {
      it("should reset to initial value and stop", () => {
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

      it("should reset to custom value and stop", () => {
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
    })

    describe("when start is called with a value", () => {
      it("should start from new value", () => {
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
    })
  })

  describe("when onComplete callback is provided", () => {
    describe("when counting down", () => {
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
    })

    describe("when counting up", () => {
      it("should call onComplete when reaching target", () => {
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
    })

    describe("when callback changes", () => {
      it("should use updated callback", () => {
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
  })

  describe("when custom interval is provided", () => {
    describe("when interval is 500ms", () => {
      it("should tick every 500ms", () => {
        const { result } = renderHook(() =>
          useCounterTimer(5, { interval: 500 })
        )

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
  })

  describe("cleanup", () => {
    describe("when unmounting", () => {
      it("should clear interval", () => {
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
    })

    describe("when stopping interval", () => {
      it("should clear interval", () => {
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
})
