import * as Sentry from "@sentry/browser"

type SentryTracker = (sentry: typeof Sentry) => void
const sentry = (tracker: SentryTracker) => {
  if (typeof window !== "undefined") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if ((window as any).Sentry) {
      tracker(Sentry)
    }
  }
}

export type { SentryTracker }
export { sentry }
