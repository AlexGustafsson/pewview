import './main.css'

import Client from './api'
import type { Bucket } from './api'

function waitForDocumentToLoad(): Promise<void> {
  if (
    document.readyState === 'interactive' ||
    document.readyState === 'complete'
  )
    return Promise.resolve()

  return new Promise((resolve) => {
    document.addEventListener('DOMContentLoaded', () => resolve())
  })
}

async function main() {
  await waitForDocumentToLoad()
  console.log('Document loaded, fetching application files')

  const beforeLoad = performance.now()
  const Renderer = (await import('./rendering/renderer')).default
  const { supportsWebGL } = await import('./rendering/utils')
  console.log(`Application files loaded in ${performance.now() - beforeLoad}ms`)

  if (!supportsWebGL()) throw new Error("Client doesn't support WebGL")

  const container = document.getElementById('globe')
  if (container === null) throw new Error('Unable to find container element')

  console.log('Creating and mounting renderer')
  const beforeRender = performance.now()
  const renderer = new Renderer({
    debug: true,
  })
  await renderer.mount(container)

  // Render one frame to kick start all processes
  renderer.update()
  console.log(
    `Application is now up and running after ${
      performance.now() - beforeLoad
    }ms`,
  )

  // Start the renderer
  renderer.start()
  const loadingOverlay = document.getElementById('loading-overlay')
  if (loadingOverlay !== null) {
    loadingOverlay.classList.add('hidden')
  }

  // Mount debug UI

  const DebugUI = (await import('./rendering/debug-ui')).default
  const ui = new DebugUI()

  const Controls = (await import('./rendering/controls')).default

  // Fetch data
  const client = new Client(import.meta.env.VITE_API_ENDPOINT)
  try {
    Controls.data.bucket = await client.fetchLatestBucket()

    // If it succeeds, continously fetch data
    setInterval(async () => {
      // TODO: get interval from the first bucket instead of hard coding it?
      Controls.data.bucket = await client.fetchLatestBucket()
    }, 15000)
  } catch (error) {
    // If it fails, fetch the fallback
    console.error(error)
    console.log('Failed to fetch data, using fallback')
    Controls.data.bucket = await client.fetchFallback()
  }
  console.log(`First data received after ${performance.now() - beforeLoad}ms`)
}

main()
