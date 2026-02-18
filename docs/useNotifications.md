# Notifications (useNotifications + createNotificationsClient)

Manages Decentraland notification polling, modal UI state, onboarding flow, and mark-as-read functionality.

## Import

```typescript
import {
  useNotifications,
  checkIsOnboarding,
  setOnboardingDone,
  createNotificationsClient,
} from "@dcl/hooks"
```

## Peer Dependency

Requires `decentraland-crypto-fetch@^2.0.1` for signed API requests.

## Types

```typescript
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

type UseNotificationsOptions = {
  identity?: unknown               // AuthIdentity from decentraland-crypto-fetch
  isNotificationsEnabled: boolean
  notificationsUrl: string
  availableNotificationTypes?: string[]
  queryIntervalMs?: number         // default: 60000
  initialActiveTab?: string        // default: "newest"
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

enum NotificationActiveTab {
  NEWEST = "newest",
  READ = "read",
}
```

---

## useNotifications

### Signature

```typescript
function useNotifications(options: UseNotificationsOptions): UseNotificationsResult
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options.identity` | `unknown` | `undefined` | AuthIdentity for signed API requests |
| `options.isNotificationsEnabled` | `boolean` | -- | Enable/disable polling |
| `options.notificationsUrl` | `string` | -- | API base URL (e.g., `https://notifications.decentraland.org`) |
| `options.availableNotificationTypes` | `string[]` | `undefined` | Filter notifications by type |
| `options.queryIntervalMs` | `number` | `60000` | Polling interval in ms |
| `options.initialActiveTab` | `string` | `"newest"` | Initial modal tab |
| `options.onError` | `(error: Error) => void` | `undefined` | Error callback |
| `options.renderProfile` | `(address: string) => ReactNode` | `undefined` | Custom profile renderer |

### Return Value

| Field | Type | Description |
|-------|------|-------------|
| `notifications` | `NotificationItem[]` | List of notifications |
| `isLoading` | `boolean` | True during fetch |
| `isModalOpen` | `boolean` | Modal open state |
| `modalActiveTab` | `string` | Current tab ("newest" or "read") |
| `isNotificationsOnboarding` | `boolean` | True if user hasn't completed onboarding |
| `handleOnBegin` | `() => void` | Mark onboarding as complete |
| `handleNotificationsOpen` | `() => void` | Toggle modal open/close |
| `handleOnChangeModalTab` | `(tab: string) => void` | Switch modal tab |
| `handleRenderProfile` | `(address: string) => ReactNode` | Render a profile (delegates to `renderProfile` option) |

### Examples

#### Basic usage

```typescript
import { useNotifications } from "@dcl/hooks"

function NotificationsBell({ identity }: { identity: AuthIdentity }) {
  const {
    notifications,
    isLoading,
    isModalOpen,
    isNotificationsOnboarding,
    handleNotificationsOpen,
    handleOnBegin,
  } = useNotifications({
    identity,
    isNotificationsEnabled: !!identity,
    notificationsUrl: "https://notifications.decentraland.org",
  })

  if (isNotificationsOnboarding) {
    return (
      <div>
        <h2>Welcome to Notifications!</h2>
        <button onClick={handleOnBegin}>Get Started</button>
      </div>
    )
  }

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <div>
      <button onClick={handleNotificationsOpen}>
        Notifications ({unreadCount})
      </button>
      {isModalOpen && (
        <ul>
          {notifications.map((n) => (
            <li key={n.id}>
              {n.type} - {n.read ? "Read" : "Unread"}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

#### With type filtering

```typescript
const { notifications } = useNotifications({
  identity,
  isNotificationsEnabled: !!identity,
  notificationsUrl: "https://notifications.decentraland.org",
  availableNotificationTypes: ["bid", "sale", "royalties"],
})
```

#### With custom polling and error handling

```typescript
const { notifications } = useNotifications({
  identity,
  isNotificationsEnabled: !!identity,
  notificationsUrl: "https://notifications.decentraland.org",
  queryIntervalMs: 30000,
  onError: (error) => {
    console.error("Notification error:", error)
    Sentry.captureException(error)
  },
})
```

### Behavior

- Polls the notifications API at the configured interval when enabled.
- Automatically marks unread notifications as read when the modal closes.
- Onboarding state is persisted in localStorage under `dcl_notifications_onboarding`.
- If existing notifications include read ones, onboarding is automatically marked as done.

---

## createNotificationsClient

Factory for the Decentraland notifications API client. Used internally by `useNotifications`, but available for standalone use.

### Signature

```typescript
function createNotificationsClient(
  identity: unknown,
  options: { url: string; limit?: number }
): NotificationsClient
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `identity` | `unknown` | -- | AuthIdentity for signed requests |
| `options.url` | `string` | -- | API base URL |
| `options.limit` | `number` | `50` | Max notifications to fetch |

### Example

```typescript
import { createNotificationsClient } from "@dcl/hooks"

const client = createNotificationsClient(identity, {
  url: "https://notifications.decentraland.org",
  limit: 100,
})

const notifications = await client.getNotifications()
await client.markNotificationsAsRead(["id-1", "id-2"])
```

---

## Helper Functions

### checkIsOnboarding

Checks localStorage for onboarding state. On first call, initializes to `true`.

```typescript
function checkIsOnboarding(): boolean
```

### setOnboardingDone

Marks onboarding as complete in localStorage.

```typescript
function setOnboardingDone(): void
```

## Common Patterns

- Use `isNotificationsEnabled: !!identity` to only poll when the user is authenticated.
- Use `onError` to report failures to your error tracking service.
- Use `availableNotificationTypes` to filter notifications relevant to your dApp.

## Pitfalls

- Requires `decentraland-crypto-fetch` as a peer dependency for signed API requests.
- `notificationsUrl` is required -- the hook calls `onError` if it's missing.
- Modal close triggers mark-as-read for all unread notifications.
- Polling stops when `isNotificationsEnabled` is false or `identity` is null.
