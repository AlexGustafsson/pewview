import Globe from "./globe"
import Client from "./client"

const DEBUG = true;
const DEMO_DATA = true;

const POINTS_OF_INTEREST = [
  {latitude: 50.510986, longitude: 16.049161}, // "Europe"
  {latitude: 2.341285, longitude: 21.940375}, // "Africa"
  {latitude: 45.296762, longitude: -98.680842}, // "North America"
  {latitude: -20.581282, longitude: -58.949614 }, // "South America"
  {latitude: -14.628517, longitude: 133.087610}, // "Oceania"
  {latitude: 39.602024, longitude: 133.563252}, // "East Asia"
  {latitude: 26.001432, longitude: 101.085334}, // "South Asia"
  {latitude: 60.653543, longitude: 84.736702}, // "North Asia"
  {latitude: 36.612646, longitude: 63.891532}, // "West Asia"
];

function main() {
  // Render
  const globe = new Globe();
  globe.pointsOfInterest = POINTS_OF_INTEREST;
  globe.mount(document.getElementById("globe"));

  // Connect
  const client = new Client();
  client.addEventListener("data", arcsData => {
    globe.arcsData(arcsData);
  });
  client.connect(location.host);

  if (DEBUG) {
    globe.drawAxes();
    globe.drawLights();

    window.globe = globe;
    window.client = client;
  }

  if (DEMO_DATA) {
    function randomColor() {
      const colors = ["#ba1e68", "#5643fd", "#7659fe", "#fcfbfe"];
      return colors[Math.floor(Math.random() * colors.length)];
    }

    function randomLatitude() {
      return (Math.random() - 0.5) * 180;
    }

    function randomLongitude() {
      return (Math.random() - 0.5) * 360;
    }

    const randomData = Array(30).fill(null).map(() => ({
      source: {
        latitude: randomLatitude(),
        longitude: randomLongitude(),
      },
      destination: {
        latitude: randomLatitude(),
        longitude: randomLongitude(),
      },
      colors: [randomColor(), randomColor(), randomColor()],
      animateTime: Math.random() * 4000 + 500,
      gap: Math.random(),
      length: Math.random(),
    }));
    globe.push(...randomData)
  }
}

window.main = main;
main();
