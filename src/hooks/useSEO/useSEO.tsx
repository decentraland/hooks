import React from "react"
import { Helmet } from "react-helmet"
import type { OGImage, SEOProps } from "./useSEO.types"
import { OGType } from "./useSEO.types"

const DEFAULT_IMAGE: OGImage = {
  url: "https://decentraland.org/static/background-v3@1x-f3aaf66f210e3bf6a747de9951036ba3.jpg",
  width: 1200,
  height: 630,
  alt: "Decentraland - A virtual world owned by its users",
  type: "image/jpeg",
}
const SITE_NAME = "Decentraland"
const BASE_URL = "https://decentraland.org/"
const DEFAULT_LOCALE = "en_US"

/**
 * Hook for managing SEO meta tags using react-helmet
 *
 * @param props - SEO configuration props
 * @returns Object containing the SEO component to render
 *
 * @example
 * ```tsx
 * const { SEO } = useSEO({
 *   title: 'My Page Title',
 *   description: 'Page description for search engines',
 *   image: 'https://example.com/image.jpg',
 *   type: OGType.Article,
 *   author: 'John Doe',
 *   publishedTime: '2024-01-01T00:00:00Z'
 * })
 *
 * return (
 *   <>
 *     <SEO />
 *     <div>Page content</div>
 *   </>
 * )
 * ```
 */
const useSEO = (props: SEOProps) => {
  const {
    title,
    description,
    image = DEFAULT_IMAGE,
    type = OGType.Website,
    url,
    locale = DEFAULT_LOCALE,
    author,
    publishedTime,
    modifiedTime,
    section,
    tags,
  } = props

  const fullTitle = title || SITE_NAME
  const canonicalUrl = url || BASE_URL
  const imageData: OGImage = typeof image === "string" ? { url: image } : image

  const SEO: React.FC = () => (
    <Helmet>
      <title>{fullTitle}</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={canonicalUrl} />

      {/* Open Graph - Basic */}
      <meta property="og:site_name" content={SITE_NAME} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content={type} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:locale" content={locale} />

      {/* Open Graph - Image structured properties */}
      <meta property="og:image" content={imageData.url} />
      {imageData.width && (
        <meta property="og:image:width" content={String(imageData.width)} />
      )}
      {imageData.height && (
        <meta property="og:image:height" content={String(imageData.height)} />
      )}
      {imageData.alt && (
        <meta property="og:image:alt" content={imageData.alt} />
      )}
      {imageData.type && (
        <meta property="og:image:type" content={imageData.type} />
      )}

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={imageData.url} />
      {imageData.alt && (
        <meta name="twitter:image:alt" content={imageData.alt} />
      )}

      {/* Article specific meta tags */}
      {type === OGType.Article && author && (
        <meta property="article:author" content={author} />
      )}
      {type === OGType.Article && publishedTime && (
        <meta property="article:published_time" content={publishedTime} />
      )}
      {type === OGType.Article && modifiedTime && (
        <meta property="article:modified_time" content={modifiedTime} />
      )}
      {type === OGType.Article && section && (
        <meta property="article:section" content={section} />
      )}
      {type === OGType.Article &&
        tags?.map((tag) => (
          <meta key={tag} property="article:tag" content={tag} />
        ))}
    </Helmet>
  )

  return { SEO }
}

export { useSEO }
