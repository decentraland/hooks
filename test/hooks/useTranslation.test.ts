import { act, renderHook } from "@testing-library/react/pure"
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
})
