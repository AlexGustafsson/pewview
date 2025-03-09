<script lang="ts">
  import { T } from '@threlte/core'
  import { Grid } from '@threlte/extras'
  import { Stars, useSuspense } from '@threlte/extras'
  import Globe from './Globe.svelte';
  import Map from './Map.svelte';

  type Props = {
    center: [number, number, number]
  }

  let { center }: Props = $props()
</script>

<T.AxesHelper
  args={[10]}
  renderOrder={1}
/>

<Grid
  sectionSize={0}
  cellColor="#eee"
/>

<T.DirectionalLight position={[0, 10, 10]} color="#fffaf5" />

<Stars />

<!-- <Globe center={center} /> -->

<Map />
