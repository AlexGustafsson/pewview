import Renderer from "./rendering/renderer"
import {supportsWebGL} from "./rendering/utils"

async function main() {
  const loaded = (document.readyState === "interactive" || document.readyState === "complete") ? Promise.resolve() : new Promise(resolve => {
    document.addEventListener("DOMContentLoaded", () => {
      resolve();
    });
  });
  await loaded;

  if (!supportsWebGL())
    throw new Error("Client doesn't support WebGL");

  const container = document.getElementById("globe");
  const renderer = new Renderer({
    debug: true,
  });
  renderer.mount(container);
  renderer.start();
}

main();
