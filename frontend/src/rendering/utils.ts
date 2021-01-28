import {
  Vector3,
  Euler,
  Quaternion
} from "three"

export const IS_MOBILE = /iPhone|iPad|iPod|Android|BlackBerry|BB10/i.test(navigator.userAgent);

export function radiansToDegrees(radians: number): number {
  return radians * Math.PI / 180;
}

export function degreesToRadians(degrees: number): number {
  return degrees * 180 / Math.PI;
}

export function coordinatesToPoint(latitude: number, longitude: number, globeRadius: number): Vector3 {
  const a = radiansToDegrees(90 - latitude);
  const b = radiansToDegrees(longitude + 180);

  return new Vector3(-globeRadius * Math.sin(a) * Math.cos(b), globeRadius * Math.cos(a), globeRadius * Math.sin(a) * Math.sin(b))
}

export function coordinatesToRotation(latitude: number, longitude: number): Quaternion {
  const euler = new Euler(latitude * (Math.PI / 180), (270 - longitude) * (Math.PI / 180), 0);
  return new Quaternion().setFromEuler(euler);
}

export function supportsWebGL(): boolean {
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("webgl") || canvas.getContext("webgl2") || canvas.getContext("experimental-webgl");
  return context !== null;
}

export function easeOutCubic(x: number): number {
  return 1 - Math.pow(1 - x, 3);
}

export function getImageData(texture: HTMLImageElement): ImageData {
  const canvas = document.createElement("canvas");
  canvas.width = texture.width;
  canvas.height = texture.height;
  const ctx = canvas.getContext("2d");
  if (ctx === null)
    throw new Error("Unable to get a 2D context");
  ctx.drawImage(texture, 0, 0, texture.width, texture.height);
  return ctx.getImageData(0, 0, texture.width, texture.height);
}
