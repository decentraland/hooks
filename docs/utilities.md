# Utilities

Typed localStorage helpers with JSON serialization. All functions silently fail on errors (e.g., when localStorage is unavailable or quota is exceeded).

## Import

```typescript
import {
  getStorageItem,
  setStorageItem,
  removeStorageItem,
} from "@dcl/hooks"
```

## Functions

### getStorageItem

Retrieves and parses a JSON value from localStorage. Returns the fallback if the key doesn't exist, parsing fails, or localStorage throws.

```typescript
function getStorageItem<T>(key: string, fallback: T): T
```

### setStorageItem

Stores a value in localStorage as JSON.

```typescript
function setStorageItem<T>(key: string, value: T): void
```

### removeStorageItem

Removes a key from localStorage.

```typescript
function removeStorageItem(key: string): void
```

## Examples

### Basic usage

```typescript
import { getStorageItem, setStorageItem, removeStorageItem } from "@dcl/hooks"

// Read with typed fallback
const isEnabled = getStorageItem<boolean>("feature_enabled", false)
const user = getStorageItem<User | null>("current_user", null)

// Write
setStorageItem("feature_enabled", true)
setStorageItem("current_user", { id: 1, name: "John" })

// Remove
removeStorageItem("current_user")
```

### With complex types

```typescript
type UserPreferences = {
  theme: "light" | "dark"
  language: string
  notifications: boolean
}

const defaultPrefs: UserPreferences = {
  theme: "light",
  language: "en",
  notifications: true,
}

const prefs = getStorageItem<UserPreferences>("prefs", defaultPrefs)
setStorageItem("prefs", { ...prefs, theme: "dark" })
```

## Common Patterns

- Always provide a typed fallback to `getStorageItem` for type safety.
- Use for persisting user preferences, onboarding state, or cache data.

## Pitfalls

- All functions silently catch errors -- they will not throw if localStorage is unavailable (e.g., private browsing in some browsers).
- Values are serialized with `JSON.stringify` / `JSON.parse` -- functions and circular references will not work.
- No TTL/expiration support -- values persist until explicitly removed.
