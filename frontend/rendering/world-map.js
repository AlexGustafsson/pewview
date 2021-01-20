import {
  Object3D,
  CircleBufferGeometry,
  MeshStandardMaterial,
  InstancedMesh
} from "../include/three"

import {getImageData, coordinatesToEuler, radiansToDegrees} from "./utils"

export default class WorldMap {
  constructor({radius, texture, rows, size}) {
    this.radius = radius;
    this.texture = texture;
    this.rows = rows;
    this.size = size;

    // Create the world map
    const map = new Object3D();
    const image = getImageData(texture.image);
    const uniforms = [];
    for (let latitude = -90; latitude <= 90; latitude += 180 / rows) {
      // The number of circles to draw (calculates the curvature of the earth for the distance)
      const t = Math.cos(radiansToDegrees(Math.abs(latitude))) * radius * Math.PI * 2 * 2;
      for (let r = 0; r < t; r++) {
        const longitude = 360 * r / t - 180;
        // Coordinates are shifted in the context
        if (!this.coordinateIsVisible(longitude, latitude, image))
          continue;
        const position = coordinatesToEuler(latitude, longitude, radius);
        map.position.set(position.x, position.y, position.z);
        const lookAt = coordinatesToEuler(latitude, longitude, radius + 5);
        map.lookAt(lookAt.x, lookAt.y, lookAt.z);
        map.updateMatrix();
        uniforms.push(map.matrix.clone())
      }
    }

    const geometry = new CircleBufferGeometry(size, 5);
    const material = new MeshStandardMaterial({
      color: 0x3a4494,
      metalness: 0,
      roughness: .9,
      transparent: true,
      alphaTest: .02
    });
    // This doesn't seem to have an effect
    // material.onBeforeCompile = texture => {
    //   texture.fragmentShader = texture.fragmentShader.replace(
    //     "gl_FragColor = vec4( outgoingLight, diffuseColor.a );",
    //     "\n        gl_FragColor = vec4( outgoingLight, diffuseColor.a );\n        if (gl_FragCoord.z > 0.51) {\n          gl_FragColor.a = 1.0 + ( 0.51 - gl_FragCoord.z ) * 17.0;\n        }\n      "
    //   );
    // };
    this.mesh = new InstancedMesh(geometry, material, uniforms.length);
    for (let i = 0; i < uniforms.length; i++)
      this.mesh.setMatrixAt(i, uniforms[i]);
    this.mesh.renderOrder = 3;
  }

  coordinateIsVisible(latitude, longitude, image) {
    // Calculate the pixel coordinates of the geographical coordinate
    const x = parseInt((latitude + 180) / 360 * image.width + .5);
    const y = image.height - parseInt((longitude + 90) / 180 * image.height - .5);
    // Index in the image data (4 values per pixel)
    const index = Math.floor(image.width * 4 * (y - 1) + 4 * x) + 3;
    return image.data[index] > 90
  }
}
