import {
  Vector3
} from "../include/three"

export const IS_MOBILE = /iPhone|iPad|iPod|Android|BlackBerry|BB10/i.test(navigator.userAgent);

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

export function supportsWebGL() {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl") || canvas.getContext("webgl2") || canvas.getContext("experimental-webgl");
  return context !== null;
}


export function getImageData(texture) {
  const canvas = document.createElement("canvas");
  canvas.width = texture.width;
  canvas.height = texture.height;
  const ctx = canvas.getContext("2d");
  ctx.drawImage(texture, 0, 0, texture.width, texture.height);
  return ctx.getImageData(0, 0, texture.width, texture.height);
}
