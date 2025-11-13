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
- `useBackgroundDownload`: Background file download with progress tracking and cache support
- `usePatchState`: Partial state updates for complex objects
- `useAsyncEffect`: Async version of useEffect
- `useAsyncMemo`: Async version of useMemo

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

### useBackgroundDownload

```typescript
import { useBackgroundDownload } from '@dcl/hooks'

function DownloadButton() {
  const { state, progress, start, save, abort, clearCache } = useBackgroundDownload({
    urls: {
      mac: 'https://decentraland.org/explorer/launcher.dmg',
      win: 'https://decentraland.org/explorer/launcher.exe'
    },
    cacheKey: 'decentraland-launcher',
    cacheTTL: 24 * 60 * 60 * 1000, // 24 hours
    onProgress: (progress, loaded, total) => {
      console.log(`Downloaded: ${progress.toFixed(2)}% (${loaded}/${total} bytes)`)
    },
    onDone: (blob) => {
      console.log('Download complete!', blob.size, 'bytes')
    },
    onError: (error) => {
      console.error('Download failed:', error)
    }
  })

  const handleDownload = async () => {
    await start()
  }

  const handleSave = () => {
    if (state === 'finished') {
      save('decentraland-launcher.dmg')
    }
  }

  return (
    <div>
      {state === 'downloading' && (
        <div>
          <p>Downloading... {progress.toFixed(2)}%</p>
          <button onClick={abort}>Cancel</button>
        </div>
      )}
      {state === 'finished' && (
        <div>
          <p>Download complete!</p>
          <button onClick={handleSave}>Save File</button>
          <button onClick={clearCache}>Clear Cache</button>
        </div>
      )}
      {state === 'idle' && (
        <button onClick={handleDownload}>Download</button>
      )}
      {state === 'error' && (
        <div>
          <p>Error occurred</p>
          <button onClick={handleDownload}>Retry</button>
        </div>
      )}
    </div>
  )
}
```


## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
