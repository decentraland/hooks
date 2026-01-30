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
- `useTranslation`: Simple and lightweight translation management
- `useNotifications`: Notification polling and modal state management

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

### useTranslation

The `useTranslation` hook provides i18n capabilities powered by `@formatjs/intl`, giving you access to advanced formatting functions for numbers, dates, currencies, and more.

Basic usage:

```typescript
import { useTranslation } from '@dcl/hooks'

const translations = {
  en: {
    greeting: 'Hello, {name}!',
    welcome: 'Welcome to our app',
    items: '{count, plural, =0 {No items} one {# item} other {# items}}'
  },
  es: {
    greeting: 'Hola, {name}!',
    welcome: 'Bienvenido a nuestra aplicación',
    items: '{count, plural, =0 {Sin elementos} one {# elemento} other {# elementos}}'
  }
}

function MyComponent() {
  const { t, intl, locale, setLocale } = useTranslation({
    locale: 'en',
    translations
  })

  return (
    <div>
      <p>{t('greeting', { name: 'John' })}</p>
      <p>{t('items', { count: 5 })}</p>
      <button onClick={() => setLocale('es')}>
        Switch to Spanish
      </button>
    </div>
  )
}
```

Nested translations (dot notation):

```typescript
const translations = {
  en: {
    components: {
      blog: {
        related_post: {
          title: 'Related posts'
        }
      }
    }
  }
}

function MyComponent() {
  const { t } = useTranslation({
    locale: 'en',
    translations
  })

  return <p>{t('components.blog.related_post.title')}</p>
}
```

Using the `intl` object for advanced formatting:

```typescript
function AdvancedFormattingExample() {
  const { t, intl } = useTranslation({
    locale: 'en',
    translations: {
      en: {
        product_price: 'Price: {price}'
      }
    }
  })

  return (
    <div>
      {/* Format numbers */}
      <p>Count: {intl.formatNumber(1000)}</p>

      {/* Format dates */}
      <p>Today: {intl.formatDate(new Date(), {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })}</p>

      {/* Format currency */}
      <p>{intl.formatNumber(99.99, {
        style: 'currency',
        currency: 'USD'
      })}</p>

      {/* Format relative time */}
      <p>{intl.formatRelativeTime(-1, 'day')}</p>

      {/* Use formatMessage directly */}
      <p>{intl.formatMessage({ id: 'product_price' }, { price: '$99' })}</p>
    </div>
  )
}
```

With fallback locale:

```typescript
const translations = {
  en: {
    greeting: 'Hello!',
    welcome: 'Welcome!'
  },
  es: {
    greeting: 'Hola!'
    // 'welcome' is missing in Spanish
  }
}

function MyComponent() {
  const { t } = useTranslation({
    locale: 'es',
    translations,
    fallbackLocale: 'en' // Will use English if translation is missing
  })

  return (
    <div>
      <p>{t('greeting')}</p> {/* Shows: "Hola!" */}
      <p>{t('welcome')}</p> {/* Shows: "Welcome!" (from fallback) */}
    </div>
  )
}
```

Using TranslationProvider for context-based translations:

```typescript
import { TranslationProvider, useTranslation } from '@dcl/hooks'

const translations = {
  en: {
    greeting: 'Hello!',
    welcome: 'Welcome to our app'
  },
  es: {
    greeting: 'Hola!',
    welcome: 'Bienvenido a nuestra aplicación'
  }
}

function App() {
  return (
    <TranslationProvider
      locale="en"
      translations={translations}
      fallbackLocale="en"
    >
      <MyComponent />
    </TranslationProvider>
  )
}

function MyComponent() {
  // Can be used without options when inside TranslationProvider
  const { t, locale, setLocale } = useTranslation()

  return (
    <div>
      <p>{t('greeting')}</p>
      <p>{t('welcome')}</p>
      <button onClick={() => setLocale('es')}>
        Switch to Spanish
      </button>
    </div>
  )
}
```

Using ICU Message Syntax:

```typescript
const translations = {
  en: {
    // Pluralization
    items: '{count, plural, =0 {No items} one {# item} other {# items}}',
    // Select syntax
    gender: '{gender, select, male {He} female {She} other {They}}',
    // Complex ICU
    notification: '{count, plural, =0 {No notifications} =1 {You have one notification} other {You have # notifications}}'
  }
}

function MyComponent() {
  const { t } = useTranslation({
    locale: 'en',
    translations
  })

  return (
    <div>
      <p>{t('items', { count: 0 })}</p> {/* "No items" */}
      <p>{t('items', { count: 1 })}</p> {/* "1 item" */}
      <p>{t('items', { count: 5 })}</p> {/* "5 items" */}
      <p>{t('gender', { gender: 'male' })}</p> {/* "He" */}
      <p>{t('notification', { count: 3 })}</p> {/* "You have 3 notifications" */}
    </div>
  )
}
```

Additional intl formatting functions:

```typescript
function MyComponent() {
  const { intl } = useTranslation({
    locale: 'en',
    translations: { en: {} }
  })

  return (
    <div>
      {/* Format lists */}
      <p>{intl.formatList(['apple', 'banana', 'orange'])}</p>
      {/* "apple, banana, and orange" */}

      {/* Format display names */}
      <p>{intl.formatDisplayName('es', { type: 'language' })}</p>
      {/* "Spanish" */}
      
      <p>{intl.formatDisplayName('US', { type: 'region' })}</p>
      {/* "United States" */}
    </div>
  )
}
```

### useNotifications

The `useNotifications` hook manages notification polling, modal state, and onboarding flow. It uses Decentraland's notifications API by default.

Basic usage:

```typescript
import { useNotifications } from '@dcl/hooks'
import type { AuthIdentity } from 'decentraland-crypto-fetch'

function NotificationsComponent() {
  const identity: AuthIdentity = useAuthIdentity() // From your auth context

  const {
    notifications,
    isLoading,
    isModalOpen,
    isNotificationsOnboarding,
    handleNotificationsOpen,
    handleOnBegin
  } = useNotifications({
    identity,
    isNotificationsEnabled: !!identity,
    notificationsUrl: 'https://notifications.decentraland.org' // or .zone for dev
  })

  if (isNotificationsOnboarding) {
    return (
      <div>
        <h2>Welcome to Notifications!</h2>
        <button onClick={handleOnBegin}>Get Started</button>
      </div>
    )
  }

  return (
    <div>
      <button onClick={handleNotificationsOpen}>
        Notifications ({notifications.filter(n => !n.read).length})
      </button>

      {isModalOpen && (
        <ul>
          {notifications.map(notification => (
            <li key={notification.id}>
              {notification.type} - {notification.read ? 'Read' : 'Unread'}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
```

With custom polling interval:

```typescript
const { notifications } = useNotifications({
  identity,
  isNotificationsEnabled: !!identity,
  notificationsUrl: 'https://notifications.decentraland.org',
  queryIntervalMs: 30000 // Poll every 30 seconds (default: 60000)
})
```

With notification type filtering:

```typescript
const { notifications } = useNotifications({
  identity,
  isNotificationsEnabled: !!identity,
  notificationsUrl: 'https://notifications.decentraland.org',
  availableNotificationTypes: ['bid', 'sale', 'royalties']
})
```

With error handling:

`onError` is called when fetching fails, marking as read fails, or when
`notificationsUrl` is missing.

```typescript
const { notifications } = useNotifications({
  identity,
  isNotificationsEnabled: !!identity,
  notificationsUrl: 'https://notifications.decentraland.org',
  onError: (error) => {
    console.error('Notification error:', error)
    Sentry.captureException(error)
  }
})
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
