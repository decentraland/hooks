import { LocalizedField } from "@dcl/schemas"
import { renderHook, waitFor } from "@testing-library/react"
import { useGetContentful } from "../../src/hooks/useGetContentful"
import { mockAssetData, mockEntryData } from "../__mocks__/contentful"

// Setup fetch mock
global.fetch = jest.fn()

const CONTENTFUL_TYPES = {
  ENTRIES: "entries",
  ASSETS: "assets",
} as const

jest.mock("../../src/config", () => ({
  config: {
    get: (key: string) =>
      ({
        CONTENTFUL_CDN_URL: "https://cdn.decentraland.org",
        CONTENTFUL_SPACE_ID: "ea2ybdmmn1kv",
        CONTENTFUL_ENV: "master",
      })[key] || "",
  },
}))

interface ContentNode {
  content?: ContentNode[]
  data: Record<string, unknown>
  marks?: { type: string }[]
  nodeType: string
  value?: string
}

type TestEntry = {
  [key: string]: LocalizedField<string | ContentNode>
  answer: LocalizedField<ContentNode>
  question: LocalizedField<string>
}

describe("useGetContentful", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it("should fetch and return entry data successfully", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockEntryData),
    })

    const { result } = renderHook(() =>
      useGetContentful<TestEntry>(
        "1gWkSpXTOp0HVYpNjdP47K",
        CONTENTFUL_TYPES.ENTRIES
      )
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.data).toMatchObject(mockEntryData.fields)
  })

  it("should fetch and return asset data successfully", async () => {
    ;(global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(mockAssetData),
    })

    const { result } = renderHook(() =>
      useGetContentful("5ISXz4rFU6S5D3tx5sgxQM", CONTENTFUL_TYPES.ASSETS)
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBeNull()
    expect(result.current.data).toMatchObject(mockAssetData)
  })

  it("should handle fetch error", async () => {
    ;(global.fetch as jest.Mock).mockImplementationOnce(() =>
      Promise.reject(new Error("Network error"))
    )

    const { result } = renderHook(() =>
      useGetContentful("test-id", CONTENTFUL_TYPES.ENTRIES)
    )

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false)
    })

    expect(result.current.error).toBe("Network error")
    expect(result.current.data).toBeNull()
  })

  it("should cleanup on unmount", async () => {
    const promise = new Promise((resolve) => setTimeout(resolve, 100))
    ;(global.fetch as jest.Mock).mockImplementationOnce(() => promise)

    const { unmount } = renderHook(() =>
      useGetContentful<TestEntry>(
        "1gWkSpXTOp0HVYpNjdP47K",
        CONTENTFUL_TYPES.ENTRIES
      )
    )

    unmount()
    await promise
    expect(global.fetch).toHaveBeenCalledTimes(1)
  })

  it("should abort fetch on unmount", async () => {
    const neverResolve = new Promise(() => {})
    ;(global.fetch as jest.Mock).mockImplementationOnce(() => neverResolve)

    const { unmount } = renderHook(() =>
      useGetContentful<TestEntry>(
        "1gWkSpXTOp0HVYpNjdP47K",
        CONTENTFUL_TYPES.ENTRIES
      )
    )

    unmount()

    expect(global.fetch).toHaveBeenCalledTimes(1)
  })
})
