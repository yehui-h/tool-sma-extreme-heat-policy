export interface AboutLink {
  label: string
  href: string
}

export interface AboutSection {
  title: string
  paragraphs: string[]
  bulletPoints?: string[]
  links?: AboutLink[]
}
