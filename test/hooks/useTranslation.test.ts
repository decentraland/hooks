/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from "react"
import { act, renderHook } from "@testing-library/react/pure"
import { TranslationProvider } from "../../src/contexts/translation/TranslationProvider"
import { useTranslation } from "../../src/hooks/useTranslation"
import type { LanguageTranslations } from "../../src/hooks/useTranslation"

describe("useTranslation", () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.spyOn(console, "warn").mockImplementation()
    jest.spyOn(console, "error").mockImplementation()
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  describe("when initialized with a locale", () => {
    let mockTranslations: LanguageTranslations

    beforeEach(() => {
      mockTranslations = {
        en: {
          greeting: "Hello, {name}!",
          welcome: "Welcome to our app",
          simple: "Simple text",
        },
        es: {
          greeting: "Hola, {name}!",
          welcome: "Bienvenido a nuestra aplicación",
          simple: "Texto simple",
        },
      }
    })

    it("should set the initial locale correctly", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      expect(result.current.locale).toBe("en")
    })

    it("should initialize with no error", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      expect(result.current.error).toBe(null)
    })
  })

  describe("when translating simple keys", () => {
    let mockTranslations: LanguageTranslations

    beforeEach(() => {
      mockTranslations = {
        en: {
          simple: "Simple text",
        },
      }
    })

    it("should return the translated text", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      expect(result.current.t("simple")).toBe("Simple text")
    })
  })

  describe("when translating with interpolation", () => {
    describe("and using a single placeholder", () => {
      let mockTranslations: LanguageTranslations

      beforeEach(() => {
        mockTranslations = {
          en: {
            greeting: "Hello, {name}!",
          },
        }
      })

      it("should interpolate the value correctly", () => {
        const { result } = renderHook(() =>
          useTranslation({
            locale: "en",
            translations: mockTranslations,
          })
        )

        expect(result.current.t("greeting", { name: "John" })).toBe(
          "Hello, John!"
        )
      })
    })

    describe("and using multiple placeholders", () => {
      let mockTranslations: LanguageTranslations

      beforeEach(() => {
        mockTranslations = {
          en: {
            message: "Hello {firstName} {lastName}, you have {count} messages",
          },
        }
      })

      it("should interpolate all values correctly", () => {
        const { result } = renderHook(() =>
          useTranslation({
            locale: "en",
            translations: mockTranslations,
          })
        )

        const translation = result.current.t("message", {
          firstName: "John",
          lastName: "Doe",
          count: 5,
        })

        expect(translation).toBe("Hello John Doe, you have 5 messages")
      })
    })
  })

  describe("when changing locales", () => {
    let mockTranslations: LanguageTranslations

    beforeEach(() => {
      mockTranslations = {
        en: {
          simple: "Simple text",
          greeting: "Hello, {name}!",
        },
        es: {
          simple: "Texto simple",
          greeting: "Hola, {name}!",
        },
        fr: {
          greeting: "Bonjour, {name}!",
        },
      }
    })

    it("should update the locale", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      act(() => {
        result.current.setLocale("es")
      })

      expect(result.current.locale).toBe("es")
    })

    it("should return translations for the new locale", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      act(() => {
        result.current.setLocale("es")
      })

      expect(result.current.t("simple")).toBe("Texto simple")
    })

    it("should handle multiple locale changes correctly", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      expect(result.current.t("greeting", { name: "Alice" })).toBe(
        "Hello, Alice!"
      )

      act(() => {
        result.current.setLocale("es")
      })

      expect(result.current.t("greeting", { name: "Alice" })).toBe(
        "Hola, Alice!"
      )

      act(() => {
        result.current.setLocale("fr")
      })

      expect(result.current.t("greeting", { name: "Alice" })).toBe(
        "Bonjour, Alice!"
      )
    })
  })

  describe("when a translation key is not found", () => {
    describe("and no fallback locale is configured", () => {
      let mockTranslations: LanguageTranslations

      beforeEach(() => {
        mockTranslations = {
          en: {
            simple: "Simple text",
          },
        }
      })

      it("should return the key itself", () => {
        const { result } = renderHook(() =>
          useTranslation({
            locale: "en",
            translations: mockTranslations,
          })
        )

        const translation = result.current.t("nonexistent.key")

        expect(translation).toBe("nonexistent.key")
      })
    })

    describe("and a fallback locale is configured", () => {
      describe("and the key exists in the fallback locale", () => {
        let mockTranslations: LanguageTranslations

        beforeEach(() => {
          mockTranslations = {
            en: {
              welcome: "Welcome to our app",
            },
            fr: {
              greeting: "Bonjour!",
            },
          }
        })

        it("should return the translation from the fallback locale", () => {
          const { result } = renderHook(() =>
            useTranslation({
              locale: "fr",
              translations: mockTranslations,
              fallbackLocale: "en",
            })
          )

          const translation = result.current.t("welcome")

          expect(translation).toBe("Welcome to our app")
        })
      })

      describe("and the key does not exist in the fallback locale", () => {
        let mockTranslations: LanguageTranslations

        beforeEach(() => {
          mockTranslations = {
            en: {
              welcome: "Welcome",
            },
            fr: {
              greeting: "Bonjour!",
            },
          }
        })

        it("should return the key itself", () => {
          const { result } = renderHook(() =>
            useTranslation({
              locale: "fr",
              translations: mockTranslations,
              fallbackLocale: "en",
            })
          )

          const translation = result.current.t("nonexistent.key")

          expect(translation).toBe("nonexistent.key")
        })
      })
    })
  })

  describe("when using the intl object", () => {
    let mockTranslations: LanguageTranslations

    beforeEach(() => {
      mockTranslations = {
        en: {
          greeting: "Hello!",
        },
      }
    })

    it("should provide access to formatNumber", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      const formatted = result.current.intl.formatNumber(1000)

      expect(formatted).toBe("1,000")
    })

    it("should provide access to formatDate", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      const date = new Date(Date.UTC(2024, 0, 15))
      const formatted = result.current.intl.formatDate(date, {
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: "UTC",
      })

      expect(formatted).toBe("January 15, 2024")
    })

    it("should provide access to formatMessage", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      const formatted = result.current.intl.formatMessage({ id: "greeting" })

      expect(formatted).toBe("Hello!")
    })
  })

  describe("when setting an invalid locale", () => {
    let mockTranslations: LanguageTranslations
    let consoleErrorSpy: jest.SpyInstance

    beforeEach(() => {
      mockTranslations = {
        en: {
          simple: "Simple text",
        },
        es: {
          simple: "Texto simple",
        },
        fr: {
          simple: "Texte simple",
        },
      }
      consoleErrorSpy = jest.spyOn(console, "error")
    })

    it("should keep the current locale unchanged", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      act(() => {
        result.current.setLocale("de")
      })

      expect(result.current.locale).toBe("en")
    })

    it("should set an error message", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      act(() => {
        result.current.setLocale("de")
      })

      expect(result.current.error).toBe('Locale "de" not found')
    })

    it("should log an error with available locales", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      act(() => {
        result.current.setLocale("de")
      })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Locale "de" not found in translations. Available locales: en, es, fr'
      )
    })
  })

  describe("when setting a valid locale after an invalid one", () => {
    let mockTranslations: LanguageTranslations

    beforeEach(() => {
      mockTranslations = {
        en: {
          simple: "Simple text",
        },
        es: {
          simple: "Texto simple",
        },
      }
    })

    it("should clear the error", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      act(() => {
        result.current.setLocale("de")
      })

      expect(result.current.error).toBe('Locale "de" not found')

      act(() => {
        result.current.setLocale("es")
      })

      expect(result.current.error).toBe(null)
    })

    it("should update to the new valid locale", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      act(() => {
        result.current.setLocale("de")
      })

      act(() => {
        result.current.setLocale("es")
      })

      expect(result.current.locale).toBe("es")
    })
  })

  describe("when using context mode", () => {
    let mockTranslations: LanguageTranslations

    beforeEach(() => {
      mockTranslations = {
        en: {
          greeting: "Hello!",
          welcome: "Welcome",
        },
        es: {
          greeting: "Hola!",
          welcome: "Bienvenido",
        },
      }
    })

    it("should use translations from TranslationProvider", () => {
      const wrapper = ({ children }: { children: ReactNode }) =>
        TranslationProvider({
          locale: "en",
          translations: mockTranslations,
          children,
        })

      const { result } = renderHook(() => useTranslation(), { wrapper })

      expect(result.current.locale).toBe("en")
      expect(result.current.t("greeting")).toBe("Hello!")
    })

    it("should allow changing locale through context", () => {
      const wrapper = ({ children }: { children: ReactNode }) =>
        TranslationProvider({
          locale: "en",
          translations: mockTranslations,
          children,
        })

      const { result } = renderHook(() => useTranslation(), { wrapper })

      act(() => {
        result.current.setLocale("es")
      })

      expect(result.current.locale).toBe("es")
      expect(result.current.t("greeting")).toBe("Hola!")
    })

    it("should support fallback locale through context", () => {
      const translationsWithFallback: LanguageTranslations = {
        en: {
          welcome: "Welcome",
        },
        fr: {
          greeting: "Bonjour!",
        },
      }

      const wrapper = ({ children }: { children: ReactNode }) =>
        TranslationProvider({
          locale: "fr",
          translations: translationsWithFallback,
          fallbackLocale: "en",
          children,
        })

      const { result } = renderHook(() => useTranslation(), { wrapper })

      expect(result.current.t("welcome")).toBe("Welcome")
    })
  })

  describe("when validation errors occur", () => {
    describe("and used without options and without context", () => {
      it("should throw an error", () => {
        expect(() => renderHook(() => useTranslation())).toThrow(
          "useTranslation must be used with either options or within a TranslationProvider"
        )
      })
    })

    describe("and used with options but without locale", () => {
      let mockTranslations: LanguageTranslations

      beforeEach(() => {
        mockTranslations = {
          en: {
            greeting: "Hello!",
          },
        }
      })

      it("should throw an error", () => {
        expect(() =>
          renderHook(() =>
            useTranslation({
              translations: mockTranslations,
            } as any)
          )
        ).toThrow("locale is required when using useTranslation with options")
      })
    })

    describe("and used with options but without translations", () => {
      it("should throw an error", () => {
        expect(() =>
          renderHook(() =>
            useTranslation({
              locale: "en",
            } as any)
          )
        ).toThrow(
          "translations is required when using useTranslation with options"
        )
      })
    })
  })

  describe("when initial locale has no translations", () => {
    describe("and fallback locale is available", () => {
      let mockTranslations: LanguageTranslations
      let consoleErrorSpy: jest.SpyInstance

      beforeEach(() => {
        mockTranslations = {
          en: {
            greeting: "Hello!",
            welcome: "Welcome",
          },
        }
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()
      })

      it("should use fallback locale translations", () => {
        const { result } = renderHook(() =>
          useTranslation({
            locale: "fr",
            translations: mockTranslations,
            fallbackLocale: "en",
          })
        )

        expect(result.current.t("greeting")).toBe("Hello!")
        expect(result.current.t("welcome")).toBe("Welcome")
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'No translations found for locale "fr". Using fallback locale "en".'
        )
      })
    })

    describe("and no fallback locale is available", () => {
      let mockTranslations: LanguageTranslations
      let consoleErrorSpy: jest.SpyInstance

      beforeEach(() => {
        mockTranslations = {
          en: {
            greeting: "Hello!",
          },
        }
        consoleErrorSpy = jest.spyOn(console, "error").mockImplementation()
      })

      it("should use empty translations", () => {
        const { result } = renderHook(() =>
          useTranslation({
            locale: "fr",
            translations: mockTranslations,
          })
        )

        expect(result.current.t("greeting")).toBe("greeting")
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'No translations found for locale "fr". Using empty translations.'
        )
      })
    })
  })

  describe("when merging fallback locale with current locale", () => {
    let mockTranslations: LanguageTranslations

    beforeEach(() => {
      mockTranslations = {
        en: {
          greeting: "Hello!",
          welcome: "Welcome",
          common: "Common text",
        },
        fr: {
          greeting: "Bonjour!",
          common: "Texte commun",
        },
      }
    })

    it("should merge fallback translations with current locale translations", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "fr",
          translations: mockTranslations,
          fallbackLocale: "en",
        })
      )

      expect(result.current.t("greeting")).toBe("Bonjour!")
      expect(result.current.t("welcome")).toBe("Welcome")
      expect(result.current.t("common")).toBe("Texte commun")
    })

    it("should prioritize current locale over fallback when both have the same key", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "fr",
          translations: mockTranslations,
          fallbackLocale: "en",
        })
      )

      expect(result.current.t("common")).toBe("Texte commun")
    })
  })

  describe("when using advanced intl formatting", () => {
    let mockTranslations: LanguageTranslations

    beforeEach(() => {
      mockTranslations = {
        en: {
          greeting: "Hello!",
        },
      }
    })

    it("should format numbers as currency", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      const formatted = result.current.intl.formatNumber(99.99, {
        style: "currency",
        currency: "USD",
      })

      expect(formatted).toBe("$99.99")
    })

    it("should format relative time", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      const formatted = result.current.intl.formatRelativeTime(-1, "day")

      expect(["yesterday", "1 day ago"]).toContain(formatted)
    })

    it("should format numbers with custom options", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      const formatted = result.current.intl.formatNumber(0.1234, {
        style: "percent",
        minimumFractionDigits: 2,
      })

      expect(formatted).toBe("12.34%")
    })
  })

  describe("when using ICU message syntax", () => {
    describe("and using pluralization", () => {
      let mockTranslations: LanguageTranslations

      beforeEach(() => {
        mockTranslations = {
          en: {
            items:
              "{count, plural, =0 {No items} one {# item} other {# items}}",
          },
          es: {
            items:
              "{count, plural, =0 {Sin elementos} one {# elemento} other {# elementos}}",
          },
        }
      })

      it("should handle zero count", () => {
        const { result } = renderHook(() =>
          useTranslation({
            locale: "en",
            translations: mockTranslations,
          })
        )

        expect(result.current.t("items", { count: 0 })).toBe("No items")
      })

      it("should handle singular count", () => {
        const { result } = renderHook(() =>
          useTranslation({
            locale: "en",
            translations: mockTranslations,
          })
        )

        expect(result.current.t("items", { count: 1 })).toBe("1 item")
      })

      it("should handle plural count", () => {
        const { result } = renderHook(() =>
          useTranslation({
            locale: "en",
            translations: mockTranslations,
          })
        )

        expect(result.current.t("items", { count: 5 })).toBe("5 items")
      })

      it("should handle pluralization in different locales", () => {
        const { result } = renderHook(() =>
          useTranslation({
            locale: "es",
            translations: mockTranslations,
          })
        )

        expect(result.current.t("items", { count: 1 })).toBe("1 elemento")
        expect(result.current.t("items", { count: 5 })).toBe("5 elementos")
      })
    })

    describe("and using select syntax", () => {
      let mockTranslations: LanguageTranslations

      beforeEach(() => {
        mockTranslations = {
          en: {
            gender: "{gender, select, male {He} female {She} other {They}}",
          },
        }
      })

      it("should handle select with male option", () => {
        const { result } = renderHook(() =>
          useTranslation({
            locale: "en",
            translations: mockTranslations,
          })
        )

        expect(result.current.t("gender", { gender: "male" })).toBe("He")
      })

      it("should handle select with female option", () => {
        const { result } = renderHook(() =>
          useTranslation({
            locale: "en",
            translations: mockTranslations,
          })
        )

        expect(result.current.t("gender", { gender: "female" })).toBe("She")
      })

      it("should handle select with other option", () => {
        const { result } = renderHook(() =>
          useTranslation({
            locale: "en",
            translations: mockTranslations,
          })
        )

        expect(result.current.t("gender", { gender: "unknown" })).toBe("They")
      })
    })

    describe("and using complex ICU syntax", () => {
      let mockTranslations: LanguageTranslations

      beforeEach(() => {
        mockTranslations = {
          en: {
            notification:
              "{count, plural, =0 {No notifications} =1 {You have one notification} other {You have # notifications}}",
          },
        }
      })

      it("should handle complex plural with specific values", () => {
        const { result } = renderHook(() =>
          useTranslation({
            locale: "en",
            translations: mockTranslations,
          })
        )

        expect(result.current.t("notification", { count: 0 })).toBe(
          "No notifications"
        )
        expect(result.current.t("notification", { count: 1 })).toBe(
          "You have one notification"
        )
        expect(result.current.t("notification", { count: 5 })).toBe(
          "You have 5 notifications"
        )
      })
    })
  })

  describe("when using additional intl formatting functions", () => {
    let mockTranslations: LanguageTranslations

    beforeEach(() => {
      mockTranslations = {
        en: {
          greeting: "Hello!",
        },
      }
    })

    it("should format lists", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      const formatted = result.current.intl.formatList([
        "apple",
        "banana",
        "orange",
      ])

      expect([
        "apple, banana, and orange",
        "apple, banana, and orange",
      ]).toContain(formatted)
    })

    it("should format display names for languages", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      const formatted = result.current.intl.formatDisplayName("es", {
        type: "language",
      })

      expect(formatted).toBe("Spanish")
    })

    it("should format display names for countries", () => {
      const { result } = renderHook(() =>
        useTranslation({
          locale: "en",
          translations: mockTranslations,
        })
      )

      const formatted = result.current.intl.formatDisplayName("US", {
        type: "region",
      })

      expect(["United States", "US"]).toContain(formatted)
    })
  })
})
