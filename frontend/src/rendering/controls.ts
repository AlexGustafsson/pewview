import { Bucket } from '../api'
import EventEmitter from '../event-emitter'

type Controls = {
  rendering: {
    enable: boolean
    fps: number
  }
  scene: {
    renderStars: boolean
    animateStars: boolean
    renderHalo: boolean
    animateHalo: boolean
    renderWorldMap: boolean
    renderGlobe: boolean
  }
  view: {
    rotationX: number
    rotationY: number
  }
  data: {
    bucket: Bucket | null
  }
}

const controls: Controls = {
  rendering: {
    enable: true,
    fps: 0,
  },
  scene: {
    renderStars: true,
    animateStars: true,
    renderHalo: true,
    animateHalo: true,
    renderWorldMap: true,
    renderGlobe: true,
  },
  view: {
    rotationX: 17,
    rotationY: 263,
  },
  data: {
    bucket: null,
  },
}

export const events = new EventEmitter()

class Handler {
  parents: string[]

  constructor(parents: string[] = []) {
    this.parents = parents
  }

  get(target: Object, key: string): any {
    if (key in target) {
      const newTarget = target[key as keyof typeof target]
      if (newTarget instanceof Object) {
        const handler = new Handler([...this.parents, key])
        return new Proxy(newTarget, handler)
      }

      return newTarget
    }

    return undefined
  }

  set(target: Object, key: string, value: any) {
    if (key in target) {
      target[key as keyof typeof target] = value
      events.emit('change', this.path(key), value)
      return true
    }

    return false
  }

  path(key: string): string {
    return [...this.parents, key].join('.')
  }
}

const proxy = new Proxy(controls, new Handler()) as Controls
export default proxy
