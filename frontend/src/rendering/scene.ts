import {
  Group,
  Scene as ThreeScene,
  TextureLoader,
  AmbientLight,
  DirectionalLight,
  SpotLight,
  PerspectiveCamera,
  Vector3,
  Euler,
} from 'three'
import { IS_MOBILE } from './utils'

import Stars from './stars'

import WORLD_MAP from '../../static/map.png'

import type { Theme } from './theme'
import { DefaultTheme } from './theme'
import Halo from './halo'
import Globe from './globe'
import WorldMap from './world-map'
import { events as controlEvents } from './controls'
import Arch from './arch'

import { Bucket } from '../api'

const GLOBE_RADIUS = 25
const WORLD_MAP_OFFSET = 0

type ResolveFunction = (value: void | PromiseLike<void>) => void

export class Scene extends ThreeScene {
  globeContainer: Group
  staticContainer: Group

  theme: Theme

  camera: PerspectiveCamera

  lights: {
    diffuse: AmbientLight
    crest: DirectionalLight
    atmosphere: SpotLight
    spotlight: SpotLight
  }

  stars: Stars | null = null
  globe: Globe | null = null
  halo: Halo | null = null
  worldMap: WorldMap | null = null

  constructor() {
    super()

    const radius = GLOBE_RADIUS

    this.globeContainer = new Group()
    this.add(this.globeContainer)

    this.staticContainer = new Group()
    this.add(this.staticContainer)

    this.theme = DefaultTheme

    // Camera
    this.camera = new PerspectiveCamera(10, 1, 170, 260)
    this.camera.position.set(0, 0, 220)
    this.add(this.camera)

    this.globe = new Globe({
      radius: radius,
      detail: 55,
      theme: this.theme,
      origin: new Vector3(0, 0, 0),
    })
    this.globe.mount(this.globeContainer)

    // Setup lights
    this.lights = {
      diffuse: new AmbientLight(0xa9bfff, 0.8),
      crest: new DirectionalLight(0xa9bfff, 3),
      atmosphere: new SpotLight(0x2188ff, 5, 120, 0.3, 0, 1.1),
      spotlight: new SpotLight(0xf46bbe, 5, 75, 0.5, 0, 1.25),
    }
    this.lights.crest.target = this.globeContainer
    this.lights.atmosphere.target = this.globeContainer
    this.lights.spotlight.target = this.globeContainer
    for (const light of Object.values(this.lights))
      this.staticContainer.add(light)

    // const rotation = START_ROTATION;
    // const offset = (new Date()).getTimezoneOffset();
    // rotation.y = START_ROTATION.y + Math.PI * (offset / 720);
    this.globeContainer.rotation.copy(new Euler(0.3, 4.6, 0.05))

    // Setup stars
    this.stars = new Stars(GLOBE_RADIUS)
    this.stars.mesh.position.set(0, 0, -20)
    this.stars.mount(this.staticContainer)
    this.stars.animate = true

    this.halo = new Halo(radius, this.theme)
    this.halo.mount(this.staticContainer)

    // Always let the update loop access 'this'
    this.update = this.update.bind(this)
  }

  async init() {
    const radius = GLOBE_RADIUS

    // Setup the world map
    const textureLoaded = new Promise<void>((resolve) => {
      new TextureLoader().load(WORLD_MAP, (texture) => {
        this.worldMap = new WorldMap({
          radius,
          texture,
          rows: 200,
          size: 0.095,
        })
        this.worldMap.mount(this.globeContainer)
        resolve()
      })
    })

    await textureLoaded

    controlEvents.on('change', (path: string, value: any) => {
      switch (path) {
        case 'scene.renderHalo':
          if (value === true) this.halo?.mount(this.staticContainer)
          else this.halo?.unmount()
          break
        case 'scene.renderStars':
          if (value === true) this.stars?.mount(this.staticContainer)
          else this.stars?.unmount()
          break
        case 'scene.animateHalo':
          this.halo!.animate = value as boolean
          break
        case 'scene.animateStars':
          this.stars!.animate = value as boolean
          break
        case 'scene.renderWorldMap':
          if (value === true) this.worldMap?.mount(this.globeContainer)
          else this.worldMap?.unmount()
          break
        case 'scene.renderGlobe':
          if (value === true) this.globe?.mount(this.globeContainer)
          else this.globe?.unmount()
          break
        case 'view.rotationX':
          this.globeContainer.rotation.set(
            (value * 2 * Math.PI) / 360,
            this.globeContainer.rotation.y,
            this.globeContainer.rotation.z,
          )
          break
        case 'view.rotationY':
          this.globeContainer.rotation.set(
            this.globeContainer.rotation.x,
            (value * 2 * Math.PI) / 360,
            this.globeContainer.rotation.z,
          )
          break
        case 'data.bucket':
          const bucket = value as Bucket
          for (const connection of bucket.connections) {
            const arch = new Arch(
              connection.source,
              connection.destination,
              radius,
              this.theme.archs.negative,
            )

            arch.mount(this.globeContainer)
          }
      }
    })
  }

  updateSize(width: number, height: number) {
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
    const containerScale = 800 / height
    if (!IS_MOBILE) {
      this.globeContainer.scale.set(
        containerScale,
        containerScale,
        containerScale,
      )
      this.staticContainer.scale.set(
        containerScale,
        containerScale,
        containerScale,
      )
    }

    this.globeContainer.position.set(0, 0, 0)
    this.staticContainer.position.set(0, 0, 0)

    this.globe!.updateSize(GLOBE_RADIUS, containerScale)
    this.worldMap!.updateSize(GLOBE_RADIUS)
    this.halo!.updateSize(GLOBE_RADIUS)

    this.lights.atmosphere.position
      .set(-2.5 * GLOBE_RADIUS, 80, -49)
      .multiplyScalar(containerScale * 2)
    this.lights.atmosphere.distance = 120 * containerScale

    // this.spotLights.light1.position.set(this.orbitParentContainer.position.x - 2.5 * GLOBE_RADIUS, 80, -49).multiplyScalar(containerScale);
    // this.spotLights.light1.distance = 120 * containerScale;

    this.lights.crest.position
      .set(-50, 30, 10)
      .multiplyScalar(containerScale * 2)
    // this.directionalLights.light2.position.set(this.orbitParentContainer.position.x - 50, this.orbitParentContainer.position.y + 30, 10).multiplyScalar(containerScale);

    // where's light3? previously light2
    // this.lights.light3.position.set(this.parentContainer.position.x - 25, 0, 100).multiplyScalar(containerScale)
    // this.light3.distance = 150 * containerScale

    this.lights.spotlight.position
      .set(GLOBE_RADIUS, GLOBE_RADIUS, 2 * GLOBE_RADIUS)
      .multiplyScalar(containerScale * 2)
    this.lights.spotlight.distance = 75 * containerScale
    // this.spotLights.light4.position.set(this.orbitParentContainer.position.x + GLOBE_RADIUS, GLOBE_RADIUS, 2 * GLOBE_RADIUS).multiplyScalar(containerScale);
    // this.spotLights.light4.distance = 75 * containerScale;
  }

  update(deltaTime: number) {
    // if (this.debugUI)
    //   this.debugUI.update(deltaTime);
    if (this.stars) this.stars.update(deltaTime)
    if (this.globe) this.globe.update(deltaTime)
    if (this.halo) this.halo.update(deltaTime)
  }
}
