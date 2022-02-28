import {
  AdditiveBlending,
  CubicBezierCurve3,
  Group,
  Mesh,
  MeshBasicMaterial,
  TubeBufferGeometry,
} from 'three'
import { clamp } from 'three/src/math/MathUtils'
import { Entity } from './entity'
import { coordinatesToPoint } from './utils'
import { geoInterpolate } from 'd3-geo'
import { Easing } from './easings'

interface Coordinate {
  latitude: number
  longitude: number
}

export function getSplineFromCoords(
  source: Coordinate,
  destination: Coordinate,
  globeRadius: number,
): CubicBezierCurve3 {
  const startPoint = coordinatesToPoint(
    source.latitude,
    source.longitude,
    globeRadius,
  )
  const endPoint = coordinatesToPoint(
    destination.latitude,
    destination.longitude,
    globeRadius,
  )

  const distance = startPoint.distanceTo(endPoint) / globeRadius
  let altitude = 15
  if (distance < 0.8) altitude = 5
  else if (distance < 1.2) altitude = 8
  else if (distance < 1.5) altitude = 10
  console.log(distance, altitude)

  const interpolate = geoInterpolate(
    [source.longitude, source.latitude],
    [destination.longitude, destination.latitude],
  )
  const midCoord1 = interpolate(0.25)
  const midCoord2 = interpolate(0.75)
  const mid1 = coordinatesToPoint(
    midCoord1[1],
    midCoord1[0],
    globeRadius + altitude,
  )
  const mid2 = coordinatesToPoint(
    midCoord2[1],
    midCoord2[0],
    globeRadius + altitude,
  )

  return new CubicBezierCurve3(startPoint, mid1, mid2, endPoint)
}

export default class Arch implements Entity {
  private mesh: Group
  private parent: Group | null = null
  private segments: number
  private tube: TubeBufferGeometry
  private animation: Easing | null = null

  constructor(
    source: Coordinate,
    destination: Coordinate,
    globeRadius: number,
    color: number,
  ) {
    this.mesh = new Group()

    const material = new MeshBasicMaterial({
      blending: AdditiveBlending,
      opacity: 0.95,
      transparent: true,
      color: color,
    })

    const spline = getSplineFromCoords(source, destination, globeRadius)
    // Add some extra segments to soften the curves and animation
    this.segments = Math.round(20 + spline.getLength())
    this.tube = new TubeBufferGeometry(spline, this.segments, 0.2, 3, false)
    this.tube.drawRange = {
      start: 0,
      count: 0,
    }

    const tubeMesh = new Mesh(this.tube, material)
    this.mesh.add(tubeMesh)
  }

  mount(group: Group) {
    this.parent = group
    this.parent.add(this.mesh)
  }

  unmount() {
    this.parent!.remove(this.mesh)
  }

  update(deltaTime: number): void {
    if (this.animation) {
      this.animation.update(deltaTime)
      if (this.animation.active) {
        this.tube.setDrawRange(
          0,
          Math.round(this.segments * this.animation.progress * 21) *
            this.tube.parameters.radialSegments,
        )
      }
    }
  }

  animate(offset: number, speed: number) {
    setTimeout(() => {
      const duration = Math.round(this.segments / speed)
      this.animation = new Easing(duration)
    }, offset)
  }
}
