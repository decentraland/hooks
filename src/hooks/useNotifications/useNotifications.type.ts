import type { ReactNode } from "react"

enum NotificationActiveTab {
  NEWEST = "newest",
  READ = "read",
}

type NotificationItem = {
  id: string
  type: string
  read: boolean
  [key: string]: unknown
}

type NotificationsClient = {
  getNotifications: () => Promise<NotificationItem[]>
  markNotificationsAsRead: (ids: string[]) => Promise<void>
}

type NotificationsState = {
  isLoading: boolean
  notifications: NotificationItem[]
}

type NotificationsUIState = {
  activeTab: string
  isOnboarding: boolean
  isOpen: boolean
}

type UseNotificationsOptions = {
  identity?: unknown
  isNotificationsEnabled: boolean
  notificationsUrl: string
  availableNotificationTypes?: string[]
  queryIntervalMs?: number
  initialActiveTab?: string
  onError?: (error: Error) => void
  renderProfile?: (address: string) => ReactNode
}

type UseNotificationsResult = {
  notifications: NotificationItem[]
  isLoading: boolean
  isModalOpen: boolean
  modalActiveTab: string
  isNotificationsOnboarding: boolean
  handleOnBegin: () => void
  handleNotificationsOpen: () => void
  handleOnChangeModalTab: (tab: string) => void
  handleRenderProfile: (address: string) => ReactNode
}

export { NotificationActiveTab }
export type {
  NotificationItem,
  NotificationsClient,
  NotificationsState,
  NotificationsUIState,
  UseNotificationsOptions,
  UseNotificationsResult,
}
