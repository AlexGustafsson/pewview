declare module '*?raw' {
  const content: string
  export default content
}

declare module '*.css' {
  const content: string
  export default content
}

declare module '*.html' {
  const content: string
  export default content
}

declare module '*.png' {
  const content: any
  export default content
}

interface ImportMeta {
  env: {
    VITE_API_ENDPOINT: string
    BASE_URL: string
    MODE: string
    DEV: boolean
    PROD: boolean
    SSR: boolean
  }
}
