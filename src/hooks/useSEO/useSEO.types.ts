/**
 * Open Graph object types as defined by https://ogp.me/#types
 */
enum OGType {
  // Music
  MusicSong = "music.song",
  MusicAlbum = "music.album",
  MusicPlaylist = "music.playlist",
  MusicRadioStation = "music.radio_station",

  // Video
  VideoMovie = "video.movie",
  VideoEpisode = "video.episode",
  VideoTvShow = "video.tv_show",
  VideoOther = "video.other",

  // No Vertical
  Article = "article",
  Book = "book",
  Profile = "profile",
  Website = "website",
}

/**
 * Image structured properties for Open Graph
 * @see https://ogp.me/#structured
 */
interface OGImage {
  url: string
  width?: number
  height?: number
  alt?: string
  type?: "image/jpeg" | "image/png" | "image/gif" | "image/webp"
}

/**
 * SEO hook props following Open Graph protocol
 * @see https://ogp.me/
 */
interface SEOProps {
  title?: string
  description: string
  image?: string | OGImage
  type?: OGType
  url?: string
  locale?: string

  // Article specific (https://ogp.me/#type_article)
  author?: string
  publishedTime?: string
  modifiedTime?: string
  section?: string
  tags?: string[]
}

export { OGType }
export type { OGImage, SEOProps }
