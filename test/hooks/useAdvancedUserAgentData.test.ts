import { renderHook } from "@testing-library/react/pure"
import { UAParser } from "ua-parser-js"
import { isAppleSilicon } from "ua-parser-js/helpers"
import { useAdvancedUserAgentData } from "../../src/hooks/useAdvancedUserAgentData"

jest.mock("ua-parser-js")
jest.mock("ua-parser-js/helpers")
jest.mock("../__mocks__/sentry")

describe("useAdvancedUserAgentData", () => {
  const mockUAParser = {
    getResult: jest.fn(),
    getOS: jest.fn(),
    getCPU: jest.fn(),
    getDevice: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    ;(UAParser as unknown as jest.Mock).mockImplementation(() => mockUAParser)
    ;(isAppleSilicon as jest.Mock).mockReturnValue(false)
  })

  it("should detect Chrome on Windows", async () => {
    mockUAParser.getResult.mockReturnValue({
      browser: { name: "Chrome", version: "100.0" },
      engine: { name: "Blink", version: "100.0" },
      withClientHints: jest.fn().mockResolvedValue({}),
    })

    mockUAParser.getOS.mockReturnValue({
      withClientHints: jest.fn().mockResolvedValue({
        name: "Windows",
        version: "10",
      }),
    })

    mockUAParser.getCPU.mockReturnValue({
      withClientHints: jest.fn().mockResolvedValue({
        architecture: "amd64",
      }),
    })

    mockUAParser.getDevice.mockReturnValue({
      is: jest.fn().mockReturnValue(false),
    })

    const { result } = renderHook(() => useAdvancedUserAgentData())

    expect(result.current[0]).toBe(true)
    expect(result.current[1]).toBeUndefined()

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(result.current[0]).toBe(false)
    expect(result.current[1]).toEqual({
      browser: { name: "Chrome", version: "100.0" },
      engine: { name: "Blink", version: "100.0" },
      os: { name: "Windows", version: "10" },
      cpu: { architecture: "amd64" },
      mobile: false,
    })
  })

  it("should detect Apple Silicon", async () => {
    mockUAParser.getResult.mockReturnValue({
      browser: { name: "Safari", version: "15.0" },
      engine: { name: "WebKit", version: "15.0" },
      withClientHints: jest.fn().mockResolvedValue({ platform: "macOS" }),
    })

    mockUAParser.getOS.mockReturnValue({
      withClientHints: jest.fn().mockResolvedValue({
        name: "macOS",
        version: "12.0",
      }),
    })

    mockUAParser.getCPU.mockReturnValue({
      withClientHints: jest.fn().mockResolvedValue({
        architecture: null,
      }),
    })

    mockUAParser.getDevice.mockReturnValue({
      is: jest.fn().mockReturnValue(false),
    })
    ;(isAppleSilicon as jest.Mock).mockReturnValue(true)

    const { result } = renderHook(() => useAdvancedUserAgentData())

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(result.current[0]).toBe(false)
    expect(result.current[1]?.cpu.architecture).toBe("arm64")
  })

  it("should handle missing data", async () => {
    mockUAParser.getResult.mockReturnValue({
      browser: {},
      engine: {},
      withClientHints: jest.fn().mockResolvedValue({}),
    })

    mockUAParser.getOS.mockReturnValue({
      withClientHints: jest.fn().mockResolvedValue({}),
    })

    mockUAParser.getCPU.mockReturnValue({
      withClientHints: jest.fn().mockResolvedValue({}),
    })

    mockUAParser.getDevice.mockReturnValue({
      is: jest.fn().mockReturnValue(false),
    })

    const { result } = renderHook(() => useAdvancedUserAgentData())

    await new Promise((resolve) => setTimeout(resolve, 100))

    expect(result.current[0]).toBe(false)
    expect(result.current[1]).toEqual({
      browser: { name: "Unknown", version: "Unknown" },
      engine: { name: "Unknown", version: "Unknown" },
      os: { name: "Unknown", version: "Unknown" },
      cpu: { architecture: "Unknown" },
      mobile: false,
    })
  })

  it("should return default values when userAgentData is not available", async () => {
    const { result } = renderHook(() => useAdvancedUserAgentData())
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(result.current[1]).toEqual({
      browser: { name: "Unknown", version: "Unknown" },
      engine: { name: "Unknown", version: "Unknown" },
      os: { name: "Unknown", version: "Unknown" },
      cpu: { architecture: "Unknown" },
      mobile: false,
    })
  })

  it("should return values from userAgentData when available", async () => {
    const mockUserAgentData = {
      mobile: true,
      platform: "Windows",
      platformVersion: "10.0",
      brands: [{ brand: "Chrome", version: "91" }],
    }

    Object.defineProperty(navigator, "userAgentData", {
      value: mockUserAgentData,
      configurable: true,
    })

    mockUAParser.getResult.mockReturnValue({
      browser: { name: "Chrome", version: "91" },
      engine: { name: "Blink", version: "91" },
      withClientHints: jest.fn().mockResolvedValue({}),
    })

    mockUAParser.getOS.mockReturnValue({
      withClientHints: jest.fn().mockResolvedValue({
        name: "Windows",
        version: "10.0",
      }),
    })

    mockUAParser.getCPU.mockReturnValue({
      withClientHints: jest.fn().mockResolvedValue({
        architecture: "amd64",
      }),
    })

    mockUAParser.getDevice.mockReturnValue({
      is: jest.fn().mockReturnValue(true),
    })

    const { result } = renderHook(() => useAdvancedUserAgentData())
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(result.current[1]).toEqual({
      browser: { name: "Chrome", version: "91" },
      engine: { name: "Blink", version: "91" },
      os: { name: "Windows", version: "10.0" },
      cpu: { architecture: "amd64" },
      mobile: true,
    })
  })

  it("should handle missing brands information", async () => {
    const mockUserAgentData = {
      mobile: true,
      platform: "Windows",
      platformVersion: "10.0",
      brands: [],
    }

    Object.defineProperty(navigator, "userAgentData", {
      value: mockUserAgentData,
      configurable: true,
    })

    mockUAParser.getResult.mockReturnValue({
      browser: { name: "Unknown", version: "Unknown" },
      engine: { name: "Unknown", version: "Unknown" },
      withClientHints: jest.fn().mockResolvedValue({}),
    })

    mockUAParser.getOS.mockReturnValue({
      withClientHints: jest.fn().mockResolvedValue({
        name: "Windows",
        version: "10.0",
      }),
    })

    mockUAParser.getCPU.mockReturnValue({
      withClientHints: jest.fn().mockResolvedValue({
        architecture: "Unknown",
      }),
    })

    mockUAParser.getDevice.mockReturnValue({
      is: jest.fn().mockReturnValue(true),
    })

    const { result } = renderHook(() => useAdvancedUserAgentData())
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(result.current[1]).toEqual({
      browser: { name: "Unknown", version: "Unknown" },
      engine: { name: "Unknown", version: "Unknown" },
      os: { name: "Windows", version: "10.0" },
      cpu: { architecture: "Unknown" },
      mobile: true,
    })
  })
})
