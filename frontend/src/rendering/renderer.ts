import { WebGLRenderer, Clock } from 'three'
import type { Theme } from './theme'
import { DefaultTheme } from './theme'
import DebugUI from './debug-ui'

import EventEmitter from '../event-emitter'
import { Scene } from './scene'
import { events as controlEvents } from './controls'

// The number of milliseconds to wait before triggering a size update.
// Only the last event within this timespan will be handled
const SIZE_UPDATE_DEBOUNCE_DELAY = 200

const GLOBE_RADIUS = 25
const WORLD_MAP_OFFSET = 0

type RendererOptions = {
  theme?: Theme
  debug?: boolean
}

export default class Renderer extends EventEmitter {
  element: HTMLElement | null
  theme: Theme
  isRunning: boolean
  hasLoaded: boolean
  clock: Clock
  fps: number
  scene: Scene
  renderer: WebGLRenderer
  render: boolean = true

  resizeDebouncer: ReturnType<typeof setInterval> | null
  debugUI: DebugUI | null

  constructor({ theme = DefaultTheme, debug = false }: RendererOptions = {}) {
    super()
    this.element = null

    controlEvents.on('change', (path: string, value: any) => {
      switch (path) {
        case 'rendering.enable':
          this.render = value as boolean
          break
      }
    })

    // Style
    this.theme = theme

    // Rendering loop
    this.isRunning = false
    this.hasLoaded = false
    this.clock = new Clock(false)
    this.fps = 0

    // Rendering
    this.scene = new Scene()
    this.renderer = new WebGLRenderer({
      // powerPreference: "high-performance",
      powerPreference: 'low-power',
      alpha: false,
      preserveDrawingBuffer: false,
      precision: 'highp',
      antialias: true,
    })
    this.renderer.setPixelRatio(window.devicePixelRatio || 1)
    this.renderer.setClearColor(this.theme.background, 1)

    // Scene

    // Debugging
    this.debugUI = null

    // Timers / debouncers
    this.resizeDebouncer = null

    // Always let the update loop access 'this'
    this.update = this.update.bind(this)
  }

  async mount(element: HTMLElement) {
    if (this.element)
      console.warn(
        'The renderer was already mounted, this may cause undefined behaviour',
      )

    await this.scene.init()

    this.element = element
    this.element.appendChild(this.renderer.domElement)

    window.addEventListener('resize', () => this.updateSize())
    window.addEventListener('orientationchange', () => this.updateSize())
    setTimeout(() => {
      this.updateSize(true)
    }, 1)
  }

  start() {
    if (!this.element) throw new Error('The renderer has not been mounted')

    if (this.isRunning) return

    this.isRunning = true
    this.clock.start()
    this.update()
  }

  stop() {
    if (!this.isRunning) return

    this.isRunning = false
    this.clock.stop()
  }

  updateSize(immediate = false) {
    // Clear any existing debouncing
    if (this.resizeDebouncer != null) {
      clearTimeout(this.resizeDebouncer)
      this.resizeDebouncer = null
    }

    const trigger = () => {
      if (this.element === null) return

      const size = this.element.getBoundingClientRect()
      // TODO: This is a costly process (about 12ms)
      // Makes resizing stutter more than necessary
      this.renderer.setSize(size.width, size.height, false)
      this.scene.updateSize(size.width, size.height)
    }

    if (immediate) {
      trigger()
    } else {
      this.resizeDebouncer = setTimeout(() => {
        trigger()
        this.resizeDebouncer = null
      }, SIZE_UPDATE_DEBOUNCE_DELAY)
    }
  }

  update() {
    const deltaTime = this.clock.getDelta()
    this.fps = 1 / deltaTime

    if (this.render) {
      this.renderer.render(this.scene, this.scene.camera)
      this.scene.update(deltaTime)
    }

    if (this.isRunning) requestAnimationFrame(this.update)
  }
}
