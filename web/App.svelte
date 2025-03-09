<script lang="ts">
import { T, Canvas } from "@threlte/core";
import Scene from "./Scene.svelte";
import { Gizmo, OrbitControls, Text, Suspense } from '@threlte/extras'
  import CustomRenderer from "./CustomRenderer.svelte";

 let center: [number, number, number] = [0,0 ,0]
</script>

<main class="h-screen w-full">
  <Canvas>
    <T.PerspectiveCamera
      makeDefault
      position={[20, 20, 20]}
      fov={36}
      target={[0, 0, 0]}
    >
      <OrbitControls
        minDistance={10}
        maxDistance={50}
        enableDamping={true}
        dampingFactor={0.05}
        rotateSpeed={0.5}
        onchange={(event) => {
          center = event.target.target.toArray()
        }}
      >
        <Gizmo type="sphere" size={200} />
      </OrbitControls>
    </T.PerspectiveCamera>

    <Suspense final>
      {#snippet fallback()}
        <Text
          position={center}
          text="Loading..."
          fontSize={1}
          color="white"
        />
      {/snippet}

      {#snippet error({ errors })}
        <Text
          position={center}
          text={errors.map((e) => e).join(', ')}
          fontSize={1}
          color="white"
          anchorX="50%"
          anchorY="50%"
        />
      {/snippet}

      <Scene center={center} />
    </Suspense>


    <CustomRenderer />
  </Canvas>
</main>
