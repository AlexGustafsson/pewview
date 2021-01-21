export default class SimpleEventTarget {
  constructor() {
    this.listeners = {};
  }

  addEventListener(event, listener) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(listener);
  }

  removeEventListener(event, listener) {
    if (this.listeners[event])
      this.listeners[event].remove(listener);
  }

  dispatchEvent(event, ...details) {
    const listeners = this.listeners[event] || [];
    for (const listener of listeners)
      listener(...details);
  }
}
