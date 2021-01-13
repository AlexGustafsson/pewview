export default class EventEmitter {
  constructor() {
    this.events = {};
  }

  on(event, listener) {
    if (!this.events[event])
      this.events[event] = [];

    this.events[event].push(listener);
  }

  removeListener(event, listener) {
    if (this.events[event]) {
      const index = this.events[event].indexOf(listener)
      if (index > -1)
        this.events[event].splice(index, 1);
    }
  }

  emit(event, ...arguments) {
    if (this.events[event]) {
      const listeners = this.events[event].slice();

      for (let i = 0; i < listeners.length; i++)
        listeners[i].apply(this, arguments);
    }
  }

  once(event, listener) {
    this.on(event, function g () {
      this.removeListener(event, g);
      listener.apply(this, arguments);
    });
  }
}
