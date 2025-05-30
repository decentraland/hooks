/**
 * Tests for useShare hook
 * @module useShare.test
 */

import { act, renderHook } from "@testing-library/react"
import { useShare } from "../../src/hooks/useShare"

describe("useShare", () => {
  const mockShareData = {
    title: "Test Title",
    text: "Test Text",
    url: "https://test.com",
    thumbnail: "https://test.com/thumb.jpg",
  }

  let consoleErrorSpy: jest.SpyInstance

  beforeEach(() => {
    jest.clearAllMocks()
    consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()
    Object.defineProperty(global, "navigator", {
      value: undefined,
      writable: true,
    })
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe("when initializing the hook", () => {
    it("should return initial state when Web Share API is not supported", () => {
      const { result } = renderHook(() => useShare())
      const [, state] = result.current

      expect(state).toEqual({
        data: null,
        isSupported: false,
        isSharing: false,
        error: null,
        close: expect.any(Function),
      })
    })

    it("should return initial state when Web Share API is supported", () => {
      Object.defineProperty(global, "navigator", {
        value: { share: jest.fn() },
        writable: true,
      })

      const { result } = renderHook(() => useShare())
      const [, state] = result.current

      expect(state).toEqual({
        data: null,
        isSupported: true,
        isSharing: false,
        error: null,
        close: expect.any(Function),
      })
    })
  })

  describe("when sharing content", () => {
    describe("when Web Share API is not supported", () => {
      it("should update state with share data without calling navigator.share", async () => {
        const { result } = renderHook(() => useShare())
        const [share] = result.current

        await act(async () => {
          await share(mockShareData)
        })

        const [, state] = result.current
        expect(state.data).toEqual(mockShareData)
        expect(state.isSharing).toBe(false)
        expect(state.error).toBe(null)
      })
    })

    describe("when Web Share API is supported", () => {
      it("should call navigator.share and update state on success", async () => {
        const mockShare = jest.fn().mockResolvedValue(undefined)
        Object.defineProperty(global, "navigator", {
          value: { share: mockShare },
          writable: true,
        })

        const { result } = renderHook(() => useShare())
        const [share] = result.current

        await act(async () => {
          await share(mockShareData)
        })

        expect(mockShare).toHaveBeenCalledWith(mockShareData)
        expect(mockShare).toHaveBeenCalledTimes(1)

        const [, state] = result.current
        expect(state.data).toBe(null)
        expect(state.isSharing).toBe(false)
        expect(state.error).toBe(null)
      })

      it("should handle share errors and update state accordingly", async () => {
        const mockError = new Error("Test error")
        const mockShare = jest.fn().mockRejectedValue(mockError)
        Object.defineProperty(global, "navigator", {
          value: { share: mockShare },
          writable: true,
        })

        const { result } = renderHook(() => useShare())
        const [share] = result.current

        try {
          await act(async () => {
            await share(mockShareData)
          })
        } catch (error) {
          expect(consoleErrorSpy).toHaveBeenCalled()
        }

        expect(mockShare).toHaveBeenCalledWith(mockShareData)
        expect(mockShare).toHaveBeenCalledTimes(1)

        const [, state] = result.current
        expect(state.error).toEqual(mockError)
        expect(state.data).toEqual(mockShareData)
        expect(state.isSharing).toBe(false)
      })
    })
  })

  describe("when closing share dialog", () => {
    it("should clear share data and error state", async () => {
      const { result } = renderHook(() => useShare())
      const [share, state] = result.current

      // Primero compartimos para tener datos
      await act(async () => {
        await share(mockShareData)
      })

      // Luego cerramos
      await act(async () => {
        state.close()
      })

      const [, newState] = result.current
      expect(newState.data).toBe(null)
      expect(newState.error).toBe(null)
    })
  })

  describe("when component re-renders", () => {
    it("should maintain stable reference for shared state", () => {
      const { result, rerender } = renderHook(() => useShare())
      const [, initialState] = result.current

      rerender()
      const [, newState] = result.current

      expect(newState).toBe(initialState)
    })

    it("should maintain stable reference for share function", () => {
      const { result, rerender } = renderHook(() => useShare())
      const [initialShare] = result.current

      rerender()
      const [newShare] = result.current

      expect(newShare).toBe(initialShare)
    })
  })
})
