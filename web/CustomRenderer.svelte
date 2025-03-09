<script lang="ts">
  import { useTask, useThrelte } from '@threlte/core'
  import {
  BlendFunction,
    BloomEffect,
    EffectComposer,
    EffectPass,
    RenderPass
  } from 'postprocessing'
  const { scene, renderer, camera, size, autoRender, renderStage } = useThrelte()
  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera.current))
  composer.addPass(
    new EffectPass(
      camera.current,
      new BloomEffect({
        mipmapBlur: true,
        blendFunction: BlendFunction.SCREEN,
        luminanceThreshold: 0.3,
        radius: 0.5
      })
    )
  )

  $effect(() => {
    composer.setSize($size.width, $size.height)
  })

  $effect(() => {
    const last = autoRender.current
    autoRender.set(false)
    return () => {
      autoRender.set(last)
    }
  })
  useTask(
    (delta) => {
      composer.render(delta)
    },
    { stage: renderStage, autoInvalidate: false }
  )
</script>
