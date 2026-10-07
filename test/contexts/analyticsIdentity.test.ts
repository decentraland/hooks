/** @jest-environment-options {"url":"https://decentraland.org/"} */
import { Analytics } from "@segment/analytics-next"

const COOKIE_ID = "11111111-1111-4111-8111-111111111111"
const LOCAL_ID = "22222222-2222-4222-8222-222222222222"

describe("when the installed analytics SDK resolves anonymous identity", () => {
  let analytics: Analytics

  afterEach(() => {
    localStorage.clear()
    document.cookie = "ajs_anonymous_id=; path=/; max-age=0"
    document.cookie =
      "ajs_anonymous_id=; domain=.decentraland.org; path=/; max-age=0"
  })

  describe("and shared cookie and origin-local storage disagree", () => {
    beforeEach(() => {
      document.cookie = `ajs_anonymous_id=${COOKIE_ID}; domain=.decentraland.org; path=/`
      localStorage.setItem("ajs_anonymous_id", JSON.stringify(LOCAL_ID))
      analytics = new Analytics({ writeKey: "identity-regression-test" })
    })

    it("should retain the shared cookie identity and reconcile localStorage", () => {
      expect(analytics.user().anonymousId()).toBe(COOKIE_ID)
      expect(localStorage.getItem("ajs_anonymous_id")).toBe(
        JSON.stringify(COOKIE_ID)
      )
    })
  })

  describe("and the shared cookie is empty", () => {
    beforeEach(() => {
      document.cookie = "ajs_anonymous_id=; domain=.decentraland.org; path=/"
      localStorage.setItem("ajs_anonymous_id", JSON.stringify(LOCAL_ID))
      analytics = new Analytics({ writeKey: "identity-regression-test" })
    })

    it("should retain the existing localStorage identity", () => {
      expect(analytics.user().anonymousId()).toBe(LOCAL_ID)
    })
  })

  describe("and identity was persisted before SDK boot", () => {
    beforeEach(() => {
      document.cookie = `ajs_anonymous_id=${COOKIE_ID}; domain=.decentraland.org; path=/`
      localStorage.setItem("ajs_anonymous_id", JSON.stringify(COOKIE_ID))
      analytics = new Analytics({ writeKey: "identity-regression-test" })
    })

    it("should adopt that identity without minting another", () => {
      expect(analytics.user().anonymousId()).toBe(COOKIE_ID)
    })
  })
})
