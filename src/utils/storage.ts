/**
 * Retrieves and parses a JSON value from localStorage.
 * Returns the fallback value if the key doesn't exist, parsing fails,
 * or localStorage throws an error.
 *
 * @template T - The expected type of the stored value
 * @param key - The localStorage key to retrieve
 * @param fallback - The value to return if retrieval fails
 * @returns The parsed value or the fallback
 *
 * @example
 * const isEnabled = getStorageItem<boolean>('feature_enabled', false)
 * const user = getStorageItem<User | null>('current_user', null)
 */
const getStorageItem = <T>(key: string, fallback: T): T => {
  try {
    const value = localStorage.getItem(key)
    if (value === null) {
      return fallback
    }
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

/**
 * Stores a value in localStorage as JSON.
 * Silently fails if localStorage throws an error.
 *
 * @template T - The type of the value to store
 * @param key - The localStorage key
 * @param value - The value to store (will be JSON stringified)
 *
 * @example
 * setStorageItem('feature_enabled', true)
 * setStorageItem('current_user', { id: 1, name: 'John' })
 */
const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    // Ignore storage errors
  }
}

/**
 * Removes a key from localStorage.
 * Silently fails if localStorage throws an error.
 *
 * @param key - The localStorage key to remove
 *
 * @example
 * removeStorageItem('current_user')
 */
const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key)
  } catch {
    // Ignore storage errors
  }
}

export { getStorageItem, removeStorageItem, setStorageItem }
