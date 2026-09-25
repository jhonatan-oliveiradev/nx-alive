// @vitest-environment jsdom
import { describe, expect, it } from "vitest";
import * as THREE from "three";
import { characters } from "../../presets/src/index";
import { parseCharacterDocument, defaultPose } from "@nx-alive/core";
import { createCharacterModel } from "./model3d";
import { rotationAfterDrag } from "./three-runtime";

describe("volumetric character model", () => {
  it.each(characters.map((d) => [d.name, d] as const))(
    "%s has finite 3D bounds and outward facial geometry",
    (_, d) => {
      const model = createCharacterModel(d, "happy");
      const bounds = new THREE.Box3().setFromObject(model.root),
        size = bounds.getSize(new THREE.Vector3());
      expect(size.z).toBeGreaterThan(0.5);
      expect(size.x).toBeGreaterThan(1);
      model.root.traverse((o) => {
        if (o instanceof THREE.Mesh) {
          const p = o.geometry.getAttribute("position");
          expect(Array.from(p.array).every(Number.isFinite)).toBe(true);
        }
      });
      expect(model.face.children.length).toBeGreaterThan(0);
      const face = model.face.children[0] as THREE.Mesh;
      expect(face.geometry.getAttribute("normal").getZ(0)).toBeGreaterThan(0);
      model.dispose();
    },
  );
  it("extrudes a custom silhouette to a nonzero depth", () => {
    const d = parseCharacterDocument({
      ...characters[0],
      body: {
        type: "custom",
        path: "M0 0L100 0L100 100L0 100Z",
        viewBox: [0, 0, 100, 100],
        visor: false,
        antennas: false,
      },
    });
    const model = createCharacterModel(d);
    expect(
      new THREE.Box3().setFromObject(model.root).getSize(new THREE.Vector3()).z,
    ).toBeGreaterThan(0.5);
    model.dispose();
  });
  it("rotates beyond the old 60 degree limit and serializes a full rear view", () => {
    const rotated = rotationAfterDrag(defaultPose, Math.PI / 0.008, 0);
    expect(Math.abs(rotated.rotationY)).toBeCloseTo(180);
    expect(() =>
      parseCharacterDocument({
        ...characters[0],
        pose: { ...defaultPose, ...rotated },
      }),
    ).not.toThrow();
    expect(
      rotationAfterDrag({ ...defaultPose, ...rotated }, 0, 0).rotationY,
    ).toBeCloseTo(rotated.rotationY);
  });
});
