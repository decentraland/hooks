import { act, renderHook } from "@testing-library/react"
import { useAsyncTask } from "../../src/hooks/useAsyncTask"

jest.mock("../__mocks__/sentry")

describe("useAsyncTask", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should initialize with correct initial state", () => {
    const mockCallback = jest.fn()
    const { result } = renderHook(() => useAsyncTask(mockCallback, []))

    const [loading, callTask] = result.current

    expect(loading).toBe(false)
    expect(typeof callTask).toBe("function")
  })

  it("should handle successful async task execution", async () => {
    const mockData = { test: "data" }
    const mockCallback = jest.fn().mockResolvedValue(mockData)
    const { result } = renderHook(() => useAsyncTask(mockCallback, []))

    const [initialLoading, callTask] = result.current
    expect(initialLoading).toBe(false)

    // Llamamos a la tarea y esperamos a que el estado se actualice
    await act(async () => {
      callTask("arg1", "arg2")
      // Esperamos a que el estado se actualice
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Verificamos que el callback fue llamado
    expect(mockCallback).toHaveBeenCalledWith("arg1", "arg2")

    // Esperamos a que la promesa se resuelva
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // Verificamos el estado final
    expect(result.current[0]).toBe(false)
  })

  it("should handle task execution errors", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()
    const mockError = new Error("Test error")
    const mockCallback = jest.fn().mockRejectedValue(mockError)
    const { result } = renderHook(() => useAsyncTask(mockCallback, []))

    // Llamamos a la tarea y esperamos a que el estado se actualice
    await act(async () => {
      result.current[1]("arg1")
      // Esperamos a que el estado se actualice
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Verificamos que el callback fue llamado
    expect(mockCallback).toHaveBeenCalledWith("arg1")

    // Esperamos a que la promesa se rechace
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // Verificamos el estado final y el manejo del error
    expect(result.current[0]).toBe(false)
    expect(consoleErrorSpy).toHaveBeenCalledWith(mockError)

    consoleErrorSpy.mockRestore()
  })

  it("should handle task cancellation on unmount", async () => {
    const mockCallback = jest
      .fn()
      .mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 200))
      )
    const { result, unmount } = renderHook(() => useAsyncTask(mockCallback, []))

    // Llamamos a la tarea y esperamos a que el estado se actualice
    await act(async () => {
      result.current[1]("arg1")
      // Esperamos a que el estado se actualice
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Verificamos que el callback fue llamado
    expect(mockCallback).toHaveBeenCalledWith("arg1")

    // Desmontamos el componente
    unmount()

    // Esperamos a que la promesa se resuelva
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 300))
    })

    // Verificamos que el callback solo fue llamado una vez
    expect(mockCallback).toHaveBeenCalledTimes(1)
  })

  it("should maintain stable callback reference", () => {
    const mockCallback = jest.fn()
    const { result, rerender } = renderHook(() =>
      useAsyncTask(mockCallback, [])
    )

    const [, initialCallTask] = result.current
    rerender()
    const [, newCallTask] = result.current

    expect(newCallTask).toBe(initialCallTask)
  })

  it("should handle multiple task calls", async () => {
    const mockCallback = jest.fn().mockResolvedValue({})
    const { result } = renderHook(() => useAsyncTask(mockCallback, []))

    // Primera llamada
    await act(async () => {
      result.current[1]("first")
      // Esperamos a que el estado se actualice
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Verificamos que el callback fue llamado
    expect(mockCallback).toHaveBeenCalledWith("first")

    // Esperamos a que la promesa se resuelva
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // Segunda llamada
    await act(async () => {
      result.current[1]("second")
      // Esperamos a que el estado se actualice
      await new Promise((resolve) => setTimeout(resolve, 0))
    })

    // Verificamos que el callback fue llamado
    expect(mockCallback).toHaveBeenCalledWith("second")

    // Esperamos a que la promesa se resuelva
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 100))
    })

    // Verificamos el estado final y el número de llamadas
    expect(result.current[0]).toBe(false)
    expect(mockCallback).toHaveBeenCalledTimes(2)
  })
})
