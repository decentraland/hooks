# decentraland-hooks

![Decentraland Cover](https://decentraland.org/og.jpg)

A collection of React hooks commonly used in Decentraland projects.

## Installation

```bash
npm install @dcl/hooks
```

### Peer Dependencies

- `react` >= 18.0.0
- `decentraland-crypto-fetch` >= 2.0.1 (only needed for `useNotifications`)

## Available Hooks

| Hook                       | Description                                                   | Docs                                     |
| -------------------------- | ------------------------------------------------------------- | ---------------------------------------- |
| `useAsyncState`            | Async state management with auto-reload on dependency changes | [docs](docs/useAsyncState.md)            |
| `useAsyncMemo`             | Alias for `useAsyncState`                                     | [docs](docs/useAsyncState.md)            |
| `useAsyncEffect`           | Async version of `useEffect` with error tracking              | [docs](docs/useAsyncEffect.md)           |
| `useAsyncTask`             | Single imperative async task with loading state               | [docs](docs/useAsyncTask.md)             |
| `useAsyncTasks`            | Multiple concurrent async tasks managed by ID                 | [docs](docs/useAsyncTasks.md)            |
| `usePatchState`            | Partial state updates for complex objects                     | [docs](docs/usePatchState.md)            |
| `useInfiniteScroll`        | Infinite scroll with debounce and threshold                   | [docs](docs/useInfiniteScroll.md)        |
| `useAdvancedUserAgentData` | Browser, OS, CPU, and device detection                        | [docs](docs/useAdvancedUserAgentData.md) |
| `useAnalytics`             | Segment analytics tracking (requires `AnalyticsProvider`)     | [docs](docs/useAnalytics.md)             |
| `usePageTracking`          | Page view tracking (requires `AnalyticsProvider`)             | [docs](docs/useAnalytics.md)             |
| `useTranslation`           | i18n with ICU message syntax via `@formatjs/intl`             | [docs](docs/useTranslation.md)           |
| `useNotifications`         | Decentraland notification polling and modal state             | [docs](docs/useNotifications.md)         |

## Providers

| Provider              | Description                       | Docs                           |
| --------------------- | --------------------------------- | ------------------------------ |
| `AnalyticsProvider`   | Segment analytics context         | [docs](docs/useAnalytics.md)   |
| `TranslationProvider` | i18n context for `useTranslation` | [docs](docs/useTranslation.md) |

## Utilities

| Export                                                    | Description                                        | Docs                             |
| --------------------------------------------------------- | -------------------------------------------------- | -------------------------------- |
| `getStorageItem` / `setStorageItem` / `removeStorageItem` | Typed localStorage helpers with JSON serialization | [docs](docs/utilities.md)        |
| `createNotificationsClient`                               | Decentraland notifications API client              | [docs](docs/useNotifications.md) |

## Documentation

- **[docs/](docs/)** -- Detailed per-hook documentation with examples
- **[AGENTS.md](AGENTS.md)** -- Compact API reference for LLM/AI consumption
- **[docs/contributing.md](docs/contributing.md)** -- Contribution guide and internal patterns

## License

This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
