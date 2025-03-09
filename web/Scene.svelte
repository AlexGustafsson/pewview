<script lang="ts">
import { T, useTask } from '@threlte/core'
import { interactivity } from '@threlte/extras'
import { Spring } from 'svelte/motion'
interactivity()
const scale = new Spring(1)
let rotation = 0
useTask((delta) => {
  rotation += delta
})
</script>

<T.PerspectiveCamera
  makeDefault
  position={[10, 10, 10]}
  oncreate={(ref) => {
    ref.lookAt(0, 1, 0)
  }}
/>

<T.DirectionalLight position={[0, 10, 10]} />

<T.Mesh
  rotation.y={rotation}
  position.y={1}
  scale={scale.current}
  onpointerenter={() => {
    scale.target = 1.1
  }}
  onpointerleave={() => {
    scale.target = 1
  }}
>
  <T.SphereGeometry args={[5, 64, 64]} />
  <T.MeshStandardMaterial color="blue" />
</T.Mesh>
