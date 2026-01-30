import {
  type AuthIdentity,
  signedFetchFactory,
} from "decentraland-crypto-fetch"
import type {
  NotificationItem,
  NotificationsClient,
} from "../../hooks/useNotifications"

const DEFAULT_NOTIFICATIONS_LIMIT = 50

type NotificationsClientOptions = {
  url: string
  limit?: number
}

type NotificationResponse = NotificationItem & {
  timestamp: number | string
}

const parseNotification = (
  notification: NotificationResponse
): NotificationItem => ({
  ...notification,
  timestamp: Number(notification.timestamp),
})

/**
 * Creates a Decentraland notifications client.
 *
 * @param identity - The AuthIdentity for signing requests
 * @param options - Configuration with required url
 * @returns A NotificationsClient instance
 */
const createNotificationsClient = (
  identity: unknown,
  options: NotificationsClientOptions
): NotificationsClient => {
  const authIdentity = identity as AuthIdentity
  const { url: baseUrl, limit = DEFAULT_NOTIFICATIONS_LIMIT } = options
  const signedFetch = signedFetchFactory()

  const getNotifications = async (): Promise<NotificationItem[]> => {
    const params = new URLSearchParams()
    params.append("limit", String(limit))

    const url = `${baseUrl}/notifications?${params.toString()}`
    const response = await signedFetch(url, {
      identity: authIdentity,
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch notifications: ${response.status}`)
    }

    const data = await response.json()
    const notifications: NotificationResponse[] = data.notifications ?? []

    return notifications.map(parseNotification)
  }

  const markNotificationsAsRead = async (ids: string[]): Promise<void> => {
    const url = `${baseUrl}/notifications/read`
    const response = await signedFetch(url, {
      method: "PUT",
      identity: authIdentity,
      body: JSON.stringify({ notificationIds: ids }),
      headers: {
        "Content-Type": "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(
        `Failed to mark notifications as read: ${response.status}`
      )
    }
  }

  return {
    getNotifications,
    markNotificationsAsRead,
  }
}

export { createNotificationsClient }
export type { NotificationsClientOptions }
