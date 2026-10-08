/**
 * @jest-environment node
 */
import { isBotClient } from "../../src/contexts/analytics/utils"

describe("isBotClient outside a browser", () => {
  describe("when there is no navigator to read", () => {
    let original: PropertyDescriptor | undefined

    beforeEach(() => {
      // Node 21+ defines a global navigator, so remove it to reproduce older runtimes and prerenders.
      original = Object.getOwnPropertyDescriptor(globalThis, "navigator")
      Object.defineProperty(globalThis, "navigator", {
        value: undefined,
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

    it("should treat the client as not a bot instead of throwing", () => {
      expect(isBotClient()).toBe(false)
    })
  })

  describe("when the given user agent is empty", () => {
    it("should treat the client as not a bot", () => {
      expect(isBotClient("")).toBe(false)
    })
  })
})
