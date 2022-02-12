export type Bucket = {
  origin: Date
  duration: number
  connections: Connection[]
}

export type Connection = {
  source: Coordinate
  destination: Coordinate
}

export type Coordinate = {
  origin: number
  duration: number
  latitude: number
  longitude: number
}

export type Metrics = {
  sourceAddress?: string
  sourcePort?: number
  destinationAddress?: string
  destinationPort?: number
  bytes?: number
}

export type APIError = {
  code: number
  error: string
}

export default class Client {
  public endpoint: string

  constructor(endpoint: string) {
    this.endpoint = endpoint
  }

  public async fetchLatestBucket(): Promise<Bucket> {
    const response = await fetch(`${this.endpoint}/buckets/latest`)
    const data = await response.json()
    if (!response.ok) {
      const error = data as APIError
      throw new Error(
        `failed to fetch latest bucket: ${error.code}, ${error.error}`,
      )
    }

    const bucket = data as Bucket
    // When received from the API, the duration is a string
    bucket.origin = new Date(bucket.origin)
    return bucket
  }

  public async fetchFallback(): Promise<Bucket> {
    const bucket = JSON.parse(
      (await import('../static/fallback.json?raw')).default,
    ) as Bucket
    // When received from the API, the duration is a string
    bucket.origin = new Date(bucket.origin)
    return bucket
  }
}
