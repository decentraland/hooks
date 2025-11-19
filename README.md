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
- `useWallet`: Wallet connection management for Web3 applications

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

### useWallet

The `useWallet` hook provides a simple way to manage wallet connections in Web3 applications. It supports automatic connection, event handling, and error management.

#### Basic Usage

```typescript
import { useWallet } from '@dcl/hooks'

function WalletButton() {
  const { address, isConnected, isConnecting, error, connect, disconnect } = useWallet()

  if (isConnected) {
    return (
      <div>
        <p>Connected: {address}</p>
        <button onClick={disconnect}>Disconnect</button>
      </div>
    )
  }

  return (
    <div>
      {error && <p>Error: {error.message}</p>}
      <button onClick={connect} disabled={isConnecting}>
        {isConnecting ? 'Connecting...' : 'Connect Wallet'}
      </button>
    </div>
  )
}
```

#### Auto-Connect

You can enable automatic connection on mount:

```typescript
import { useWallet } from '@dcl/hooks'

function MyApp() {
  const { address, isConnected, connect } = useWallet({
    autoConnect: true,
  })

  return (
    <div>
      {isConnected ? (
        <p>Welcome! Your address: {address}</p>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  )
}
```

#### With Callbacks

You can provide callbacks to handle connection events:

```typescript
import { useWallet } from '@dcl/hooks'

function WalletComponent() {
  const { address, isConnected, connect, disconnect } = useWallet({
    autoConnect: true,
    onConnect: (address) => {
      console.log('Wallet connected:', address)
      // Track analytics, update UI, etc.
    },
    onDisconnect: () => {
      console.log('Wallet disconnected')
      // Clean up, reset state, etc.
    },
    onError: (error) => {
      console.error('Wallet error:', error)
      // Show error notification, etc.
    },
  })

  return (
    <div>
      {isConnected ? (
        <div>
          <p>Address: {address}</p>
          <button onClick={disconnect}>Disconnect</button>
        </div>
      ) : (
        <button onClick={connect}>Connect Wallet</button>
      )}
    </div>
  )
}
```

#### Complete Example

Here's a complete example showing all wallet features:

```typescript
import { useWallet } from '@dcl/hooks'

function WalletManager() {
  const {
    address,
    isConnected,
    isConnecting,
    error,
    connect,
    disconnect,
    reconnect,
  } = useWallet({
    autoConnect: true,
    onConnect: (address) => {
      console.log('Connected to:', address)
    },
    onDisconnect: () => {
      console.log('Disconnected from wallet')
    },
    onError: (error) => {
      console.error('Wallet error:', error.message)
    },
  })

  if (isConnecting) {
    return <div>Connecting to wallet...</div>
  }

  if (error) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={reconnect}>Retry</button>
      </div>
    )
  }

  if (isConnected) {
    return (
      <div>
        <h3>Wallet Connected</h3>
        <p>Address: {address}</p>
        <button onClick={disconnect}>Disconnect</button>
        <button onClick={reconnect}>Reconnect</button>
      </div>
    )
  }

  return (
    <div>
      <button onClick={connect}>Connect Wallet</button>
    </div>
  )
}
```

### Wallet Authentication with Context Providers

For more advanced use cases that require Decentraland Identity management, we provide context-based providers that handle both wallet connection and identity creation.

#### AuthProvider (Recommended)

The `AuthProvider` is the simplest way to add wallet and identity management to your app:

```typescript
import { AuthProvider, useAuthContext } from '@dcl/hooks'

function App() {
  return (
    <AuthProvider>
      <YourApp />
    </AuthProvider>
  )
}

function YourApp() {
  const {
    address,           // Wallet address
    identity,          // Decentraland identity
    isConnected,       // Wallet connection status
    isAuthenticating,  // Loading state
    connect,           // Connect wallet and create identity
    logout,            // Disconnect and clear identity
    error              // Error state
  } = useAuthContext()

  if (isAuthenticating) {
    return <div>Loading...</div>
  }

  if (!isConnected) {
    return <button onClick={connect}>Connect Wallet</button>
  }

  return (
    <div>
      <p>Address: {address}</p>
      <p>Identity: {identity ? 'Created' : 'None'}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

#### Individual Providers

For more granular control, you can use the individual providers:

```typescript
import {
  WalletProvider,
  useWalletContext,
  IdentityProvider,
  useIdentityContext
} from '@dcl/hooks'

function App() {
  return (
    <WalletProvider>
      <IdentityProvider>
        <YourApp />
      </IdentityProvider>
    </WalletProvider>
  )
}

function YourApp() {
  const {
    address,
    isLoading: isLoadingWallet,
    connectWallet,
    disconnectWallet,
    signMessage
  } = useWalletContext()

  const {
    identity,
    isLoading: isLoadingIdentity,
    createIdentity,
    clearIdentity
  } = useIdentityContext()

  return (
    <div>
      {address ? (
        <>
          <p>Wallet: {address}</p>
          {identity ? (
            <>
              <p>Identity: Created</p>
              <button onClick={clearIdentity}>Clear Identity</button>
            </>
          ) : (
            <button onClick={createIdentity} disabled={isLoadingIdentity}>
              Create Identity
            </button>
          )}
          <button onClick={disconnectWallet}>Disconnect</button>
        </>
      ) : (
        <button onClick={connectWallet} disabled={isLoadingWallet}>
          Connect Wallet
        </button>
      )}
    </div>
  )
}
```

#### Features

- **Wallet Management**: Connect/disconnect Ethereum wallets (MetaMask, etc.)
- **Identity Management**: Create and manage Decentraland identities
- **Persistent State**: Automatic identity persistence in localStorage
- **Event Handling**: Automatic account change detection
- **Error Handling**: Built-in error states and callbacks
- **TypeScript Support**: Full TypeScript definitions

#### API Reference

**AuthProvider/useAuthContext**
- `address: string | null` - Connected wallet address
- `identity: AuthIdentity | null` - Decentraland identity
- `isAuthenticating: boolean` - Overall loading state
- `isLoadingWallet: boolean` - Wallet-specific loading state
- `isLoadingIdentity: boolean` - Identity-specific loading state
- `error: string | null` - Error message if any
- `connect(): Promise<void>` - Connect wallet and create identity
- `logout(): void` - Disconnect wallet and clear identity
- `signMessage(message: string): Promise<string>` - Sign a message with the wallet

**WalletProvider/useWalletContext**
- `address: string | null` - Connected wallet address
- `isLoading: boolean` - Loading state
- `error: string | null` - Error message
- `connectWallet(): Promise<void>` - Connect to Ethereum wallet
- `disconnectWallet(): void` - Disconnect wallet
- `signMessage(message: string): Promise<string>` - Sign a message
- `checkConnection(): Promise<string | null>` - Check existing connection

**IdentityProvider/useIdentityContext**
- `identity: AuthIdentity | null` - Decentraland identity
- `isLoading: boolean` - Loading state
- `createIdentity(): Promise<void>` - Create new identity
- `clearIdentity(): void` - Clear identity from storage
- `loadIdentity(address: string): void` - Load identity from storage

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
