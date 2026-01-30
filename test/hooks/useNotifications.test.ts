import { act, renderHook } from "@testing-library/react/pure"
import { createNotificationsClient } from "../../src/clients/notifications"
import { useNotifications } from "../../src/hooks/useNotifications"
import type {
  NotificationItem,
  UseNotificationsOptions,
  UseNotificationsResult,
} from "../../src/hooks/useNotifications"

jest.mock("../../src/clients/notifications", () => ({
  createNotificationsClient: jest.fn(),
}))

const mockCreateDCLNotificationsClient = createNotificationsClient as jest.Mock

type TestResult = UseNotificationsResult

const flushPromises = () => Promise.resolve()

const createDeferred = <T>() => {
  let resolve: (value: T) => void = () => undefined
  let reject: (reason?: unknown) => void = () => undefined
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise
    reject = rejectPromise
  })
  return { promise, resolve, reject }
}

describe("useNotifications", () => {
  describe("when the hook mounts", () => {
    let getNotifications: jest.Mock
    let markNotificationsAsRead: jest.Mock
    let options: UseNotificationsOptions
    let initialState: TestResult
    let renderResult: ReturnType<typeof renderHook>
    let result: { current: TestResult }

    beforeEach(() => {
      getNotifications = jest.fn().mockResolvedValue([])
      markNotificationsAsRead = jest.fn().mockResolvedValue(undefined)
      mockCreateDCLNotificationsClient.mockReturnValue({
        getNotifications,
        markNotificationsAsRead,
      })
      options = {
        identity: undefined,
        isNotificationsEnabled: false,
        notificationsUrl: "https://notifications.test.com",
        initialActiveTab: "newest",
      }
      renderResult = renderHook(() => useNotifications(options))
      result = renderResult.result as { current: TestResult }
      initialState = result.current
    })

    afterEach(() => {
      renderResult.unmount()
      jest.resetAllMocks()
    })

    it("should expose the initial state when the hook mounts", () => {
      expect(initialState).toMatchObject({
        isLoading: false,
        notifications: [],
        isModalOpen: false,
        modalActiveTab: "newest",
        isNotificationsOnboarding: true,
      })
    })
  })

  describe("when toggling the modal", () => {
    let getNotifications: jest.Mock
    let markNotificationsAsRead: jest.Mock
    let options: UseNotificationsOptions
    let renderResult: ReturnType<typeof renderHook>
    let result: { current: TestResult }
    let isModalOpen: boolean

    beforeEach(() => {
      getNotifications = jest.fn().mockResolvedValue([])
      markNotificationsAsRead = jest.fn().mockResolvedValue(undefined)
      mockCreateDCLNotificationsClient.mockReturnValue({
        getNotifications,
        markNotificationsAsRead,
      })
      options = {
        identity: undefined,
        isNotificationsEnabled: false,
        notificationsUrl: "https://notifications.test.com",
        initialActiveTab: "newest",
      }
      renderResult = renderHook(() => useNotifications(options))
      result = renderResult.result as { current: TestResult }
      act(() => {
        result.current.handleNotificationsOpen()
      })
      isModalOpen = result.current.isModalOpen
    })

    afterEach(() => {
      renderResult.unmount()
      jest.resetAllMocks()
    })

    it("should open the modal when the toggle handler is called", () => {
      expect(isModalOpen).toBe(true)
    })
  })

  describe("when changing the active tab", () => {
    let getNotifications: jest.Mock
    let markNotificationsAsRead: jest.Mock
    let options: UseNotificationsOptions
    let renderResult: ReturnType<typeof renderHook>
    let result: { current: TestResult }
    let activeTab: string

    beforeEach(() => {
      getNotifications = jest.fn().mockResolvedValue([])
      markNotificationsAsRead = jest.fn().mockResolvedValue(undefined)
      mockCreateDCLNotificationsClient.mockReturnValue({
        getNotifications,
        markNotificationsAsRead,
      })
      options = {
        identity: undefined,
        isNotificationsEnabled: false,
        notificationsUrl: "https://notifications.test.com",
        initialActiveTab: "newest",
      }
      renderResult = renderHook(() => useNotifications(options))
      result = renderResult.result as { current: TestResult }
      act(() => {
        result.current.handleOnChangeModalTab("unread")
      })
      activeTab = result.current.modalActiveTab
    })

    afterEach(() => {
      renderResult.unmount()
      jest.resetAllMocks()
    })

    it("should update the active tab when the tab handler is called", () => {
      expect(activeTab).toBe("unread")
    })
  })

  describe("when onboarding begins", () => {
    let getNotifications: jest.Mock
    let markNotificationsAsRead: jest.Mock
    let options: UseNotificationsOptions
    let renderResult: ReturnType<typeof renderHook>
    let result: { current: TestResult }
    let isOnboarding: boolean

    beforeEach(() => {
      getNotifications = jest.fn().mockResolvedValue([])
      markNotificationsAsRead = jest.fn().mockResolvedValue(undefined)
      mockCreateDCLNotificationsClient.mockReturnValue({
        getNotifications,
        markNotificationsAsRead,
      })
      options = {
        identity: undefined,
        isNotificationsEnabled: false,
        notificationsUrl: "https://notifications.test.com",
        initialActiveTab: "newest",
      }
      renderResult = renderHook(() => useNotifications(options))
      result = renderResult.result as { current: TestResult }
      act(() => {
        result.current.handleOnBegin()
      })
      isOnboarding = result.current.isNotificationsOnboarding
    })

    afterEach(() => {
      renderResult.unmount()
      jest.resetAllMocks()
    })

    it("should disable onboarding when the begin handler is called", () => {
      expect(isOnboarding).toBe(false)
    })
  })

  describe("when notifications are enabled", () => {
    let getNotifications: jest.Mock
    let markNotificationsAsRead: jest.Mock
    let options: UseNotificationsOptions
    let renderResult: ReturnType<typeof renderHook>
    let result: { current: TestResult }
    let notifications: NotificationItem[]

    beforeEach(async () => {
      notifications = [
        { id: "1", type: "welcome", read: false },
        { id: "2", type: "event", read: true },
      ]
      getNotifications = jest.fn().mockResolvedValue(notifications)
      markNotificationsAsRead = jest.fn().mockResolvedValue(undefined)
      mockCreateDCLNotificationsClient.mockReturnValue({
        getNotifications,
        markNotificationsAsRead,
      })
      options = {
        identity: { address: "0x1" },
        isNotificationsEnabled: true,
        notificationsUrl: "https://notifications.test.com",
        queryIntervalMs: 60000,
      }
      renderResult = renderHook(() => useNotifications(options))
      result = renderResult.result as { current: TestResult }
      await act(async () => {
        await flushPromises()
      })
    })

    afterEach(() => {
      renderResult.unmount()
      jest.resetAllMocks()
    })

    it("should request notifications when identity is provided", () => {
      expect(getNotifications).toHaveBeenCalledTimes(1)
    })

    it("should expose notifications when the client resolves", () => {
      expect(result.current.notifications).toEqual(notifications)
    })
  })

  describe("when read notifications are received", () => {
    let getNotifications: jest.Mock
    let markNotificationsAsRead: jest.Mock
    let options: UseNotificationsOptions
    let renderResult: ReturnType<typeof renderHook>
    let result: { current: TestResult }
    let isOnboarding: boolean

    beforeEach(async () => {
      getNotifications = jest
        .fn()
        .mockResolvedValue([{ id: "1", type: "welcome", read: true }])
      markNotificationsAsRead = jest.fn().mockResolvedValue(undefined)
      mockCreateDCLNotificationsClient.mockReturnValue({
        getNotifications,
        markNotificationsAsRead,
      })
      options = {
        identity: { address: "0x1" },
        isNotificationsEnabled: true,
        notificationsUrl: "https://notifications.test.com",
        queryIntervalMs: 60000,
      }
      renderResult = renderHook(() => useNotifications(options))
      result = renderResult.result as { current: TestResult }
      await act(async () => {
        await flushPromises()
      })
      isOnboarding = result.current.isNotificationsOnboarding
    })

    afterEach(() => {
      renderResult.unmount()
      jest.resetAllMocks()
    })

    it("should disable onboarding when there are read notifications", () => {
      expect(isOnboarding).toBe(false)
    })
  })

  describe("when notifications are loading", () => {
    let getNotifications: jest.Mock
    let markNotificationsAsRead: jest.Mock
    let options: UseNotificationsOptions
    let renderResult: ReturnType<typeof renderHook>
    let result: { current: TestResult }
    let isLoading: boolean
    let deferred: ReturnType<typeof createDeferred<NotificationItem[]>>

    beforeEach(async () => {
      deferred = createDeferred<NotificationItem[]>()
      getNotifications = jest.fn().mockReturnValue(deferred.promise)
      markNotificationsAsRead = jest.fn().mockResolvedValue(undefined)
      mockCreateDCLNotificationsClient.mockReturnValue({
        getNotifications,
        markNotificationsAsRead,
      })
      options = {
        identity: { address: "0x1" },
        isNotificationsEnabled: true,
        notificationsUrl: "https://notifications.test.com",
        queryIntervalMs: 60000,
      }
      renderResult = renderHook(() => useNotifications(options))
      result = renderResult.result as { current: TestResult }
      await act(async () => {
        await flushPromises()
      })
      isLoading = result.current.isLoading
      deferred.resolve([])
      await act(async () => {
        await flushPromises()
      })
    })

    afterEach(() => {
      renderResult.unmount()
      jest.resetAllMocks()
    })

    it("should set loading to true when the request is pending", () => {
      expect(isLoading).toBe(true)
    })
  })

  describe("when available notification types are provided", () => {
    let getNotifications: jest.Mock
    let markNotificationsAsRead: jest.Mock
    let options: UseNotificationsOptions
    let renderResult: ReturnType<typeof renderHook>
    let result: { current: TestResult }
    let filteredNotifications: NotificationItem[]
    let notifications: NotificationItem[]

    beforeEach(async () => {
      notifications = [
        { id: "1", type: "allowed", read: false },
        { id: "2", type: "blocked", read: true },
      ]
      getNotifications = jest.fn().mockResolvedValue(notifications)
      markNotificationsAsRead = jest.fn().mockResolvedValue(undefined)
      mockCreateDCLNotificationsClient.mockReturnValue({
        getNotifications,
        markNotificationsAsRead,
      })
      options = {
        identity: { address: "0x1" },
        isNotificationsEnabled: true,
        notificationsUrl: "https://notifications.test.com",
        availableNotificationTypes: ["allowed"],
        queryIntervalMs: 60000,
      }
      renderResult = renderHook(() => useNotifications(options))
      result = renderResult.result as { current: TestResult }
      await act(async () => {
        await flushPromises()
      })
      filteredNotifications = result.current.notifications
    })

    afterEach(() => {
      renderResult.unmount()
      jest.resetAllMocks()
    })

    it("should filter notifications when types are restricted", () => {
      expect(filteredNotifications).toEqual([notifications[0]])
    })
  })

  describe("when notification fetching fails", () => {
    let getNotifications: jest.Mock
    let markNotificationsAsRead: jest.Mock
    let options: UseNotificationsOptions
    let renderResult: ReturnType<typeof renderHook>
    let onError: jest.Mock
    let error: Error
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(async () => {
      error = new Error("Test error")
      onError = jest.fn()
      consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()
      getNotifications = jest.fn().mockRejectedValue(error)
      markNotificationsAsRead = jest.fn().mockResolvedValue(undefined)
      mockCreateDCLNotificationsClient.mockReturnValue({
        getNotifications,
        markNotificationsAsRead,
      })
      options = {
        identity: { address: "0x1" },
        isNotificationsEnabled: true,
        notificationsUrl: "https://notifications.test.com",
        onError,
        queryIntervalMs: 60000,
      }
      renderResult = renderHook(() => useNotifications(options))
      await act(async () => {
        await flushPromises()
      })
    })

    afterEach(() => {
      renderResult.unmount()
      consoleErrorSpy.mockRestore()
      jest.resetAllMocks()
    })

    it("should report errors when the client rejects", () => {
      expect(onError).toHaveBeenCalledWith(error)
    })
  })

  describe("when closing the modal with unread notifications", () => {
    let getNotifications: jest.Mock
    let markNotificationsAsRead: jest.Mock
    let options: UseNotificationsOptions
    let renderResult: ReturnType<typeof renderHook>
    let result: { current: TestResult }
    let notifications: NotificationItem[]

    beforeEach(async () => {
      notifications = [
        { id: "1", type: "welcome", read: false },
        { id: "2", type: "event", read: true },
      ]
      getNotifications = jest.fn().mockResolvedValue(notifications)
      markNotificationsAsRead = jest.fn().mockResolvedValue(undefined)
      mockCreateDCLNotificationsClient.mockReturnValue({
        getNotifications,
        markNotificationsAsRead,
      })
      options = {
        identity: { address: "0x1" },
        isNotificationsEnabled: true,
        notificationsUrl: "https://notifications.test.com",
        queryIntervalMs: 60000,
      }
      renderResult = renderHook(() => useNotifications(options))
      result = renderResult.result as { current: TestResult }
      await act(async () => {
        await flushPromises()
      })
      act(() => {
        result.current.handleNotificationsOpen()
      })
      act(() => {
        result.current.handleNotificationsOpen()
      })
      await act(async () => {
        await flushPromises()
      })
    })

    afterEach(() => {
      renderResult.unmount()
      jest.resetAllMocks()
    })

    it("should mark unread notifications when the modal closes", () => {
      expect(markNotificationsAsRead).toHaveBeenCalledWith(["1"])
    })
  })

  describe("when closing the modal updates notification reads", () => {
    let getNotifications: jest.Mock
    let markNotificationsAsRead: jest.Mock
    let options: UseNotificationsOptions
    let renderResult: ReturnType<typeof renderHook>
    let result: { current: TestResult }
    let updatedNotifications: NotificationItem[]

    beforeEach(async () => {
      getNotifications = jest.fn().mockResolvedValue([
        { id: "1", type: "welcome", read: false },
        { id: "2", type: "event", read: true },
      ])
      markNotificationsAsRead = jest.fn().mockResolvedValue(undefined)
      mockCreateDCLNotificationsClient.mockReturnValue({
        getNotifications,
        markNotificationsAsRead,
      })
      options = {
        identity: { address: "0x1" },
        isNotificationsEnabled: true,
        notificationsUrl: "https://notifications.test.com",
        queryIntervalMs: 60000,
      }
      renderResult = renderHook(() => useNotifications(options))
      result = renderResult.result as { current: TestResult }
      await act(async () => {
        await flushPromises()
      })
      act(() => {
        result.current.handleNotificationsOpen()
      })
      act(() => {
        result.current.handleNotificationsOpen()
      })
      await act(async () => {
        await flushPromises()
      })
      updatedNotifications = result.current.notifications
    })

    afterEach(() => {
      renderResult.unmount()
      jest.resetAllMocks()
    })

    it("should update notification reads when the modal closes", () => {
      expect(updatedNotifications).toEqual([
        { id: "1", type: "welcome", read: true },
        { id: "2", type: "event", read: true },
      ])
    })
  })

  describe("when notifications are disabled", () => {
    let getNotifications: jest.Mock
    let markNotificationsAsRead: jest.Mock
    let options: UseNotificationsOptions
    let renderResult: ReturnType<typeof renderHook>

    beforeEach(async () => {
      getNotifications = jest.fn().mockResolvedValue([])
      markNotificationsAsRead = jest.fn().mockResolvedValue(undefined)
      mockCreateDCLNotificationsClient.mockReturnValue({
        getNotifications,
        markNotificationsAsRead,
      })
      options = {
        identity: { address: "0x1" },
        isNotificationsEnabled: false,
        notificationsUrl: "https://notifications.test.com",
        queryIntervalMs: 60000,
      }
      renderResult = renderHook(() => useNotifications(options))
      await act(async () => {
        await flushPromises()
      })
    })

    afterEach(() => {
      renderResult.unmount()
      jest.resetAllMocks()
    })

    it("should skip fetching when notifications are disabled", () => {
      expect(getNotifications).not.toHaveBeenCalled()
    })
  })

  describe("when identity is missing", () => {
    let getNotifications: jest.Mock
    let markNotificationsAsRead: jest.Mock
    let options: UseNotificationsOptions
    let renderResult: ReturnType<typeof renderHook>

    beforeEach(async () => {
      getNotifications = jest.fn().mockResolvedValue([])
      markNotificationsAsRead = jest.fn().mockResolvedValue(undefined)
      mockCreateDCLNotificationsClient.mockReturnValue({
        getNotifications,
        markNotificationsAsRead,
      })
      options = {
        identity: undefined,
        isNotificationsEnabled: true,
        notificationsUrl: "https://notifications.test.com",
        queryIntervalMs: 60000,
      }
      renderResult = renderHook(() => useNotifications(options))
      await act(async () => {
        await flushPromises()
      })
    })

    afterEach(() => {
      renderResult.unmount()
      jest.resetAllMocks()
    })

    it("should not create a client when identity is missing", () => {
      expect(mockCreateDCLNotificationsClient).not.toHaveBeenCalled()
    })
  })

  describe("when the hook unmounts", () => {
    let getNotifications: jest.Mock
    let markNotificationsAsRead: jest.Mock
    let options: UseNotificationsOptions
    let renderResult: ReturnType<typeof renderHook>
    let pollCount: number

    beforeEach(async () => {
      jest.useFakeTimers()
      getNotifications = jest.fn().mockResolvedValue([])
      markNotificationsAsRead = jest.fn().mockResolvedValue(undefined)
      mockCreateDCLNotificationsClient.mockReturnValue({
        getNotifications,
        markNotificationsAsRead,
      })
      options = {
        identity: { address: "0x1" },
        isNotificationsEnabled: true,
        notificationsUrl: "https://notifications.test.com",
        queryIntervalMs: 1000,
      }
      renderResult = renderHook(() => useNotifications(options))
      await act(async () => {
        await flushPromises()
      })
      renderResult.unmount()
      act(() => {
        jest.advanceTimersByTime(2000)
      })
      pollCount = getNotifications.mock.calls.length
    })

    afterEach(() => {
      jest.useRealTimers()
      jest.resetAllMocks()
    })

    it("should stop polling when the hook unmounts", () => {
      expect(pollCount).toBe(1)
    })
  })

  describe("when renderProfile is not provided", () => {
    let getNotifications: jest.Mock
    let markNotificationsAsRead: jest.Mock
    let options: UseNotificationsOptions
    let renderResult: ReturnType<typeof renderHook>
    let result: { current: TestResult }
    let profileNode: unknown

    beforeEach(() => {
      getNotifications = jest.fn().mockResolvedValue([])
      markNotificationsAsRead = jest.fn().mockResolvedValue(undefined)
      mockCreateDCLNotificationsClient.mockReturnValue({
        getNotifications,
        markNotificationsAsRead,
      })
      options = {
        identity: undefined,
        isNotificationsEnabled: false,
        notificationsUrl: "https://notifications.test.com",
        initialActiveTab: "newest",
      }
      renderResult = renderHook(() => useNotifications(options))
      result = renderResult.result as { current: TestResult }
      profileNode = result.current.handleRenderProfile("0x1")
    })

    afterEach(() => {
      renderResult.unmount()
      jest.resetAllMocks()
    })

    it("should return null when no renderProfile is provided", () => {
      expect(profileNode).toBeNull()
    })
  })

  describe("when renderProfile is provided", () => {
    let getNotifications: jest.Mock
    let markNotificationsAsRead: jest.Mock
    let options: UseNotificationsOptions
    let renderResult: ReturnType<typeof renderHook>
    let result: { current: TestResult }
    let profileNode: string | null
    let renderProfile: jest.Mock

    beforeEach(() => {
      renderProfile = jest.fn().mockReturnValue("profile")
      getNotifications = jest.fn().mockResolvedValue([])
      markNotificationsAsRead = jest.fn().mockResolvedValue(undefined)
      mockCreateDCLNotificationsClient.mockReturnValue({
        getNotifications,
        markNotificationsAsRead,
      })
      options = {
        identity: undefined,
        isNotificationsEnabled: false,
        notificationsUrl: "https://notifications.test.com",
        initialActiveTab: "newest",
        renderProfile,
      }
      renderResult = renderHook(() => useNotifications(options))
      result = renderResult.result as { current: TestResult }
      profileNode = result.current.handleRenderProfile("0x1") as string | null
    })

    afterEach(() => {
      renderResult.unmount()
      jest.resetAllMocks()
    })

    it("should return the renderProfile result when a renderer is provided", () => {
      expect(profileNode).toBe("profile")
    })
  })
})
