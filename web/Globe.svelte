<script lang="ts">
import { T } from '@threlte/core'
  import Map from './Map.svelte';

type Props = {
  center: [number, number, number]
}

let { center }: Props = $props()
</script>

<T.Mesh position={center}>
  <T.SphereGeometry args={[5, 64, 64]} />
  <T.MeshStandardMaterial color="#1716ff" metalness={0.5} roughness={0.5} />
</T.Mesh>
