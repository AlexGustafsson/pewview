<script>

  import fragmentShader from './crt.glsl?raw'
  import vertexShader from './vertex.glsl?raw'
  import { T } from '@threlte/core'
  import { useTexture } from '@threlte/extras'

  const mapTexture = useTexture('./static/map.jpg')
  const noiseTexture = useTexture('./static/noise.png')
  const noiseTexture2 = useTexture('./static/noise2.jpg')
  const bumpMap = useTexture('./static/dirt.jpg')

  const textures = Promise.all([mapTexture, noiseTexture, bumpMap, noiseTexture2])

  let time = $state(0);
  setInterval(() => {
    time += 0.02
  }, 16)
</script>
{#await textures then [mapTexture, noiseTexture, bumpMap, noiseTexture2]}
  <T.Mesh>
    <T.SphereGeometry args={[5, 64, 64]} />
    <T.MeshStandardMaterial bumpMap={bumpMap} bumpScale={4.0} color="#2d73b5" roughness={0.5} metalness={0.5}/>
  </T.Mesh>

  <T.Mesh>
    <T.SphereGeometry args={[5.05, 64, 64]} />
    <T.ShaderMaterial
      {fragmentShader}
      {vertexShader}
      uniforms={{
        mapTexture: {type: "t", value: mapTexture },
        noiseTexture: {type: "t", value: noiseTexture2 },
        time: {type: "f", value: 0 }
      }}
      transparent={true}
      uniforms.time.value={time}
    />
  </T.Mesh>
{/await}
