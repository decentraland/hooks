import { useState } from "react"
import { UAParser } from "ua-parser-js"
import { isAppleSilicon } from "ua-parser-js/helpers"
import { useAsyncEffect } from "./useAsyncEffect"
const DEFAULT_VALUE = "Unknown"

export type AdvancedNavigatorUAData = {
  browser: {
    name: string
    version: string
  }
  engine: {
    name: string
    version: string
  }
  os: {
    name: string
    version: string
  }
  cpu: {
    architecture: string
  }
  mobile: boolean
  tablet: boolean
}

/**
 * extract or infer the [UserAgentData](https://developer.mozilla.org/en-US/docs/Web/API/Navigator/userAgentData)
 * that is an object which can be used to access the User-Agent Client Hints API.
 */
export function useAdvancedUserAgentData(): [
  boolean,
  AdvancedNavigatorUAData | undefined,
] {
  const [isLoading, setLoading] = useState(true)
  const [data, setData] = useState<AdvancedNavigatorUAData>()

  useAsyncEffect(async () => {
    setLoading(true)
    const ua = new UAParser(navigator.userAgent)
    const uaData = ua.getResult()
    const uaDataWithClientHints = await uaData.withClientHints()
    const browser = {
      name: uaData.browser.name ?? DEFAULT_VALUE,
      version: uaData.browser.version ?? DEFAULT_VALUE,
    }
    const engine = {
      name: uaData.engine.name ?? DEFAULT_VALUE,
      version: uaData.engine.version ?? DEFAULT_VALUE,
    }
    const [osData, cpuData] = await Promise.all([
      ua.getOS().withClientHints(),
      ua.getCPU().withClientHints(),
    ])

    const os = {
      name: osData.name ?? DEFAULT_VALUE,
      version: osData.version ?? DEFAULT_VALUE,
    }

    let architecture: string
    if (!cpuData.architecture) {
      architecture =
        os.name === "macOS" && isAppleSilicon(uaDataWithClientHints)
          ? "arm64"
          : "Unknown"
    } else {
      architecture = cpuData.architecture
    }

    setData({
      browser,
      engine,
      os,
      cpu: {
        architecture,
      },
      mobile: ua.getDevice().is("mobile"),
      tablet: ua.getDevice().is("tablet"),
    })

    setLoading(false)
  }, [])

  return [isLoading, data]
}
