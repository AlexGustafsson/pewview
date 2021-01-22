interface SimpleEventTargetCallback { (...[]: any[]): void }

export default class SimpleEventTarget {
  private listeners: {[key: string]: SimpleEventTargetCallback[]};

  constructor() {
     this.listeners = {};
  }

  addEventListener(event: string, listener: SimpleEventTargetCallback) {
    this.listeners[event] = this.listeners[event] || [];
    this.listeners[event].push(listener);
  }

  removeEventListener(event: string, listener: SimpleEventTargetCallback) {
    if (this.listeners[event]) {
      const index = this.listeners[event].indexOf(listener);
      if (index >= 0)
        this.listeners[event].splice(index, 1);
    }
  }

  dispatchEvent(event: string, ...details: any[]) {
    const listeners = this.listeners[event] || [];
    for (const listener of listeners)
      listener(...details);
  }
}
