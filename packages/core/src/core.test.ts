import { describe, expect, it } from "vitest";
import {
  defaultFace,
  defaultPose,
  parseCharacterDocument,
  serializeCharacter,
  resolveExpression,
  resolveAnimation,
  sampleAnimation,
  renderCharacterSvg,
  type CharacterDocument,
} from "./index";
const document: CharacterDocument = {
  schemaVersion: "2.0",
  id: "test",
  name: "Test",
  canvas: { width: 400, height: 400 },
  body: { type: "circle", visor: false, antennas: false },
  colors: {
    body: "#AAAAAA",
    eyes: "#111111",
    mouth: "#111111",
    accent: "#FFAAAA",
    visor: "#222222",
  },
  face: { ...defaultFace },
  pose: { ...defaultPose },
  metadata: { author: "Test", description: "" },
  expressions: {
    happy: {
      name: "Happy",
      eyes: "happy",
      mouth: "smile",
      x: 3,
      y: 0,
      eyeScale: 1,
      tilt: 5,
      blush: true,
    },
  },
  animations: {
    idle: {
      name: "Idle",
      category: "Life cycle",
      expression: "happy",
      durationMs: 1000,
      loop: true,
      frames: [
        { at: 0, x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
        { at: 0.5, x: 0, y: -10, scaleX: 1, scaleY: 1, rotation: 0 },
        { at: 1, x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 },
      ],
    },
  },
};
describe("portable character", () => {
  it("round trips without changing the character", () =>
    expect(
      parseCharacterDocument(JSON.parse(serializeCharacter(document))),
    ).toEqual(document));
  it.each([
    null,
    {},
    [],
    { schemaVersion: "1.0" },
    { ...document, pose: { ...document.pose, scale: NaN } },
    {
      ...document,
      colors: { ...document.colors, body: "url(https://evil.test)" },
    },
  ])("rejects malformed input", (value) =>
    expect(() => parseCharacterDocument(value)).toThrow(),
  );
  it("rejects dangling expression references", () =>
    expect(() =>
      parseCharacterDocument({ ...document, expressions: {} }),
    ).toThrow());
  it("rejects untrusted path markup", () =>
    expect(() =>
      parseCharacterDocument({
        ...document,
        body: {
          type: "custom",
          path: "<script/>",
          viewBox: [0, 0, 10, 10],
          visor: false,
          antennas: false,
        },
      }),
    ).toThrow());
  it("resolves expressions without mutating the base", () => {
    expect(resolveExpression(document, "happy")).toMatchObject({
      eyes: "happy",
      x: 3,
      blush: true,
    });
    expect(document.face.eyes).toBe("pill");
    expect(resolveExpression(document, "missing").eyes).toBe("pill");
  });
  it("resolves missing animations safely", () =>
    expect(resolveAnimation(document, "missing")).toBeUndefined());
  it("samples frames and looping time", () => {
    expect(sampleAnimation(document, "idle", 500).y).toBe(-10);
    expect(sampleAnimation(document, "idle", 1500).y).toBe(-10);
    expect(sampleAnimation(document, "idle", 250).y).toBe(-5);
  });
  it("holds the last frame for play once", () => {
    const d = structuredClone(document);
    d.animations.idle!.loop = false;
    expect(sampleAnimation(d, "idle", 1600).y).toBe(0);
  });
  it("rejects unordered frames", () => {
    const d = structuredClone(document);
    d.animations.idle!.frames[1]!.at = 0;
    expect(() => parseCharacterDocument(d)).toThrow();
  });
  it("exports escaped SVG with scoped motion and reduced-motion support", () => {
    const svg = renderCharacterSvg(
      { ...document, name: '<img onerror="bad">' },
      { id: "test", animation: "idle", playing: false },
    );
    expect(svg).toContain("&lt;img");
    expect(svg).not.toContain("<img");
    expect(svg).toContain("prefers-reduced-motion");
    expect(svg).toContain("animation-play-state:paused");
    expect(svg).toContain("@keyframes test-motion");
  });
});
