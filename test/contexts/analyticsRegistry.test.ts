import type { AnalyticsBrowser } from "@segment/analytics-next"
import {
  getAnalytics,
  registerAnalyticsInstance,
  unregisterAnalyticsInstance,
} from "../../src/contexts/analytics/registry"

describe("when reading the analytics registry", () => {
  afterEach(() => {
    const current = getAnalytics()
    if (current) {
      unregisterAnalyticsInstance(current)
    }
  })

  describe("and no provider registered an instance", () => {
    it("should return null", () => {
      expect(getAnalytics()).toBeNull()
    })
  })

  describe("and a provider registered an instance", () => {
    let instance: AnalyticsBrowser

    beforeEach(() => {
      instance = { label: "instance" } as unknown as AnalyticsBrowser
      registerAnalyticsInstance(instance)
    })

    it("should return that instance", () => {
      expect(getAnalytics()).toBe(instance)
    })

    describe("and the instance unregisters", () => {
      beforeEach(() => {
        unregisterAnalyticsInstance(instance)
      })

      it("should return null", () => {
        expect(getAnalytics()).toBeNull()
      })
    })

    describe("and a newer instance registered before the older one unregisters", () => {
      let newer: AnalyticsBrowser

      beforeEach(() => {
        newer = { label: "newer" } as unknown as AnalyticsBrowser
        registerAnalyticsInstance(newer)
        unregisterAnalyticsInstance(instance)
      })

      it("should keep returning the newer instance", () => {
        expect(getAnalytics()).toBe(newer)
      })
    })
  })
})
