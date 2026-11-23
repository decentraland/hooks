/**
 * @jest-environment node
 */
import type { AdvancedNavigatorUAData } from "../../src/hooks/useAdvancedUserAgentData"

// Node 21+ ships a global `navigator` whose user agent is `Node.js/<version>`,
// so the server render must be told apart by the missing `window`, not by
// the missing `navigator`.

const originalNavigator = Object.getOwnPropertyDescriptor(
  globalThis,
  "navigator"
)

function renderOnServer(): [boolean, AdvancedNavigatorUAData | undefined] {
  let rendered: [boolean, AdvancedNavigatorUAData | undefined] | undefined
  jest.isolateModules(() => {
    const React = require("react")
    const { renderToString } = require("react-dom/server")
    const {
      useAdvancedUserAgentData,
    } = require("../../src/hooks/useAdvancedUserAgentData")
    function Probe() {
      rendered = useAdvancedUserAgentData()
      return React.createElement("div")
    }
    renderToString(React.createElement(Probe))
  })
  return rendered as [boolean, AdvancedNavigatorUAData | undefined]
}

describe("useAdvancedUserAgentData on the server", () => {
  afterEach(() => {
    if (originalNavigator) {
      Object.defineProperty(globalThis, "navigator", originalNavigator)
    } else {
      delete (globalThis as Record<string, unknown>).navigator
    }
  })

  describe("when there is no navigator", () => {
    beforeEach(() => {
      Object.defineProperty(globalThis, "navigator", {
        value: undefined,
        configurable: true,
        writable: true,
      })
    })

    it("should render loading with no data", () => {
      expect(renderOnServer()).toEqual([true, undefined])
    })
  })

  describe("when Node provides a navigator with a Node.js user agent", () => {
    beforeEach(() => {
      Object.defineProperty(globalThis, "navigator", {
        value: { userAgent: "Node.js/24" },
        configurable: true,
        writable: true,
      })
    })

    it("should render loading with no data", () => {
      expect(typeof window).toBe("undefined")
      expect(renderOnServer()).toEqual([true, undefined])
    })
  })
})

describe("getAdvancedUserAgentData on the server", () => {
  afterEach(() => {
    if (originalNavigator) {
      Object.defineProperty(globalThis, "navigator", originalNavigator)
    } else {
      delete (globalThis as Record<string, unknown>).navigator
    }
  })

  it("should resolve undefined without a window, even with Node's navigator", async () => {
    Object.defineProperty(globalThis, "navigator", {
      value: { userAgent: "Node.js/22" },
      configurable: true,
    })
    let data: unknown = "unset"
    await jest.isolateModulesAsync(async () => {
      const {
        getAdvancedUserAgentData,
      } = require("../../src/hooks/useAdvancedUserAgentData")
      data = await getAdvancedUserAgentData()
    })
    expect(data).toBeUndefined()
  })
})
