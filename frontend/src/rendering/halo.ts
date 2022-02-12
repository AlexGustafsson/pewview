import {
  Mesh,
  SphereBufferGeometry,
  ShaderMaterial,
  Color,
  Vector3,
  Group,
} from 'three'
import { Entity } from './entity'

import HALO_FRAGMENT_SHADER from './shaders/halo.frag?raw'
import HALO_VERTEX_SHADER from './shaders/halo.vert?raw'
import type Theme from './theme'

export default class Halo implements Entity {
  elapsedTime: number
  animate: boolean
  uniforms: {
    c: Uniform<number>
    p: Uniform<number>
    noiseSeed: Uniform<number>
    noiseScale: Uniform<number>
    noiseIntensity: Uniform<number>
    glowColor: Uniform<Color>
    viewVector: Uniform<Vector3>
  }
  material: ShaderMaterial
  mesh: Mesh

  private parent: Group | null = null

  constructor(radius: number, theme: Theme) {
    this.elapsedTime = 0
    this.animate = true
    this.uniforms = {
      c: {
        type: 'f',
        value: 0.8,
      },
      p: {
        type: 'f',
        value: 10,
      },
      noiseSeed: {
        type: 'f',
        value: this.elapsedTime,
      },
      noiseScale: {
        type: 'f',
        value: 8,
      },
      noiseIntensity: {
        type: 'f',
        value: 0.08,
      },
      glowColor: {
        type: 'c',
        value: new Color(theme.colors.halo.glow),
      },
      viewVector: {
        type: 'v3',
        value: new Vector3(0, 0, 220),
      },
    }
    this.material = new ShaderMaterial({
      uniforms: this.uniforms,
      vertexShader: HALO_VERTEX_SHADER,
      fragmentShader: HALO_FRAGMENT_SHADER,
      side: 1,
      blending: 2,
      transparent: true,
    })

    this.mesh = new Mesh(
      new SphereBufferGeometry(radius, 45, 45),
      this.material,
    )
    this.mesh.scale.multiplyScalar(1.1)
    this.mesh.rotateX(0.03 * Math.PI)
    this.mesh.rotateY(0.03 * Math.PI)
    this.mesh.renderOrder = 3
  }

  updateSize(radius: number) {
    // todo
  }

  update(deltaTime: number) {
    if (this.animate) {
      this.elapsedTime = (this.elapsedTime + deltaTime) % 1e3
      this.uniforms.noiseSeed.value = this.elapsedTime / 2
    }
  }

  mount(group: Group) {
    this.parent = group
    this.parent.add(this.mesh)
  }

  unmount() {
    this.parent!.remove(this.mesh)
  }
}
