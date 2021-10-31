export class Client {
  public endpoint!: string

  contructor(endpoint: string) {
    this.endpoint = endpoint;
  }

  public async fetchBuckets() {
    const request = await fetch(`${this.endpoint}/buckets/latest`)
    const response = await request.json();
    console.log(response);
  }

  public async fetchFallback() {
    // TODO: Fetch fallback bucket
  }
}
