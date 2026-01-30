import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import {
  NotificationActiveTab,
  NotificationItem,
  NotificationsClient,
  NotificationsState,
  NotificationsUIState,
  UseNotificationsOptions,
  UseNotificationsResult,
} from "./useNotifications.type"
import { createNotificationsClient } from "../../clients/notifications"
import { getStorageItem, setStorageItem } from "../../utils/storage"

const DEFAULT_QUERY_INTERVAL_MS = 60000
const ONBOARDING_KEY = "dcl_notifications_onboarding"

const checkIsOnboarding = (): boolean => {
  const value = getStorageItem<boolean | null>(ONBOARDING_KEY, null)
  if (value === null) {
    setStorageItem(ONBOARDING_KEY, true)
    return true
  }
  return value
}

const setOnboardingDone = (): void => {
  setStorageItem(ONBOARDING_KEY, false)
}

/**
 * Hook to manage notification polling and modal state.
 * Uses Decentraland's notifications API.
 *
 * @param options - Configuration options for notifications polling and UI state.
 * @returns Notifications state, modal state, and handlers.
 */
const useNotifications = (
  options: UseNotificationsOptions
): UseNotificationsResult => {
  const {
    identity,
    isNotificationsEnabled,
    notificationsUrl,
    availableNotificationTypes,
    queryIntervalMs = DEFAULT_QUERY_INTERVAL_MS,
    initialActiveTab = NotificationActiveTab.NEWEST,
    onError,
    renderProfile,
  } = options

  const [notificationsState, setNotificationsState] =
    useState<NotificationsState>({
      isLoading: false,
      notifications: [],
    })
  const [uiState, setUiState] = useState<NotificationsUIState>(() => ({
    activeTab: initialActiveTab,
    isOnboarding: checkIsOnboarding(),
    isOpen: false,
  }))
  const [notificationsClient, setNotificationsClient] =
    useState<NotificationsClient | null>(null)

  const notificationsRef = useRef<NotificationItem[]>([])
  const notificationsClientRef = useRef<NotificationsClient | null>(null)

  useEffect(() => {
    notificationsRef.current = notificationsState.notifications
  }, [notificationsState.notifications])

  useEffect(() => {
    notificationsClientRef.current = notificationsClient
  }, [notificationsClient])

  const availableNotifications = useMemo(() => {
    if (!availableNotificationTypes) {
      return null
    }

    return new Set(availableNotificationTypes)
  }, [availableNotificationTypes])

  const fetchAndUpdateNotifications = useCallback(
    (client: NotificationsClient) => {
      return Promise.resolve()
        .then(() => client.getNotifications())
        .then((notificationsFetched) => {
          const filteredNotifications = availableNotifications
            ? notificationsFetched.filter((notification) =>
                availableNotifications.has(notification.type)
              )
            : notificationsFetched
          const hasReadNotifications = filteredNotifications.some(
            (notification) => notification.read
          )

          setNotificationsState((prevState) => ({
            ...prevState,
            isLoading: false,
            notifications: filteredNotifications,
          }))
          if (hasReadNotifications) {
            setOnboardingDone()
            setUiState((prevState) =>
              prevState.isOnboarding
                ? { ...prevState, isOnboarding: false }
                : prevState
            )
          }
        })
        .catch((error) => {
          const normalizedError =
            error instanceof Error ? error : new Error("Unknown error")
          console.error("Error fetching notifications:", normalizedError)
          if (onError) {
            onError(normalizedError)
          }
          setNotificationsState((prevState) => ({
            ...prevState,
            isLoading: false,
          }))
        })
    },
    [availableNotifications, onError]
  )

  useEffect(() => {
    if (!identity) {
      setNotificationsClient(null)
      return
    }

    if (!notificationsUrl) {
      const normalizedError = new Error("notificationsUrl is required")
      console.error("Notifications URL missing:", normalizedError)
      if (onError) {
        onError(normalizedError)
      }
      setNotificationsClient(null)
      return
    }

    const client = createNotificationsClient(identity, {
      url: notificationsUrl,
    })
    setNotificationsClient(client)

    if (!isNotificationsEnabled) {
      return
    }

    let cancelled = false
    setNotificationsState((prevState) => ({
      ...prevState,
      isLoading: true,
    }))

    const pollNotifications = () => {
      if (cancelled) {
        return
      }

      fetchAndUpdateNotifications(client)
    }

    pollNotifications()

    const intervalId = setInterval(pollNotifications, queryIntervalMs)

    return () => {
      cancelled = true
      clearInterval(intervalId)
    }
  }, [
    identity,
    isNotificationsEnabled,
    notificationsUrl,
    onError,
    fetchAndUpdateNotifications,
    queryIntervalMs,
  ])

  useEffect(() => {
    const isClosing = !uiState.isOpen
    if (!isClosing) {
      return
    }

    const currentNotifications = notificationsRef.current
    const currentClient = notificationsClientRef.current
    if (!currentClient) {
      return
    }

    const unreadNotificationsIds = currentNotifications
      .filter((notification) => !notification.read)
      .map((notification) => notification.id)

    if (unreadNotificationsIds.length === 0) {
      return
    }

    let cancelled = false
    Promise.resolve()
      .then(() => currentClient.markNotificationsAsRead(unreadNotificationsIds))
      .then(() => {
        if (cancelled) {
          return
        }

        setNotificationsState((prevState) => ({
          ...prevState,
          notifications: prevState.notifications.map((notification) => ({
            ...notification,
            read: unreadNotificationsIds.includes(notification.id)
              ? true
              : notification.read,
          })),
        }))
      })
      .catch((error) => {
        if (cancelled) {
          return
        }

        const normalizedError =
          error instanceof Error ? error : new Error("Unknown error")
        console.error("Error marking notifications as read:", normalizedError)
        if (onError) {
          onError(normalizedError)
        }
      })

    return () => {
      cancelled = true
    }
  }, [uiState.isOpen, onError])

  const handleOnBegin = useCallback(() => {
    setOnboardingDone()
    setUiState((prevState) => ({
      ...prevState,
      isOnboarding: false,
    }))
  }, [])

  const handleNotificationsOpen = useCallback(() => {
    setUiState((prevState) => ({
      ...prevState,
      isOpen: !prevState.isOpen,
    }))
  }, [])

  const handleOnChangeModalTab = useCallback((tab: string) => {
    setUiState((prevState) => ({
      ...prevState,
      activeTab: tab,
    }))
  }, [])

  const handleRenderProfile = useCallback(
    (address: string) => {
      if (!renderProfile) {
        return null
      }

      return renderProfile(address)
    },
    [renderProfile]
  )

  return {
    notifications: notificationsState.notifications,
    isLoading: notificationsState.isLoading,
    isModalOpen: uiState.isOpen,
    modalActiveTab: uiState.activeTab,
    isNotificationsOnboarding: uiState.isOnboarding,
    handleOnBegin,
    handleNotificationsOpen,
    handleOnChangeModalTab,
    handleRenderProfile,
  }
}

export { checkIsOnboarding, setOnboardingDone, useNotifications }
