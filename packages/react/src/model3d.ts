import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { SVGLoader } from "three/addons/loaders/SVGLoader.js";
import {
  parseCharacterDocument,
  renderFaceSvg,
  type CharacterDocument,
} from "@nx-alive/core";

/** Original volumetric interpretations of NX shapes. +Z is the face, Y is up. */
export function createCharacterModel(
  input: CharacterDocument,
  expression?: string,
) {
  const d = parseCharacterDocument(input);
  const root = new THREE.Group();
  root.name = "nx-character";
  const body = new THREE.Group();
  body.name = "body";
  root.add(body);
  const guides = new THREE.Group();
  guides.name = "surface-guides";
  root.add(guides);
  const materials: THREE.Material[] = [];
  const mat = (color: string, roughness = 0.46) => {
    const m = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness: 0.03,
    });
    materials.push(m);
    return m;
  };
  const bodyMat = mat(d.colors.body);
  const guideMat = new THREE.LineBasicMaterial({
    color: "#665780",
    transparent: true,
    opacity: 0.4,
    depthWrite: false,
  });
  materials.push(guideMat);
  const solids: THREE.Mesh[] = [];
  function add(
    geometry: THREE.BufferGeometry,
    material = bodyMat,
    position = [0, 0, 0],
    scale = [1, 1, 1],
  ) {
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.fromArray(position);
    mesh.scale.fromArray(scale);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    body.add(mesh);
    solids.push(mesh);
    // Latitude/longitude lines instead of triangulation diagonals for spherical bodies.
    const points: THREE.Vector3[] = [];
    if (geometry instanceof THREE.SphereGeometry) {
      const p = geometry.getAttribute("position"),
        w = geometry.parameters.widthSegments,
        h = geometry.parameters.heightSegments;
      for (let y = 0; y <= h; y++)
        for (let x = 0; x < w; x++) {
          const i = y * (w + 1) + x;
          if (y % 4 === 0)
            points.push(
              new THREE.Vector3().fromBufferAttribute(p, i),
              new THREE.Vector3().fromBufferAttribute(p, i + 1),
            );
          if (x % 4 === 0 && y < h)
            points.push(
              new THREE.Vector3().fromBufferAttribute(p, i),
              new THREE.Vector3().fromBufferAttribute(p, i + w + 1),
            );
        }
    }
    if (!(geometry instanceof THREE.SphereGeometry)) {
      mesh.updateWorldMatrix(true, false);
      const center = mesh.getWorldPosition(new THREE.Vector3()),
        cast = new THREE.Raycaster();
      const point = (theta: number, phi: number) => {
        const direction = new THREE.Vector3(
          Math.sin(phi) * Math.cos(theta),
          Math.cos(phi),
          Math.sin(phi) * Math.sin(theta),
        );
        cast.set(
          center.clone().addScaledVector(direction, 5),
          direction.clone().negate(),
        );
        const hit = cast.intersectObject(mesh, false)[0];
        return hit ? mesh.worldToLocal(hit.point).multiplyScalar(1.003) : null;
      };
      for (const phi of [Math.PI / 4, Math.PI / 2, (Math.PI * 3) / 4])
        for (let j = 0; j < 48; j++) {
          const a = point((j / 48) * Math.PI * 2, phi),
            b = point(((j + 1) / 48) * Math.PI * 2, phi);
          if (a && b) points.push(a, b);
        }
      for (let meridian = 0; meridian < 8; meridian++)
        for (let j = 1; j < 24; j++) {
          const theta = (meridian / 8) * Math.PI * 2,
            a = point(theta, (j / 24) * Math.PI),
            b = point(theta, ((j + 1) / 24) * Math.PI);
          if (a && b) points.push(a, b);
        }
    }
    const line = new THREE.LineSegments(
      points.length
        ? new THREE.BufferGeometry().setFromPoints(points)
        : new THREE.EdgesGeometry(geometry, 12),
      guideMat,
    );
    line.renderOrder = 3;
    line.position.copy(mesh.position);
    line.scale.copy(mesh.scale).multiplyScalar(1.004);
    guides.add(line);
    return mesh;
  }
  const sphere = () => new THREE.SphereGeometry(1, 32, 24);
  if (d.body.type === "cloud") {
    add(sphere(), bodyMat, [0, 0, 0], [1.03, 0.91, 0.72]);
    for (const [x, y, s] of [
      [-0.86, -0.07, 0.53],
      [-0.48, 0.62, 0.52],
      [0.21, 0.76, 0.59],
      [0.83, 0.2, 0.53],
      [0.67, -0.53, 0.46],
      [-0.35, -0.64, 0.48],
    ])
      add(sphere(), bodyMat, [x!, y!, 0], [s!, s!, 0.53]);
  } else if (d.body.type === "rounded-square")
    add(new RoundedBoxGeometry(1.94, 1.88, 1.38, 5, 0.42));
  else if (d.body.type === "capsule")
    add(new THREE.CapsuleGeometry(0.72, 0.7, 12, 48));
  else if (d.body.type === "custom") {
    const parsed = new SVGLoader().parse(
      `<svg xmlns="http://www.w3.org/2000/svg"><path d="${d.body.path}"/></svg>`,
    );
    const shapes = parsed.paths.flatMap((p) => p.toShapes());
    if (!shapes.length) throw Error("This SVG has no closed shape to extrude.");
    const g = new THREE.ExtrudeGeometry(shapes, {
      depth: 0.6,
      bevelEnabled: false,
      curveSegments: 20,
      steps: 1,
    });
    const box = new THREE.Box3().setFromBufferAttribute(
      g.getAttribute("position") as THREE.BufferAttribute,
    );
    const size = box.getSize(new THREE.Vector3()),
      center = box.getCenter(new THREE.Vector3());
    if (
      !Number.isFinite(size.x) ||
      !Number.isFinite(size.y) ||
      Math.max(size.x, size.y) <= 0
    ) {
      g.dispose();
      throw Error("This SVG needs a nonzero outline.");
    }
    g.translate(-center.x, -center.y, -center.z);
    g.scale(2.1 / Math.max(size.x, size.y), -2.1 / Math.max(size.x, size.y), 1);
    // The reflection changes winding; reverse triangle vertices to retain outward faces.
    const idx = g.index;
    if (idx)
      for (let i = 0; i < idx.count; i += 3) {
        const a = idx.getX(i);
        idx.setX(i, idx.getX(i + 2));
        idx.setX(i + 2, a);
      }
    else {
      for (const name of Object.keys(g.attributes)) {
        const a = g.getAttribute(name);
        for (let i = 0; i < a.count; i += 3)
          for (let c = 0; c < a.itemSize; c++) {
            const array = a.array;
            const v = array[i * a.itemSize + c]!;
            array[i * a.itemSize + c] = array[(i + 2) * a.itemSize + c]!;
            array[(i + 2) * a.itemSize + c] = v;
          }
      }
    }
    g.computeVertexNormals();
    add(g);
  } else {
    const g = sphere();
    if (d.body.type === "blob") {
      const p = g.getAttribute("position");
      for (let i = 0; i < p.count; i++) {
        const y = p.getY(i),
          x = p.getX(i);
        p.setXYZ(
          i,
          x * (1 + 0.1 * Math.sin(y * 3)) + 0.08 * y * y,
          y * 1.06,
          p.getZ(i) * 0.78,
        );
      }
      g.computeVertexNormals();
    }
    add(
      g,
      bodyMat,
      [0, 0, 0],
      d.body.type === "circle" ? [1, 1, 0.82] : [1, 1, 1],
    );
  }
  if (d.body.visor) {
    const visor = add(
      new RoundedBoxGeometry(1.5, 0.9, 0.18, 4, 0.18),
      mat(d.colors.visor, 0.28),
      [0, 0.08, 0.72],
    );
    visor.name = "visor";
    visor.renderOrder = 1;
  }
  if (d.body.antennas)
    for (const side of [-1, 1]) {
      const stalk = add(new THREE.CapsuleGeometry(0.05, 0.32, 6, 12), bodyMat, [
        side * 0.5,
        1.02,
        0,
      ]);
      stalk.rotation.z = -side * 0.3;
      add(new THREE.SphereGeometry(0.1, 16, 12), mat(d.colors.accent), [
        side * 0.56,
        1.22,
        0,
      ]);
    }
  root.updateMatrixWorld(true);
  // Vector facial geometry projected onto the actual body, never a camera-facing billboard.
  const face = new THREE.Group();
  face.name = "face";
  root.add(face);
  const artwork = new SVGLoader().parse(renderFaceSvg(d, expression));
  const ray = new THREE.Raycaster();
  function project(g: THREE.BufferGeometry, color: string, opacity = 1) {
    const p = g.getAttribute("position");
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i) / 100,
        y = -p.getY(i) / 100;
      ray.set(new THREE.Vector3(x, y, 4), new THREE.Vector3(0, 0, -1));
      const hit = ray.intersectObjects(solids, false)[0];
      p.setXYZ(i, x, y, hit ? hit.point.z + 0.025 : 0);
    }
    // SVG has downward Y; the reflection must preserve outward triangle winding.
    const index = g.index;
    if (index)
      for (let i = 0; i < index.count; i += 3) {
        const a = index.getX(i);
        index.setX(i, index.getX(i + 2));
        index.setX(i + 2, a);
      }
    else
      for (const name of Object.keys(g.attributes)) {
        const a = g.getAttribute(name);
        for (let i = 0; i < a.count; i += 3)
          for (let c = 0; c < a.itemSize; c++) {
            const values = a.array;
            const v = values[i * a.itemSize + c]!;
            values[i * a.itemSize + c] = values[(i + 2) * a.itemSize + c]!;
            values[(i + 2) * a.itemSize + c] = v;
          }
      }
    g.computeVertexNormals();
    const material = new THREE.MeshBasicMaterial({
      color,
      opacity,
      transparent: opacity < 1,
      side: THREE.FrontSide,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    });
    materials.push(material);
    const mesh = new THREE.Mesh(g, material);
    mesh.renderOrder = 2;
    face.add(mesh);
  }
  for (const path of artwork.paths) {
    const style = path.userData?.style as
      | (Parameters<typeof SVGLoader.pointsToStroke>[1] & {
          fill?: string;
          stroke?: string;
          fillOpacity?: number;
          strokeOpacity?: number;
          opacity?: number;
        })
      | undefined;
    if (style?.fill && style.fill !== "none")
      for (const shape of path.toShapes())
        project(
          new THREE.ShapeGeometry(shape, 16),
          style.fill,
          Number(style.fillOpacity ?? 1) * Number(style.opacity ?? 1),
        );
    if (style?.stroke && style.stroke !== "none")
      for (const sub of path.subPaths) {
        const geometry = SVGLoader.pointsToStroke(sub.getPoints(32), style);
        if (geometry)
          project(
            geometry,
            style.stroke,
            Number(style.strokeOpacity ?? 1) * Number(style.opacity ?? 1),
          );
      }
  }

  return {
    root,
    guides,
    face,
    dispose() {
      root.traverse((o) => {
        if (o instanceof THREE.Mesh || o instanceof THREE.LineSegments)
          o.geometry.dispose();
      });
      materials.forEach((m) => m.dispose());
    },
  };
}
