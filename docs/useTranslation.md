# Translation (TranslationProvider + useTranslation)

i18n hook powered by `@formatjs/intl`. Supports ICU message syntax, nested translation keys, fallback locales, and both standalone and context-based usage.

## Import

```typescript
import {
  TranslationProvider,
  useTranslation,
} from "@dcl/hooks"
```

## Types

```typescript
interface Translations {
  [key: string]: string | Translations  // can be nested
}

type LanguageTranslations = Record<string, Translations>

type TranslationOptions<L extends string = string> = {
  locale: L
  translations: LanguageTranslations
  fallbackLocale?: L
}

type TranslationResult = {
  t: (key: string, values?: Record<string, string | number>) => string
  intl: IntlShape          // full @formatjs/intl instance
  locale: string
  setLocale: (locale: string) => void
  error: string | null
}
```

## TranslationProvider

Context provider for app-wide translations. When used, `useTranslation()` can be called without arguments.

### Props

```typescript
type TranslationProviderProps<L extends string = string> = {
  locale: L                         // required
  translations: LanguageTranslations // required
  fallbackLocale?: L                // optional
  children: ReactNode
}
```

### Example

```typescript
const translations = {
  en: { greeting: "Hello!", welcome: "Welcome to our app" },
  es: { greeting: "Hola!", welcome: "Bienvenido a nuestra aplicacion" },
}

function App() {
  return (
    <TranslationProvider locale="en" translations={translations} fallbackLocale="en">
      <MyComponent />
    </TranslationProvider>
  )
}

function MyComponent() {
  const { t, setLocale } = useTranslation() // no args needed inside provider
  return (
    <div>
      <p>{t("greeting")}</p>
      <button onClick={() => setLocale("es")}>Espanol</button>
    </div>
  )
}
```

---

## useTranslation

### Signature

```typescript
function useTranslation<L extends string = string>(
  options?: Partial<TranslationOptions<L>>
): TranslationResult
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `options.locale` | `string` | -- | Current locale (required in standalone mode) |
| `options.translations` | `LanguageTranslations` | -- | Translation strings (required in standalone mode) |
| `options.fallbackLocale` | `string` | `undefined` | Fallback locale for missing keys |

### Return Value

| Field | Type | Description |
|-------|------|-------------|
| `t` | `(key, values?) => string` | Translate a key with optional interpolation values |
| `intl` | `IntlShape` | Full `@formatjs/intl` instance for advanced formatting |
| `locale` | `string` | Current locale |
| `setLocale` | `(locale) => void` | Change the active locale |
| `error` | `string \| null` | Error message if translation setup failed |

---

## Examples

### Standalone usage (no provider)

```typescript
const translations = {
  en: {
    greeting: "Hello, {name}!",
    items: "{count, plural, =0 {No items} one {# item} other {# items}}",
  },
  es: {
    greeting: "Hola, {name}!",
    items: "{count, plural, =0 {Sin elementos} one {# elemento} other {# elementos}}",
  },
}

function MyComponent() {
  const { t, setLocale } = useTranslation({
    locale: "en",
    translations,
  })

  return (
    <div>
      <p>{t("greeting", { name: "John" })}</p>
      <p>{t("items", { count: 5 })}</p>
      <button onClick={() => setLocale("es")}>Switch to Spanish</button>
    </div>
  )
}
```

### Nested translation keys

Nested objects are flattened to dot notation automatically:

```typescript
const translations = {
  en: {
    components: {
      blog: {
        related_post: { title: "Related posts" },
      },
    },
  },
}

const { t } = useTranslation({ locale: "en", translations })
t("components.blog.related_post.title") // "Related posts"
```

### Fallback locale

```typescript
const translations = {
  en: { greeting: "Hello!", welcome: "Welcome!" },
  es: { greeting: "Hola!" }, // 'welcome' missing
}

const { t } = useTranslation({
  locale: "es",
  translations,
  fallbackLocale: "en",
})

t("greeting") // "Hola!"
t("welcome")  // "Welcome!" (from fallback)
```

### ICU message syntax

```typescript
const translations = {
  en: {
    items: "{count, plural, =0 {No items} one {# item} other {# items}}",
    gender: "{gender, select, male {He} female {She} other {They}}",
    notification: "{count, plural, =0 {No notifications} =1 {You have one notification} other {You have # notifications}}",
  },
}

const { t } = useTranslation({ locale: "en", translations })

t("items", { count: 0 })           // "No items"
t("items", { count: 1 })           // "1 item"
t("items", { count: 5 })           // "5 items"
t("gender", { gender: "male" })    // "He"
t("notification", { count: 3 })    // "You have 3 notifications"
```

### Advanced formatting with intl

The `intl` object is a full `@formatjs/intl` `IntlShape` instance:

```typescript
const { intl } = useTranslation({ locale: "en", translations: { en: {} } })

intl.formatNumber(1000)                    // "1,000"
intl.formatDate(new Date(), { year: "numeric", month: "long", day: "numeric" })
intl.formatNumber(99.99, { style: "currency", currency: "USD" }) // "$99.99"
intl.formatRelativeTime(-1, "day")         // "1 day ago"
intl.formatList(["apple", "banana", "orange"]) // "apple, banana, and orange"
intl.formatDisplayName("es", { type: "language" }) // "Spanish"
```

## Common Patterns

- Use `TranslationProvider` for app-wide translations; use standalone mode for isolated components or libraries.
- ICU message syntax supports pluralization, select, and nested formatting.
- Access the full `intl` object for number, date, currency, relative time, and list formatting.

## Pitfalls

- When using `TranslationProvider`, calling `useTranslation()` with options will override the context values.
- Nested translation objects are flattened on every render -- keep translation objects stable (outside component or memoized).
- The `t` function returns the key itself if the translation is not found and no fallback exists.
