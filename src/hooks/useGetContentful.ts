import { useState } from "react"
import {
  ContentfulAsset,
  ContentfulEntry,
  FileType,
  LocalizedField,
  LocalizedFieldType,
  LocalizedFields,
} from "@dcl/schemas"
import { useAsyncEffect } from "./useAsyncEffect"
import { config } from "../config"

const CONTENTFUL_CDN_URL = config.get("CONTENTFUL_CDN_URL")
const SPACE_ID = config.get("CONTENTFUL_SPACE_ID")
const ENVIRONMENT = config.get("CONTENTFUL_ENV")

interface ContentfulAssetResponse {
  fields: {
    title: string
    description: string
    file: FileType
  }
  metadata: {
    tags: string[]
    concepts: string[]
  }
  sys: ContentfulAsset["sys"]
}

interface ContentfulEntryResponse<T extends LocalizedFields> {
  fields: T
  metadata?: {
    tags: string[]
    concepts: string[]
  }
  sys: ContentfulEntry<T>["sys"]
  includes?: {
    Asset?: ContentfulAsset[]
  }
}

const useGetContentful = <
  T extends Record<string, LocalizedField<LocalizedFieldType>>,
>(
  id: string,
  type: "assets" | "entries"
): {
  data: T | ContentfulAssetResponse | null
  assets: Record<string, ContentfulAsset>
  isLoading: boolean
  error: string | null
} => {
  const [data, setData] = useState<T | ContentfulAssetResponse | null>(null)
  const [assets, setAssets] = useState<Record<string, ContentfulAsset>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useAsyncEffect(async () => {
    const abortController = new AbortController()

    try {
      const response = await fetch(
        `${CONTENTFUL_CDN_URL}/spaces/${SPACE_ID}/environments/${ENVIRONMENT}/${type}/${id}/`,
        {
          signal: abortController.signal,
        }
      )
      if (!response.ok) {
        throw new Error("Failed to fetch data")
      }

      const responseData = await response.json()

      if (!responseData.fields) {
        throw new Error("No data found with the specified ID")
      }

      if (type === "entries") {
        const entryData = responseData as ContentfulEntryResponse<T>
        setData(entryData.fields as T)
        const assetsMap = (entryData.includes?.Asset ?? []).reduce(
          (acc: Record<string, ContentfulAsset>, asset: ContentfulAsset) => {
            acc[asset.sys.id] = asset
            return acc
          },
          {}
        )
        setAssets(assetsMap)
      } else {
        setData(responseData as ContentfulAssetResponse)
      }
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return
      }
      setError(err instanceof Error ? err.message : "An error occurred")
    } finally {
      setIsLoading(false)
    }

    return () => {
      abortController.abort()
    }
  }, [id, type])

  return { data, assets, isLoading, error }
}

export { useGetContentful }
