import {
  Vector3
} from "../include/three"

export function radiansToDegrees(radians) {
  return radians * Math.PI / 180;
}

export function degreesToRadians(degrees) {
  return degrees * 180 / Math.PI;
}

export function coordinatesToEuler(latitude, longitude, globeRadius) {
  const a = radiansToDegrees(90 - latitude);
  const b = radiansToDegrees(longitude + 180);
  return new Vector3(-globeRadius * Math.sin(a) * Math.cos(b), globeRadius * Math.cos(a), globeRadius * Math.sin(a) * Math.sin(b))
}
