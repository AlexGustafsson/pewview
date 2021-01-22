import "./index.css"

import type Renderer from "./rendering/renderer"

function waitForDocumentToLoad(): Promise<void> {
  if (document.readyState === "interactive" || document.readyState === "complete")
    return Promise.resolve();

  return new Promise(resolve => {
    document.addEventListener("DOMContentLoaded", () => resolve());
  });
}

async function main() {
  await waitForDocumentToLoad();
  console.log("Document loaded, fetching application files");

  const beforeLoad = performance.now();
  const Renderer = (await import("./rendering/renderer")).default;
  const {supportsWebGL} = await import("./rendering/utils");
  console.log(`Application files loaded in ${performance.now() - beforeLoad}ms`);

  if (!supportsWebGL())
    throw new Error("Client doesn't support WebGL");

  const container = document.getElementById("globe");
  if (container === null)
    throw new Error("Unable to find container element");

  console.log("Creating and mounting renderer")
  const beforeRender = performance.now();
  const renderer = new Renderer({
    debug: true,
  });
  const rendererLoaded = new Promise<void>(resolve => {
    renderer.once("load", () => {
      resolve();
    });
  });
  renderer.mount(container);
  // Render one frame to kick start all processes
  renderer.update();
  console.log(`Renderer created and mounted in ${performance.now() - beforeRender}ms`);

  // Wait for the renderer to be completely loaded
  await rendererLoaded;
  console.log(`Application is now up and running after ${performance.now() - beforeLoad}ms`);
  // Start the renderer
  renderer.start();
  const loadingOverlay = document.getElementById("loading-overlay");
  if (loadingOverlay !== null)
    loadingOverlay.style.opacity = "0";
}

main();
