import SimpleEventTarget from "./simple-event-target"

export default class Client extends SimpleEventTarget {
  // Throws if the connection could not be made
  constructor() {
    super();
    this.socket = null;
  }

  connect(host) {
    console.log("Creating web socket");
    this.socket = new WebSocket(`ws://${host}/ws`);

    this.socket.addEventListener("open", this.onOpened.bind(this));
    this.socket.addEventListener("message", this.onMessageReceived.bind(this));
    this.socket.addEventListener("error", this.onError.bind(this));
  }

  onOpened() {
    console.log("Client connected");
    this.socket.send("Hello Server!");
    this.dispatchEvent("open");
  }

  onError(error) {
    console.log("Client error", error);
    this.dispatchEvent("error", error);
  }

  onClosed() {
    console.log("Client closed");
    this.dispatchEvent("close");
  }

  onMessageReceived(event) {
    let message;
    try {
      message = JSON.parse(event.data)
    } catch (error) {
      console.error("Unable to parse message", event.data)
    }

    if (
      message.Source.Latitude === 0 ||
      message.Source.Longitude === 0 ||
      message.Destination.Latitude === 0 ||
      message.Destination.Longitude === 0
    ) {
      console.warn("Got message without proper coordinates");
      return;
    }

    console.log("Message from server", message);
    this.dispatchEvent("data", {
      source: {
        latitude: message.Source.Latitude,
        longitude: message.Source.Longitude,
      },
      destination: {
        latitude: message.Destination.Latitude,
        longitude: message.Destination.Longitude,
      },
      color: [["red", "white", "blue", "green"][Math.round(Math.random() * 3)], ["red", "white", "blue", "green"][Math.round(Math.random() * 3)]],
      animateTime: Math.random() * 4000 + 500,
      gap: Math.random(),
      length: Math.random()
    });
  }
}
