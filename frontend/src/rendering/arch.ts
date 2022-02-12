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

  const distance = startPoint.distanceTo(endPoint)
  const altitude =
    distance > 1.85 * globeRadius ? 20 : distance > 1.4 * globeRadius ? 10 : 3

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
    const segments = Math.round(20 + spline.getLength())
    const tube = new TubeBufferGeometry(spline, segments, 0.2, 3, false)
    const tubeMesh = new Mesh(tube, material)
    this.mesh.add(tubeMesh)
  }

  mount(group: Group) {
    this.parent = group
    this.parent.add(this.mesh)
  }

  unmount() {
    this.parent!.remove(this.mesh)
  }

  update(deltaTime: number): void {}
}
