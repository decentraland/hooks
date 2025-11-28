# decentraland-hooks

![Decentraland Cover](https://decentraland.org/og.jpg)

A collection of React hooks commonly used in Decentraland projects.

## Installation

```bash
npm install @dcl/hooks
```

## Available Hooks

- `useAdvancedUserAgentData`: Enhanced user agent information
- `useAsyncState`: Async state management with dependencies
- `useAsyncTask`: Single async task management
- `useAsyncTasks`: Multiple async tasks management
- `usePatchState`: Partial state updates for complex objects
- `useAsyncEffect`: Async version of useEffect
- `useAsyncMemo`: Async version of useMemo
- `useInfiniteScroll`: Infinite scroll functionality for loading more content

## Examples

### useAsyncState

```typescript
import { useAsyncState } from '@dcl/hooks'

function Example() {
  const [data, { loading, error }] = useAsyncState(
    async () => {
      const response = await fetch('https://api.example.com/data')
      return response.json()
    },
    [] // dependencies
  )

  if (loading) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return <div>{JSON.stringify(data)}</div>
}
```

### useAdvancedUserAgentData

```typescript
import { useAdvancedUserAgentData } from '@dcl/hooks'

function BrowserInfo() {
  const [isLoading, data] = useAdvancedUserAgentData()

  if (isLoading) return <div>Loading browser info...</div>

  return (
    <div>
      <h3>Browser Information</h3>
      <ul>
        <li>Browser: {data?.browser.name} {data?.browser.version}</li>
        <li>OS: {data?.os.name} {data?.os.version}</li>
        <li>CPU Architecture: {data?.cpu.architecture}</li>
        <li>Mobile Device: {data?.mobile ? 'Yes' : 'No'}</li>
      </ul>
    </div>
  )
}
```

### useInfiniteScroll

```typescript
import { useInfiniteScroll } from '@dcl/hooks'
import { useState, useEffect } from 'react'

function InfiniteList() {
  const [items, setItems] = useState<string[]>([])
  const [hasMore, setHasMore] = useState(true)
  const [isLoading, setIsLoading] = useState(false)

  const loadMore = async () => {
    if (isLoading) return

    setIsLoading(true)
    try {
      // Simulate API call
      const newItems = await fetchMoreItems(items.length)
      setItems((prev) => [...prev, ...newItems])
      
      // Check if there's more data
      setHasMore(newItems.length > 0)
    } catch (error) {
      console.error('Failed to load more items:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useInfiniteScroll({
    onLoadMore: loadMore,
    hasMore,
    isLoading,
    threshold: 500, // Trigger when 500px from bottom
    debounceMs: 500, // Minimum time between triggers (default: 500ms)
  })

  return (
    <div>
      {items.map((item, index) => (
        <div key={index}>{item}</div>
      ))}
      {isLoading && <div>Loading more...</div>}
      {!hasMore && <div>No more items</div>}
    </div>
  )
}
```

### Analytics Hooks

The package provides a set of hooks for analytics tracking using Segment. Here's how to use them:

#### Setting up the AnalyticsProvider

First, wrap your app with the AnalyticsProvider:

```typescript
import { AnalyticsProvider } from '@dcl/hooks'

function App() {
  return (
    <AnalyticsProvider
      writeKey="xyz1234"
      userId="user-123" // Optional
      traits={{ // Optional
        name: 'John Doe',
        email: 'john@example.com'
      }}
    >
      <Main />
    </AnalyticsProvider>
  )
}
```

#### Using the useAnalytics Hook

The `useAnalytics` hook provides access to tracking functions:

```typescript
import { useAnalytics } from '@dcl/hooks'

function MyComponent() {
  const analytics = useAnalytics()

  const handleButtonClick = () => {
    if (analytics.isInitialized) {
      // Track an event
      analytics.track('Button Clicked', {
        buttonId: 'submit',
        timestamp: new Date().toISOString()
      })

      // Identify a user
      analytics.identify('user-123', {
        name: 'John Doe',
        email: 'john@example.com'
      })
    }
  }

  return (
    <button onClick={handleButtonClick}>
      Click me
    </button>
  )
}
```

#### Using the usePageTracking Hook

The `usePageTracking` hook automatically tracks page views based on route changes:

```typescript
import { usePageTracking } from '@dcl/hooks'

function MyPage() {
  // Automatically tracks page view when route changes
  usePageTracking()

  return (
    <div>
      <h1>My Page</h1>
      {/* Your page content */}
    </div>
  )
}
```

If you need to track additional page properties, you can use the `useAnalytics` hook directly:

```typescript
import { useAnalytics } from '@dcl/hooks'

function MyPage() {
  const analytics = useAnalytics()

  useEffect(() => {
    if (analytics.isInitialized) {
      analytics.page('My Page', {
        category: 'Content',
        section: 'Main',
        timestamp: new Date().toISOString()
      })
    }
  }, [analytics])

  return (
    <div>
      <h1>My Page</h1>
      {/* Your page content */}
    </div>
  )
}
```

#### Complete Example

Here's a complete example showing how to use all analytics features together:

```typescript
import { AnalyticsProvider, useAnalytics, usePageTracking } from '@dcl/hooks'

function MyPage() {
  // Track page views
  usePageTracking()

  return (
    <div>
      <h1>My Page</h1>
      <UserProfile />
    </div>
  )
}

function UserProfile() {
  const analytics = useAnalytics()

  const handleProfileUpdate = () => {
    if (analytics.isInitialized) {
      // Track profile update event
      analytics.track('Profile Updated', {
        timestamp: new Date().toISOString(),
        updateType: 'information'
      })

      // Update user traits
      analytics.identify('user-123', {
        lastUpdated: new Date().toISOString()
      })
    }
  }

  return (
    <button onClick={handleProfileUpdate}>
      Update Profile
    </button>
  )
}

function App() {
  return (
    <AnalyticsProvider
      writeKey="xyz1234"
      userId="user-123"
      traits={{
        name: 'John Doe',
        email: 'john@example.com'
      }}
    >
      <MyPage />
    </AnalyticsProvider>
  )
}
```

### Analytics Hooks

The package provides a set of hooks for analytics tracking using Segment. Here's how to use them:

#### Setting up the AnalyticsProvider

First, wrap your app with the AnalyticsProvider:

```typescript
import { AnalyticsProvider } from '@dcl/hooks'

function App() {
  return (
    <AnalyticsProvider
      writeKey="xyz1234"
      userId="user-123" // Optional
      traits={{ // Optional
        name: 'John Doe',
        email: 'john@example.com'
      }}
    >
      <Main />
    </AnalyticsProvider>
  )
}
```

#### Using the useAnalytics Hook

The `useAnalytics` hook provides access to tracking functions:

```typescript
import { useAnalytics } from '@dcl/hooks'

function MyComponent() {
  const analytics = useAnalytics()

  const handleButtonClick = () => {
    if (analytics.isInitialized) {
      // Track an event
      analytics.track('Button Clicked', {
        buttonId: 'submit',
        timestamp: new Date().toISOString()
      })

      // Identify a user
      analytics.identify('user-123', {
        name: 'John Doe',
        email: 'john@example.com'
      })
    }
  }

  return (
    <button onClick={handleButtonClick}>
      Click me
    </button>
  )
}
```

#### Using the usePageTracking Hook

The `usePageTracking` hook automatically tracks page views based on route changes:

```typescript
import { usePageTracking } from '@dcl/hooks'

function MyPage() {
  // Automatically tracks page view when route changes
  usePageTracking()

  return (
    <div>
      <h1>My Page</h1>
      {/* Your page content */}
    </div>
  )
}
```

If you need to track additional page properties, you can use the `useAnalytics` hook directly:

```typescript
import { useAnalytics } from '@dcl/hooks'

function MyPage() {
  const analytics = useAnalytics()

  useEffect(() => {
    if (analytics.isInitialized) {
      analytics.page('My Page', {
        category: 'Content',
        section: 'Main',
        timestamp: new Date().toISOString()
      })
    }
  }, [analytics])

  return (
    <div>
      <h1>My Page</h1>
      {/* Your page content */}
    </div>
  )
}
```

#### Complete Example

Here's a complete example showing how to use all analytics features together:

```typescript
import { AnalyticsProvider, useAnalytics, usePageTracking } from '@dcl/hooks'

function MyPage() {
  // Track page views
  usePageTracking()

  return (
    <div>
      <h1>My Page</h1>
      <UserProfile />
    </div>
  )
}

function UserProfile() {
  const analytics = useAnalytics()

  const handleProfileUpdate = () => {
    if (analytics.isInitialized) {
      // Track profile update event
      analytics.track('Profile Updated', {
        timestamp: new Date().toISOString(),
        updateType: 'information'
      })

      // Update user traits
      analytics.identify('user-123', {
        lastUpdated: new Date().toISOString()
      })
    }
  }

  return (
    <button onClick={handleProfileUpdate}>
      Update Profile
    </button>
  )
}

function App() {
  return (
    <AnalyticsProvider
      writeKey="xyz1234"
      userId="user-123"
      traits={{
        name: 'John Doe',
        email: 'john@example.com'
      }}
    >
      <MyPage />
    </AnalyticsProvider>
  )
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
