const DEBUG = true;

// Gen random data
const N = 20;
const arcsData = [...Array(N).keys()].map(() => ({
  startLat: (Math.random() - 0.5) * 180,
  startLng: (Math.random() - 0.5) * 360,
  endLat: (Math.random() - 0.5) * 180,
  endLng: (Math.random() - 0.5) * 360,
  color: [["red", "white", "blue", "green"][Math.round(Math.random() * 3)], ["red", "white", "blue", "green"][Math.round(Math.random() * 3)]]
}));

const VELOCITY = 9; // minutes per frame

function calculateSunPosition(date) {
  const day = new Date(date).setUTCHours(0, 0, 0, 0);
  const century = solar.century(date.getTime());
  const longitude = (day - date.getTime()) / 864e5 * 360 - 180  - solar.equationOfTime(century) / 4;
  const latitude = solar.declination(century)
  return {longitude, latitude};
}

const now = new Date()
const solarTile = { position: calculateSunPosition(now) };

const globe = Globe();

const globeMaterial = globe.globeMaterial();
globeMaterial.bumpScale = 10;
new THREE.TextureLoader().load("./include/earth-water.png", texture => {
  globeMaterial.specularMap = texture;
  globeMaterial.specular = new THREE.Color("grey");
  globeMaterial.shininess = 15;
});

// Setup visuals
globe.backgroundImageUrl("./include/night-sky.png")
  .globeImageUrl("./include/earth-night.jpg")
  .bumpImageUrl("./include/earth-topology.png")
  .backgroundColor("#000000")
  .showAtmosphere(true);

// Setup random arcs
globe.arcsData(arcsData)
  .arcColor("color")
  .arcDashLength(() => Math.random())
  .arcDashGap(() => Math.random())
  .arcDashAnimateTime(() => Math.random() * 4000 + 500);

globe.tilesData([solarTile])
  .tileLng(tile => tile.position.longitude)
  .tileLat(tile => tile.position.latitude)
  .tileAltitude(0.005)
  .tileWidth(180)
  .tileHeight(180)
  .tileUseGlobeProjection(false)
  .tileMaterial(() => new THREE.MeshLambertMaterial({ color: "#FFFF00", opacity: 0.1, transparent: true }))
  .tilesTransitionDuration(0);

// Render
globe(document.getElementById("globe"))

setTimeout(() => {
  const scene = globe.scene();

  const axes = new THREE.AxisHelper(150)
  axes.geometry = new THREE.Geometry().fromBufferGeometry(axes.geometry);
  scene.add(axes);

  // TODO: set directional light to point towards the light mesh, to make it more realistic
  const lightMesh = scene.children.find(object => object.type === "Mesh");
  if (lightMesh) {
    // const radius = lightMesh.parameters.radius;
    lightMesh.geometry.computeBoundingBox();
    console.log(lightMesh);
    lightMesh.visible = false;
  }

  const directionalLight = scene.children.find(object => object.type === "DirectionalLight");
  if (directionalLight) {
    console.log(directionalLight);
    directionalLight.position.set(150, 150, 150);
    directionalLight.intensity = 1;
    if (DEBUG) {
      const helper = new THREE.DirectionalLightHelper(directionalLight, 150);
      scene.add(helper);
    }
  }

  console.log(scene);
});
