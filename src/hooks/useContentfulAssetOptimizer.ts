import { useMemo } from "react"
import { memo } from "radash"

type ImageOptimizedFormats = Partial<{
  jpg: string
  png: string
  webp: string
  gif: string
}>

type ImageOptimized = ImageOptimizedFormats &
  Partial<{
    original: string
    originalFormat: keyof ImageOptimizedFormats
    optimized: string
  }>

function optimize(image?: string | null): ImageOptimized {
  if (!image) {
    return {}
  }

  try {
    if (image.startsWith("//")) {
      image = `https:${image}`
    }

    const url = new URL(image)
    url.hostname = "cms-images.decentraland.org"
    url.searchParams.set("q", "80")

    const jpg = new URL(url)
    jpg.searchParams.set("fm", "jpg")
    jpg.searchParams.set("fl", "progressive")

    const png = new URL(url)
    png.searchParams.set("fm", "png")

    const webp = new URL(url)
    webp.searchParams.set("fm", "webp")

    const gif = new URL(url)
    gif.searchParams.set("fm", "gif")

    const optimized =
      url.pathname.endsWith(".jpg") || url.pathname.endsWith(".jpeg")
        ? isWebpSupported()
          ? webp
          : jpg
        : url.pathname.endsWith(".webp")
          ? webp
          : url.pathname.endsWith(".png")
            ? png
            : url.pathname.endsWith(".gif")
              ? gif
              : undefined

    const originalFormat =
      url.pathname.endsWith(".jpg") || url.pathname.endsWith(".jpeg")
        ? "jpg"
        : url.pathname.endsWith(".png")
          ? "png"
          : url.pathname.endsWith(".webp")
            ? "webp"
            : url.pathname.endsWith(".gif")
              ? "gif"
              : undefined

    return {
      jpg: jpg.toString(),
      png: png.toString(),
      webp: webp.toString(),
      gif: gif.toString(),
      original: url.toString(),
      optimized: optimized && optimized.toString(),
      originalFormat,
    }
  } catch (err) {
    console.error(`Error optimizing:`, image, err)
    return {}
  }
}

function optimizeVideo(video?: string | null): string | null {
  if (!video) {
    return null
  }

  try {
    if (video.startsWith("//")) {
      video = `https:${video}`
    }

    const url = new URL(video)
    url.hostname = "cms-videos.decentraland.org"

    return url.toString()
  } catch (err) {
    console.error(`Error optimizing video:`, video, err)
    return null
  }
}

function useImageOptimization(image?: string | null): ImageOptimized {
  return useMemo(() => optimize(image), [image])
}

function useVideoOptimization(video?: string | null): string | null {
  return useMemo(() => optimizeVideo(video), [video])
}

const isWebpSupported = memo(
  () => {
    const elem =
      typeof document !== "undefined" && document.createElement("canvas")
    if (elem && elem.getContext && elem.getContext("2d")) {
      // was able or not to get WebP representation
      return elem.toDataURL("image/webp").startsWith("data:image/webp")
    }

    // very old browser like IE 8, canvas not supported
    return false
  },
  { ttl: Infinity }
)

export type { ImageOptimizedFormats, ImageOptimized, ImageSetOptions }
export {
  optimize,
  optimizeVideo,
  useImageOptimization,
  useVideoOptimization,
  isWebpSupported,
}
