/**
 * @jest-environment node
 */
import { isBotClient } from "../../src/contexts/analytics/utils"

describe("isBotClient on a server", () => {
  describe("when the request carries no user agent", () => {
    let original: PropertyDescriptor | undefined

    beforeEach(() => {
      // Node 21+ exposes its own `Node.js/<major>` agent, which isbot flags. Pin it so the case holds on any version.
      original = Object.getOwnPropertyDescriptor(globalThis, "navigator")
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "Node.js/24" },
        configurable: true,
      })
    })

    afterEach(() => {
      if (original) {
        Object.defineProperty(globalThis, "navigator", original)
      } else {
        delete (globalThis as { navigator?: unknown }).navigator
      }
    })

    it("should return false instead of classifying the server itself", () => {
      const headers: Record<string, string | undefined> = {}
      expect(isBotClient(headers["user-agent"])).toBe(false)
    })
  })
})
