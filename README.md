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
- `useShare`: Hook for sharing content using the Web Share API

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

### useShare

```typescript
import { useShare } from '@dcl/hooks'

function ShareButton() {
  const [share, shareState] = useShare()

  const handleShare = async () => {
    await share({
      title: 'My Decentraland Experience',
      text: 'Check out what I found in Decentraland!',
      url: 'https://play.decentraland.org',
      thumbnail: 'https://example.com/thumbnail.jpg' // optional
    })
  }

  if (!shareState.isSupported) {
    return <div>Sharing is not supported in this browser</div>
  }

  return (
    <div>
      <button onClick={handleShare} disabled={shareState.isSharing}>
        {shareState.isSharing ? 'Sharing...' : 'Share'}
      </button>
      {shareState.error && <div>Error: {shareState.error.message}</div>}
    </div>
  )
}
```

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
