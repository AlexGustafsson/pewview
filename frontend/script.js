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
  .backgroundColor("#000000");

// Setup random arcs
globe.arcsData(arcsData)
  .arcColor("color")
  .arcDashLength(() => Math.random())
  .arcDashGap(() => Math.random())
  .arcDashAnimateTime(() => Math.random() * 4000 + 500);

// Setup solar position
// const texture = new THREE.TextureLoader().load( "./include/earth-day.jpg" );
globe.tilesData([solarTile])
  .tileLng(tile => tile.position.longitude)
  .tileLat(tile => tile.position.latitude)
  .tileAltitude(0.005)
  .tileWidth(180)
  .tileHeight(180)
  .tileUseGlobeProjection(false)
  // .tileMaterial(() => new THREE.MeshLambertMaterial({ map: texture, opacity: 0.3, transparent: true }))
  .tileMaterial(() => new THREE.MeshLambertMaterial({ color: "#FFFF00", opacity: 0.3, transparent: true }))
  .tilesTransitionDuration(0);

// Render
globe(document.getElementById("globe"))

setTimeout(() => {
  const directionalLight = globe.scene().children.find(object => object.type === "DirectionalLight");
  if (directionalLight)
    directionalLight.position.set(1, 1, 1);

  // TODO: set directioal light to point towards the light mesh, to make it more realistic
  const lightMesh = globe.scene().children.find(object => object.type === "Mesh");
  if (lightMesh)
    console.log(lightMesh);
});
