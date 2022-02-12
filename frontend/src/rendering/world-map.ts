import {
  Object3D,
  CircleBufferGeometry,
  MeshStandardMaterial,
  InstancedMesh,
  Group,
} from 'three'

import type { Texture } from 'three'

import { getImageData, coordinatesToPoint, radiansToDegrees } from './utils'
import { Entity } from './entity'

const CIRCLE_DETAIL = 5

type WorldMapOptions = {
  radius: number
  texture: Texture
  rows: number
  size: number
}

export default class WorldMap implements Entity {
  radius: number
  texture: Texture
  rows: number
  size: number
  mesh: InstancedMesh

  private parent: Group | null = null

  constructor({ radius, texture, rows, size }: WorldMapOptions) {
    this.radius = radius
    this.texture = texture
    this.rows = rows
    this.size = size

    // Create the world map
    const map = new Object3D()
    const image = getImageData(texture.image)
    const uniforms = []
    for (let latitude = -90; latitude <= 90; latitude += 180 / rows) {
      // The number of circles to draw (calculates the curvature of the earth for the distance)
      const t =
        Math.cos(radiansToDegrees(Math.abs(latitude))) *
        radius *
        Math.PI *
        2 *
        2
      for (let r = 0; r < t; r++) {
        const longitude = (360 * r) / t - 180
        // Coordinates are shifted in the context
        if (!this.coordinateIsVisible(longitude, latitude, image)) continue
        const position = coordinatesToPoint(latitude, longitude, radius)
        map.position.set(position.x, position.y, position.z)
        const lookAt = coordinatesToPoint(latitude, longitude, radius + 5)
        map.lookAt(lookAt.x, lookAt.y, lookAt.z)
        map.updateMatrix()
        uniforms.push(map.matrix.clone())
      }
    }

    const geometry = new CircleBufferGeometry(size, CIRCLE_DETAIL)
    const material = new MeshStandardMaterial({
      color: 0x3a4494,
      metalness: 0,
      roughness: 0.9,
      transparent: true,
      alphaTest: 0.02,
    })

    this.mesh = new InstancedMesh(geometry, material, uniforms.length)
    for (let i = 0; i < uniforms.length; i++)
      this.mesh.setMatrixAt(i, uniforms[i])
    this.mesh.renderOrder = 3
  }

  coordinateIsVisible(latitude: number, longitude: number, image: ImageData) {
    // Calculate the pixel coordinates of the geographical coordinate
    const x = Math.floor(((latitude + 180) / 360) * image.width + 0.5)
    const y =
      image.height - Math.floor(((longitude + 90) / 180) * image.height - 0.5)
    // Index in the image data (4 values per pixel)
    const index = Math.floor(image.width * 4 * (y - 1) + 4 * x) + 3
    return image.data[index] > 90
  }

  updateSize(radius: number) {
    // todo
  }

  update(deltaTime: number) {}

  mount(group: Group) {
    this.parent = group
    this.parent.add(this.mesh)
  }

  unmount() {
    this.parent!.remove(this.mesh)
  }
}
