// eslint-disable-next-line @typescript-eslint/no-unused-vars
import React from "react"
import { Helmet } from "react-helmet"
import { render } from "@testing-library/react"
import { useSEO } from "../../src/hooks/useSEO"
import { OGType } from "../../src/hooks/useSEO/useSEO.types"
import type { SEOProps } from "../../src/hooks/useSEO/useSEO.types"

interface HelmetMeta {
  name?: string
  property?: string
  content?: string
}

interface HelmetLink {
  rel?: string
  href?: string
}

interface HelmetData {
  title: string
  metaTags: HelmetMeta[]
  linkTags: HelmetLink[]
}

const TestComponent = (props: SEOProps) => {
  const { SEO } = useSEO(props)
  return <SEO />
}

describe("useSEO", () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.clearAllMocks()
  })

  describe("when rendering with required props only", () => {
    let helmet: HelmetData

    beforeEach(() => {
      render(<TestComponent description="Test description" />)
      helmet = Helmet.peek() as unknown as HelmetData
    })

    it("should set the default title", () => {
      expect(helmet.title).toBe("Decentraland")
    })

    it("should set the description meta tag", () => {
      const descriptionMeta = helmet.metaTags.find(
        (tag) => tag.name === "description"
      )
      expect(descriptionMeta?.content).toBe("Test description")
    })

    it("should set the default canonical URL", () => {
      const canonicalLink = helmet.linkTags.find(
        (tag) => tag.rel === "canonical"
      )
      expect(canonicalLink?.href).toBe("https://decentraland.org/")
    })

    it("should set the default Open Graph type", () => {
      const ogType = helmet.metaTags.find((tag) => tag.property === "og:type")
      expect(ogType?.content).toBe(OGType.Website)
    })

    it("should set the default locale", () => {
      const ogLocale = helmet.metaTags.find(
        (tag) => tag.property === "og:locale"
      )
      expect(ogLocale?.content).toBe("en_US")
    })

    it("should set the default image", () => {
      const ogImage = helmet.metaTags.find((tag) => tag.property === "og:image")
      expect(ogImage?.content).toBe(
        "https://decentraland.org/static/background-v3@1x-f3aaf66f210e3bf6a747de9951036ba3.jpg"
      )
    })
  })

  describe("when rendering with custom title", () => {
    let helmet: HelmetData

    beforeEach(() => {
      render(
        <TestComponent title="Custom Title" description="Test description" />
      )
      helmet = Helmet.peek() as unknown as HelmetData
    })

    it("should set the custom title", () => {
      expect(helmet.title).toBe("Custom Title")
    })

    it("should set the og:title with custom title", () => {
      const ogTitle = helmet.metaTags.find((tag) => tag.property === "og:title")
      expect(ogTitle?.content).toBe("Custom Title")
    })

    it("should set the twitter:title with custom title", () => {
      const twitterTitle = helmet.metaTags.find(
        (tag) => tag.name === "twitter:title"
      )
      expect(twitterTitle?.content).toBe("Custom Title")
    })
  })

  describe("when rendering with custom URL", () => {
    let helmet: HelmetData

    beforeEach(() => {
      render(
        <TestComponent
          description="Test description"
          url="https://example.com/custom-page"
        />
      )
      helmet = Helmet.peek() as unknown as HelmetData
    })

    it("should set the custom canonical URL", () => {
      const canonicalLink = helmet.linkTags.find(
        (tag) => tag.rel === "canonical"
      )
      expect(canonicalLink?.href).toBe("https://example.com/custom-page")
    })

    it("should set the og:url with custom URL", () => {
      const ogUrl = helmet.metaTags.find((tag) => tag.property === "og:url")
      expect(ogUrl?.content).toBe("https://example.com/custom-page")
    })
  })

  describe("when rendering with image as string", () => {
    let helmet: HelmetData

    beforeEach(() => {
      render(
        <TestComponent
          description="Test description"
          image="https://example.com/image.jpg"
        />
      )
      helmet = Helmet.peek() as unknown as HelmetData
    })

    it("should set the og:image with the string URL", () => {
      const ogImage = helmet.metaTags.find((tag) => tag.property === "og:image")
      expect(ogImage?.content).toBe("https://example.com/image.jpg")
    })

    it("should set the twitter:image with the string URL", () => {
      const twitterImage = helmet.metaTags.find(
        (tag) => tag.name === "twitter:image"
      )
      expect(twitterImage?.content).toBe("https://example.com/image.jpg")
    })
  })

  describe("when rendering with full image object", () => {
    let helmet: HelmetData

    beforeEach(() => {
      render(
        <TestComponent
          description="Test description"
          image={{
            url: "https://example.com/image.png",
            width: 800,
            height: 600,
            alt: "Custom alt text",
            type: "image/png",
          }}
        />
      )
      helmet = Helmet.peek() as unknown as HelmetData
    })

    it("should set the og:image URL", () => {
      const ogImage = helmet.metaTags.find((tag) => tag.property === "og:image")
      expect(ogImage?.content).toBe("https://example.com/image.png")
    })

    it("should set the og:image:width", () => {
      const ogImageWidth = helmet.metaTags.find(
        (tag) => tag.property === "og:image:width"
      )
      expect(ogImageWidth?.content).toBe("800")
    })

    it("should set the og:image:height", () => {
      const ogImageHeight = helmet.metaTags.find(
        (tag) => tag.property === "og:image:height"
      )
      expect(ogImageHeight?.content).toBe("600")
    })

    it("should set the og:image:alt", () => {
      const ogImageAlt = helmet.metaTags.find(
        (tag) => tag.property === "og:image:alt"
      )
      expect(ogImageAlt?.content).toBe("Custom alt text")
    })

    it("should set the og:image:type", () => {
      const ogImageType = helmet.metaTags.find(
        (tag) => tag.property === "og:image:type"
      )
      expect(ogImageType?.content).toBe("image/png")
    })

    it("should set the twitter:image:alt", () => {
      const twitterImageAlt = helmet.metaTags.find(
        (tag) => tag.name === "twitter:image:alt"
      )
      expect(twitterImageAlt?.content).toBe("Custom alt text")
    })
  })

  describe("when rendering with article type", () => {
    let helmet: HelmetData

    beforeEach(() => {
      render(
        <TestComponent
          description="Test description"
          type={OGType.Article}
          author="John Doe"
          publishedTime="2024-01-01T00:00:00Z"
          modifiedTime="2024-01-02T00:00:00Z"
          section="Technology"
          tags={["react", "seo", "hooks"]}
        />
      )
      helmet = Helmet.peek() as unknown as HelmetData
    })

    it("should set the og:type as article", () => {
      const ogType = helmet.metaTags.find((tag) => tag.property === "og:type")
      expect(ogType?.content).toBe(OGType.Article)
    })

    it("should set the article:author", () => {
      const articleAuthor = helmet.metaTags.find(
        (tag) => tag.property === "article:author"
      )
      expect(articleAuthor?.content).toBe("John Doe")
    })

    it("should set the article:published_time", () => {
      const publishedTime = helmet.metaTags.find(
        (tag) => tag.property === "article:published_time"
      )
      expect(publishedTime?.content).toBe("2024-01-01T00:00:00Z")
    })

    it("should set the article:modified_time", () => {
      const modifiedTime = helmet.metaTags.find(
        (tag) => tag.property === "article:modified_time"
      )
      expect(modifiedTime?.content).toBe("2024-01-02T00:00:00Z")
    })

    it("should set the article:section", () => {
      const articleSection = helmet.metaTags.find(
        (tag) => tag.property === "article:section"
      )
      expect(articleSection?.content).toBe("Technology")
    })

    it("should set the article:tag for each tag", () => {
      const articleTags = helmet.metaTags.filter(
        (tag) => tag.property === "article:tag"
      )
      expect(articleTags).toHaveLength(3)
      expect(articleTags.map((tag) => tag.content)).toEqual([
        "react",
        "seo",
        "hooks",
      ])
    })
  })

  describe("when rendering with non-article type", () => {
    let helmet: HelmetData

    beforeEach(() => {
      render(
        <TestComponent
          description="Test description"
          type={OGType.Website}
          author="John Doe"
          publishedTime="2024-01-01T00:00:00Z"
        />
      )
      helmet = Helmet.peek() as unknown as HelmetData
    })

    it("should not include article:author", () => {
      const articleAuthor = helmet.metaTags.find(
        (tag) => tag.property === "article:author"
      )
      expect(articleAuthor).toBeUndefined()
    })

    it("should not include article:published_time", () => {
      const publishedTime = helmet.metaTags.find(
        (tag) => tag.property === "article:published_time"
      )
      expect(publishedTime).toBeUndefined()
    })
  })

  describe("when rendering Twitter Card meta tags", () => {
    let helmet: HelmetData

    beforeEach(() => {
      render(
        <TestComponent title="Twitter Test" description="Twitter description" />
      )
      helmet = Helmet.peek() as unknown as HelmetData
    })

    it("should set twitter:card as summary_large_image", () => {
      const twitterCard = helmet.metaTags.find(
        (tag) => tag.name === "twitter:card"
      )
      expect(twitterCard?.content).toBe("summary_large_image")
    })

    it("should set twitter:title", () => {
      const twitterTitle = helmet.metaTags.find(
        (tag) => tag.name === "twitter:title"
      )
      expect(twitterTitle?.content).toBe("Twitter Test")
    })

    it("should set twitter:description", () => {
      const twitterDescription = helmet.metaTags.find(
        (tag) => tag.name === "twitter:description"
      )
      expect(twitterDescription?.content).toBe("Twitter description")
    })
  })

  describe("when rendering with custom locale", () => {
    let helmet: HelmetData

    beforeEach(() => {
      render(<TestComponent description="Test description" locale="es_ES" />)
      helmet = Helmet.peek() as unknown as HelmetData
    })

    it("should set the custom locale", () => {
      const ogLocale = helmet.metaTags.find(
        (tag) => tag.property === "og:locale"
      )
      expect(ogLocale?.content).toBe("es_ES")
    })
  })
})
