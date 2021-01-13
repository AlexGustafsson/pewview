import App from "./rendering/app"

const onLoaded = (document.readyState === "interactive" || document.readyState === "complete") ? Promise.resolve() : new Promise(resolve => {
  document.addEventListener("DOMContentLoaded", () => {
    resolve();
  });
});

onLoaded.then(() => {
  const parentNode = document.querySelector(".js-webgl-globe");
  if (parentNode)
    console.log("Found element");
  else
    return console.error("No such element");

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl") || canvas.getContext("webgl2") || canvas.getContext("experimental-webgl");
  if (context)
    console.log("WebGL supported");
  else
    return console.error("WebGL not supported");

  const globe = new App({
    basePath: "/",
    imagePath: "static/",
    dataPath: "static/",
    parentNode: parentNode,
    globeRadius: 30,
    lineWidth: 1.5,
    spikeRadius: .2
  });

  globe.init().then((() => {
    globe.canvas.addEventListener("webglcontextlost", () => {
      console.error("Lost WebGL context");
      // Ol was originally a function to replace the webgl with a static image
      // Ol()
    }, false);
  }))
})
