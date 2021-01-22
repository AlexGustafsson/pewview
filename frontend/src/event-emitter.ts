interface EventEmitterCallback { (...[]: any[]): void }

export default class EventEmitter {
  events: {[key: string]: EventEmitterCallback[]};
  constructor() {
    this.events = {};
  }

  on(event: string, listener: EventEmitterCallback) {
    if (!this.events[event])
      this.events[event] = [];

    this.events[event].push(listener);
  }

  removeListener(event: string, listener: EventEmitterCallback) {
    if (this.events[event]) {
      const index = this.events[event].indexOf(listener)
      if (index > -1)
        this.events[event].splice(index, 1);
    }
  }

  emit(event: string, ...parameters: any[]) {
    if (this.events[event]) {
      const listeners = this.events[event].slice();

      for (let i = 0; i < listeners.length; i++)
        listeners[i].apply(this, parameters);
    }
  }

  once(event: string, listener: EventEmitterCallback) {
    const handler = (...parameters: any[]) => {
      this.removeListener(event, handler);
      listener.apply(this, ...parameters);
    }
    this.on(event, handler);
  }
}
