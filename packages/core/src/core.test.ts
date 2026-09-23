import { describe, expect, it } from "vitest";
import {
  parseCharacterDocument,
  resolveCharacterState,
  validateCharacterDocument,
  type CharacterDocument,
} from "./index";

const fixture = (): CharacterDocument => ({
  schemaVersion: "1.0",
  id: "test",
  name: "Test",
  canvas: { width: 200, height: 200 },
  parts: [
    {
      id: "body",
      name: "Body",
      zIndex: 0,
      visible: true,
      transform: { x: 100, y: 100, scaleX: 1, scaleY: 1, rotation: 0 },
      shape: { kind: "circle", radius: 50 },
      appearance: { fill: "#6b6cff" },
    },
    {
      id: "eye",
      name: "Eye",
      parentId: "body",
      zIndex: 1,
      visible: true,
      transform: { x: 16, y: -8, scaleX: 1, scaleY: 1, rotation: 0 },
      shape: { kind: "capsule", width: 12, height: 28 },
      appearance: { fill: "#fff" },
    },
  ],
  expressions: {
    sleep: {
      id: "sleep",
      name: "Sleep",
      patches: [{ partId: "eye", visible: false }],
    },
  },
  animations: {},
  states: {
    idle: {},
    sleeping: { expression: "sleep" },
  },
  defaultState: "idle",
});

describe("@nx-alive/core", () => {
  it("validates a portable character document", () => {
    expect(validateCharacterDocument(fixture())).toEqual([]);
    expect(parseCharacterDocument(fixture()).id).toBe("test");
  });

  it("resolves semantic state into expression patches", () => {
    const result = resolveCharacterState(fixture(), "sleeping");
    expect(result.parts.find((part) => part.id === "eye")?.visible).toBe(false);
  });

  it("rejects broken parent references", () => {
    const invalid = fixture();
    invalid.parts[1] = { ...invalid.parts[1]!, parentId: "missing" };
    expect(validateCharacterDocument(invalid)).toContain(
      'part "eye" references missing parent "missing"',
    );
  });
});
