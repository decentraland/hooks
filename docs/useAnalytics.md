# Analytics (AnalyticsProvider + useAnalytics + usePageTracking)

Segment-based analytics tracking for Decentraland dApps. Includes a context provider, an event tracking hook, and a page view tracking hook.

## Import

```typescript
import {
  AnalyticsProvider,
  useAnalytics,
  usePageTracking,
} from "@dcl/hooks"
```

## AnalyticsProvider

Context provider that initializes Segment analytics. Wrap your app with this component.

### Props

```typescript
type AnalyticsProviderProps = {
  writeKey: string                    // Segment write key (required)
  userId?: string                     // Identify user on init
  traits?: Record<string, unknown>    // User traits for identify
  children: React.ReactNode
}
```

### Example

```typescript
function App() {
  return (
    <AnalyticsProvider
      writeKey="YOUR_SEGMENT_WRITE_KEY"
      userId="user-123"
      traits={{ name: "John Doe", email: "john@example.com" }}
    >
      <Main />
    </AnalyticsProvider>
  )
}
```

### Behavior

- Dynamically imports `@segment/analytics-next` on mount.
- Skips initialization when the user agent is a bot (detected via `isbot`).
- If `userId` is provided, calls `identify()` after initialization.
- Returns no-op functions until Segment finishes loading.

---

## useAnalytics

Access analytics tracking functions. Must be used inside `AnalyticsProvider`.

### Signature

```typescript
function useAnalytics(): {
  isInitialized: boolean
  track: (event: string, payload?: EventProperties) => void
  identify: (userId: string, traits?: Record<string, unknown>) => void
  page: (name: string, props?: Record<string, unknown>) => void
}
```

### Examples

#### Track an event

```typescript
function MyComponent() {
  const analytics = useAnalytics()

  const handleClick = () => {
    analytics.track("Button Clicked", {
      buttonId: "submit",
      timestamp: new Date().toISOString(),
    })
  }

  return <button onClick={handleClick}>Submit</button>
}
```

#### Identify a user

```typescript
const analytics = useAnalytics()

analytics.identify("user-123", {
  name: "John Doe",
  email: "john@example.com",
})
```

#### Track a page view with custom properties

```typescript
function MyPage() {
  const analytics = useAnalytics()

  useEffect(() => {
    if (analytics.isInitialized) {
      analytics.page("My Page", {
        category: "Content",
        section: "Main",
      })
    }
  }, [analytics])

  return <div>Page Content</div>
}
```

---

## usePageTracking

Automatically tracks page views when the provided path changes.

### Signature

```typescript
function usePageTracking(path: string): void
```

### Example

```typescript
import { usePageTracking } from "@dcl/hooks"
import { useLocation } from "react-router-dom"

function PageTracker() {
  const location = useLocation()
  usePageTracking(location.pathname)
  return null
}
```

Or inside a page component:

```typescript
function MyPage() {
  const location = useLocation()
  usePageTracking(location.pathname)

  return (
    <div>
      <h1>My Page</h1>
    </div>
  )
}
```

---

## Complete Example

```typescript
import { AnalyticsProvider, useAnalytics, usePageTracking } from "@dcl/hooks"
import { useLocation } from "react-router-dom"

function MyPage() {
  const location = useLocation()
  usePageTracking(location.pathname)

  return (
    <div>
      <h1>My Page</h1>
      <TrackableButton />
    </div>
  )
}

function TrackableButton() {
  const analytics = useAnalytics()

  const handleClick = () => {
    if (analytics.isInitialized) {
      analytics.track("Profile Updated", {
        updateType: "information",
      })
      analytics.identify("user-123", {
        lastUpdated: new Date().toISOString(),
      })
    }
  }

  return <button onClick={handleClick}>Update Profile</button>
}

function App() {
  return (
    <AnalyticsProvider
      writeKey="YOUR_SEGMENT_WRITE_KEY"
      userId="user-123"
      traits={{ name: "John Doe" }}
    >
      <MyPage />
    </AnalyticsProvider>
  )
}
```

## Common Patterns

- Place `AnalyticsProvider` at the top of your component tree.
- Use `usePageTracking` in layout components or route wrappers for automatic page tracking.
- Check `analytics.isInitialized` before calling methods if you need to guard against no-ops.

## Pitfalls

- `useAnalytics` throws an error if used outside of `AnalyticsProvider`.
- Before initialization completes, `track`, `identify`, and `page` are no-ops (they do nothing, no error).
- Bot detection is automatic -- analytics will not initialize for bots.
- `@segment/analytics-next` is dynamically imported, so it adds no bundle cost if `AnalyticsProvider` is not rendered.
