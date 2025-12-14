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
- `useSEO`: SEO meta tags management with Open Graph and Twitter Cards support

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

The `usePageTracking` hook tracks page views when the pathname changes. You need to pass the current pathname as a parameter from your router:

```typescript
import { usePageTracking } from '@dcl/hooks'
import { useLocation } from 'react-router-dom'

function MyPage() {
  const location = useLocation()
  
  // Tracks page view when pathname changes
  usePageTracking(location.pathname)

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
import { useLocation } from 'react-router-dom'

function MyPage() {
  const location = useLocation()
  
  // Track page views
  usePageTracking(location.pathname)

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

The `usePageTracking` hook tracks page views when the pathname changes. You need to pass the current pathname as a parameter from your router:

```typescript
import { usePageTracking } from '@dcl/hooks'
import { useLocation } from 'react-router-dom'

function MyPage() {
  const location = useLocation()
  
  // Tracks page view when pathname changes
  usePageTracking(location.pathname)

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
import { useLocation } from 'react-router-dom'

function MyPage() {
  const location = useLocation()
  
  // Track page views
  usePageTracking(location.pathname)

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

### useSEO

The `useSEO` hook provides SEO meta tags management using `react-helmet`, with full support for Open Graph protocol and Twitter Cards.

> **Note:** This hook requires `react-helmet` as a peer dependency.

#### Basic Usage

```typescript
import { useSEO } from '@dcl/hooks'

function MyPage() {
  const { SEO } = useSEO({
    title: 'My Page Title',
    description: 'A description of my page for search engines and social sharing'
  })

  return (
    <>
      <SEO />
      <div>Page content</div>
    </>
  )
}
```

#### Article with Full Metadata

```typescript
import { useSEO, OGType } from '@dcl/hooks'

function BlogPost() {
  const { SEO } = useSEO({
    title: 'My Blog Post',
    description: 'An interesting article about Web3',
    type: OGType.Article,
    url: 'https://decentraland.org/blog/my-post',
    image: {
      url: 'https://decentraland.org/images/post-cover.jpg',
      width: 1200,
      height: 630,
      alt: 'Blog post cover image',
      type: 'image/jpeg'
    },
    author: 'John Doe',
    publishedTime: '2024-01-15T10:00:00Z',
    modifiedTime: '2024-01-16T14:30:00Z',
    section: 'Technology',
    tags: ['web3', 'metaverse', 'decentraland']
  })

  return (
    <>
      <SEO />
      <article>Blog post content</article>
    </>
  )
}
```

#### Available Props

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Page title (defaults to "Decentraland") |
| `description` | `string` | **Required.** Page description |
| `image` | `string \| OGImage` | Image URL or structured image object |
| `type` | `OGType` | Open Graph type (defaults to `OGType.Website`) |
| `url` | `string` | Canonical URL |
| `locale` | `string` | Locale (defaults to "en_US") |
| `author` | `string` | Article author (only for `OGType.Article`) |
| `publishedTime` | `string` | ISO 8601 publish date (only for articles) |
| `modifiedTime` | `string` | ISO 8601 modification date (only for articles) |
| `section` | `string` | Article section (only for articles) |
| `tags` | `string[]` | Article tags (only for articles) |

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
