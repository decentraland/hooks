import { isbot } from "isbot"

const PROTOCOL_PREFIX = /^[a-z][a-z0-9+.-]*:\/\//i
const TRAILING_SLASHES = /\/+$/

/**
 * Both the cdn url and the api host decide where a third party script is loaded from and where every event is
 * delivered, so they are meant to be trusted values coming from the build configuration of the app, never from user
 * input. A value that is not a valid url, or that is not served over https unless it belongs to the app's own origin,
 * is ignored with a warning so analytics degrades to Segment's defaults instead of pointing at an untrusted host.
 */
function resolveUrl(name: string, value: string): URL | undefined {
  let resolved: URL

  try {
    resolved = new URL(value, window.location.href)
  } catch (_error) {
    console.warn(
      `[Analytics] Ignoring the ${name} "${value}", it is not a valid url`
    )
    return undefined
  }

  if (
    resolved.protocol !== "https:" &&
    resolved.origin !== window.location.origin
  ) {
    console.warn(
      `[Analytics] Ignoring the ${name} "${value}", it is not served over https`
    )
    return undefined
  }

  return resolved
}

/**
 * Normalizes the origin analytics.js fetches its settings and its remote plugins from, which ad blockers drop when it
 * is Segment's own cdn. Returns `undefined` when unset or invalid, which keeps the default.
 */
function resolveCdnUrl(cdnUrl?: string): string | undefined {
  if (!cdnUrl) {
    return undefined
  }

  const resolved = resolveUrl("cdn url", cdnUrl)

  // analytics-next appends `/v1/projects/<writeKey>/settings` to it, a trailing slash would double the separator
  return resolved && resolved.href.replace(TRAILING_SLASHES, "")
}

/**
 * Normalizes the host events are delivered to. analytics-next takes it without a protocol (`host/basePath`) and
 * prepends one, so a value that carries it is accepted and stripped instead of producing `https://https://host`.
 * Returns `undefined` when unset or invalid, which keeps the default.
 */
function resolveApiHost(apiHost?: string): string | undefined {
  if (!apiHost) {
    return undefined
  }

  const resolved = resolveUrl(
    "api host",
    PROTOCOL_PREFIX.test(apiHost) ? apiHost : `https://${apiHost}`
  )

  return (
    resolved &&
    `${resolved.host}${resolved.pathname}`.replace(TRAILING_SLASHES, "")
  )
}

/**
 * Whether the current client is a crawler or another bot, which the provider never loads analytics for. Exported so
 * code that sends events without the provider (a beacon fired before analytics loads) applies the same rule instead
 * of depending on `isbot` itself.
 *
 * Without an argument it reads THIS runtime's user agent, so call it that way only in a browser. Server code must pass
 * the request's user agent, with `?? ""` for a missing header: on Node 21+ the fallback reads the server's own
 * `Node.js/<major>` agent, which `isbot` classifies as a bot.
 */
function isBotClient(userAgent?: string): boolean {
  const resolved =
    userAgent ??
    (typeof navigator === "undefined" ? undefined : navigator.userAgent)
  // Stated here rather than left to whatever `isbot` returns for an empty string, which a minor release could change.
  return resolved ? isbot(resolved) : false
}

export { isBotClient, resolveApiHost, resolveCdnUrl }
