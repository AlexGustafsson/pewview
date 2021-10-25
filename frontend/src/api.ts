export class Client {
  public endpoint: string

  contructor(
    public endpoint: string
  ) {}

  public async fetchBuckets() {
    const request = await fetch(`${this.endpoint}/buckets/latest`)
    const response = await request.json();
    console.log(response);
  }

  public async fetchFallback() {
    // TODO: Fetch fallback bucket
  }
}
