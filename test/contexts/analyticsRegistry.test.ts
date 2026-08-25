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

    describe("and a second provider registers another instance while this one is registered", () => {
      let consoleWarn: jest.SpyInstance
      let other: AnalyticsBrowser

      beforeEach(() => {
        consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {})
        other = { label: "other" } as unknown as AnalyticsBrowser
        registerAnalyticsInstance(other)
      })

      afterEach(() => {
        consoleWarn.mockRestore()
      })

      it("should warn that more than one provider is mounted", () => {
        expect(consoleWarn).toHaveBeenCalledWith(
          expect.stringContaining("AnalyticsProvider")
        )
      })

      it("should return the instance that registered last", () => {
        expect(getAnalytics()).toBe(other)
      })
    })

    describe("and the same instance registers again", () => {
      let consoleWarn: jest.SpyInstance

      beforeEach(() => {
        consoleWarn = jest.spyOn(console, "warn").mockImplementation(() => {})
        registerAnalyticsInstance(instance)
      })

      afterEach(() => {
        consoleWarn.mockRestore()
      })

      it("should not warn", () => {
        expect(consoleWarn).not.toHaveBeenCalled()
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
