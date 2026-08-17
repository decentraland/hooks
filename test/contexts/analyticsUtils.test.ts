import {
  resolveApiHost,
  resolveCdnUrl,
} from "../../src/contexts/analytics/utils"

describe("analytics utils", () => {
  let consoleWarn: jest.SpyInstance

  beforeEach(() => {
    consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarn.mockRestore()
  })

  describe("resolveCdnUrl", () => {
    describe("when no cdn url is provided", () => {
      it("should return undefined without warning", () => {
        expect(resolveCdnUrl()).toBeUndefined()
        expect(resolveCdnUrl("")).toBeUndefined()
        expect(consoleWarn).not.toHaveBeenCalled()
      })
    })

    describe("when the cdn url is served over https", () => {
      it("should return it", () => {
        expect(resolveCdnUrl("https://analytics.example.com")).toBe(
          "https://analytics.example.com"
        )
      })

      it("should keep the path the proxy serves it from", () => {
        expect(resolveCdnUrl("https://analytics.example.com/aPath")).toBe(
          "https://analytics.example.com/aPath"
        )
      })
    })

    describe("when the cdn url ends with a slash", () => {
      it("should drop it, the settings path is appended to it", () => {
        expect(resolveCdnUrl("https://analytics.example.com/")).toBe(
          "https://analytics.example.com"
        )
      })
    })

    describe("when the cdn url belongs to the app's own origin", () => {
      it("should return it resolved even though the app is not served over https", () => {
        expect(resolveCdnUrl("/aPath")).toBe(`${window.location.origin}/aPath`)
      })
    })

    describe.each([
      ["malformed", "http://["],
      ["not served over https", "http://analytics.example.com"],
    ])("when the cdn url is %s", (_case, cdnUrl) => {
      it("should warn about it and ignore it", () => {
        expect(resolveCdnUrl(cdnUrl)).toBeUndefined()
        expect(consoleWarn).toHaveBeenCalled()
      })
    })
  })

  describe("resolveApiHost", () => {
    describe("when no api host is provided", () => {
      it("should return undefined without warning", () => {
        expect(resolveApiHost()).toBeUndefined()
        expect(resolveApiHost("")).toBeUndefined()
        expect(consoleWarn).not.toHaveBeenCalled()
      })
    })

    describe("when the api host carries no protocol", () => {
      it("should return it as analytics-next expects it", () => {
        expect(resolveApiHost("analytics.example.com/v1")).toBe(
          "analytics.example.com/v1"
        )
      })

      it("should return the bare host when it carries no base path", () => {
        expect(resolveApiHost("analytics.example.com")).toBe(
          "analytics.example.com"
        )
      })
    })

    describe("when the api host carries the protocol", () => {
      it("should strip it, analytics-next prepends its own", () => {
        expect(resolveApiHost("https://analytics.example.com/v1")).toBe(
          "analytics.example.com/v1"
        )
      })
    })

    describe.each([
      ["malformed", "http://["],
      ["not served over https", "http://analytics.example.com/v1"],
    ])("when the api host is %s", (_case, apiHost) => {
      it("should warn about it and ignore it", () => {
        expect(resolveApiHost(apiHost)).toBeUndefined()
        expect(consoleWarn).toHaveBeenCalled()
      })
    })
  })
})
