import { renderHook } from "@testing-library/react/pure"
import { UAParser } from "ua-parser-js"
import { isAppleSilicon } from "ua-parser-js/device-detection"
import {
  getAdvancedUserAgentData,
  useAdvancedUserAgentData,
} from "../../src/hooks/useAdvancedUserAgentData"
import { resetUserAgentCache } from "../../src/hooks/useAdvancedUserAgentData/useAdvancedUserAgentData"

jest.mock("ua-parser-js")
jest.mock("ua-parser-js/device-detection")
jest.mock("../__mocks__/sentry")

describe("getAdvancedUserAgentData", () => {
  const getOS = jest.fn()
  const mockUAParser = {
    getResult: jest.fn(),
    getBrowser: jest.fn(),
    getOS,
    getCPU: jest.fn(),
    getDevice: jest.fn(),
  }

  function windowsOnArm(osHints: Promise<unknown>) {
    mockUAParser.getResult.mockReturnValue({
      browser: { name: "Edge", version: "120.0" },
      engine: { name: "Blink", version: "120.0" },
      withClientHints: jest.fn().mockResolvedValue({ browser: {} }),
    })
    getOS.mockReturnValue({
      name: "Windows",
      withClientHints: jest.fn().mockReturnValue(osHints),
    })
    mockUAParser.getCPU.mockReturnValue({
      architecture: "amd64",
      withClientHints: jest.fn().mockResolvedValue({ architecture: "arm64" }),
    })
  }

  beforeEach(() => {
    jest.clearAllMocks()
    resetUserAgentCache()
    mockUAParser.getBrowser.mockImplementation(() => {
      const browser = mockUAParser.getResult()?.browser ?? {}
      return {
        ...browser,
        withFeatureCheck: jest.fn().mockReturnValue(browser),
      }
    })
    mockUAParser.getDevice.mockReturnValue({
      is: jest.fn().mockReturnValue(false),
    })
    ;(UAParser as unknown as jest.Mock).mockImplementation(() => mockUAParser)
    ;(isAppleSilicon as jest.Mock).mockReturnValue(false)
  })

  it("should resolve the Client Hints data the hook resolves", async () => {
    windowsOnArm(Promise.resolve({ name: "Windows", version: "11" }))

    await expect(getAdvancedUserAgentData()).resolves.toEqual({
      browser: { name: "Edge", version: "120.0" },
      engine: { name: "Blink", version: "120.0" },
      os: { name: "Windows", version: "11" },
      cpu: { architecture: "arm64" },
      mobile: false,
      tablet: false,
    })
  })

  it("should read the Client Hints once for concurrent callers and later ones", async () => {
    windowsOnArm(Promise.resolve({ name: "Windows", version: "11" }))

    await Promise.all([getAdvancedUserAgentData(), getAdvancedUserAgentData()])
    await getAdvancedUserAgentData()

    expect(getOS).toHaveBeenCalledTimes(1)
  })

  it("should give each caller its own copy", async () => {
    windowsOnArm(Promise.resolve({ name: "Windows", version: "11" }))

    const first = await getAdvancedUserAgentData()
    first!.os.name = "Changed"

    expect((await getAdvancedUserAgentData())?.os.name).toBe("Windows")
  })

  it("should fall back to the user agent when the Client Hints reject", async () => {
    windowsOnArm(Promise.reject(new Error("blocked")))

    const data = await getAdvancedUserAgentData()

    expect(data?.os.name).toBe("Windows")
    expect(data?.cpu.architecture).toBe("amd64")
  })

  it("should share its result with the hook, which then starts resolved", async () => {
    windowsOnArm(Promise.resolve({ name: "Windows", version: "11" }))
    await getAdvancedUserAgentData()

    const { result } = renderHook(() => useAdvancedUserAgentData())

    expect(result.current[0]).toBe(false)
    expect(result.current[1]?.cpu.architecture).toBe("arm64")
    expect(getOS).toHaveBeenCalledTimes(1)
  })

  it("should let a later call retry after a read that threw", async () => {
    mockUAParser.getResult.mockImplementationOnce(() => {
      throw new Error("parser failed")
    })
    await expect(getAdvancedUserAgentData()).rejects.toThrow("parser failed")

    windowsOnArm(Promise.resolve({ name: "Windows", version: "11" }))
    await expect(getAdvancedUserAgentData()).resolves.toMatchObject({
      os: { name: "Windows" },
    })
  })
})
