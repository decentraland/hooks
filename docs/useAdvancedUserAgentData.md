# useAdvancedUserAgentData

Detects browser, engine, OS, CPU architecture, and device type (mobile/tablet) using UAParser and the User-Agent Client Hints API.

## Import

```typescript
import { useAdvancedUserAgentData } from "@dcl/hooks"
import type { AdvancedNavigatorUAData } from "@dcl/hooks"
```

## Types

```typescript
type AdvancedNavigatorUAData = {
  browser: { name: string; version: string }
  engine: { name: string; version: string }
  os: { name: string; version: string }
  cpu: { architecture: string }
  mobile: boolean
  tablet: boolean
}
```

## Signature

```typescript
function useAdvancedUserAgentData(): [boolean, AdvancedNavigatorUAData | undefined]
//                                    loading  data
```

### Return Value

Returns `[isLoading, data]` tuple:

| Field | Type | Description |
|-------|------|-------------|
| `isLoading` | `boolean` | True while parsing user agent data |
| `data` | `AdvancedNavigatorUAData \| undefined` | Parsed user agent data, or undefined while loading |

## Examples

### Basic device detection

```typescript
import { useAdvancedUserAgentData } from "@dcl/hooks"

function DeviceInfo() {
  const [isLoading, data] = useAdvancedUserAgentData()

  if (isLoading) return <div>Detecting device...</div>

  return (
    <div>
      <p>Browser: {data?.browser.name} {data?.browser.version}</p>
      <p>OS: {data?.os.name} {data?.os.version}</p>
      <p>CPU: {data?.cpu.architecture}</p>
      <p>Mobile: {data?.mobile ? "Yes" : "No"}</p>
      <p>Tablet: {data?.tablet ? "Yes" : "No"}</p>
    </div>
  )
}
```

### Conditional rendering by device

```typescript
function ResponsiveLayout() {
  const [isLoading, uaData] = useAdvancedUserAgentData()

  if (isLoading) return <Skeleton />

  if (uaData?.mobile) {
    return <MobileLayout />
  }

  return <DesktopLayout />
}
```

### Analytics enrichment

```typescript
function useEnrichedAnalytics() {
  const [, uaData] = useAdvancedUserAgentData()
  const analytics = useAnalytics()

  const trackWithDevice = (event: string, props: Record<string, unknown>) => {
    analytics.track(event, {
      ...props,
      browser: uaData?.browser.name,
      os: uaData?.os.name,
      isMobile: uaData?.mobile,
    })
  }

  return { trackWithDevice }
}
```

## Common Patterns

- Use for device-specific rendering or feature gating.
- Combine with analytics to enrich tracking events with device info.
- The data is parsed once on mount and does not change.

## Pitfalls

- Uses the User-Agent Client Hints API when available, falling back to `ua-parser-js` for standard user agent parsing.
- The `architecture` field may be empty on some browsers/devices.
- Returns `undefined` (not `null`) while loading.
