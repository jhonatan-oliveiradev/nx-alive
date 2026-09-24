import { describe, expect, it } from "vitest";
import { characters, createPreset } from "@nx-alive/presets";
import { parseCharacterDocument } from "@nx-alive/core";
import {
  addCharacter,
  historyStep,
  initialState,
  parseStudio,
  removeCharacter,
  selectedCharacter,
  updateCharacter,
} from "./store";
import { exportDocument } from "./export";
describe("Studio edits", () => {
  it("ships eight valid and distinct mascots, twenty expressions and twenty-three motions", () => {
    expect(characters).toHaveLength(8);
    for (const d of characters) {
      expect(parseCharacterDocument(d)).toEqual(d);
      expect(Object.keys(d.expressions)).toHaveLength(20);
      expect(Object.keys(d.animations)).toHaveLength(23);
    }
  });
  it("creates and selects an independent character", () => {
    const state = initialState();
    const next = addCharacter(
      state,
      createPreset("new", "New", "cloud", "#AAAAAA"),
    );
    expect(selectedCharacter(next).id).toBe("new");
    expect(state.characters).toHaveLength(8);
  });
  it("changes pose and selections and persists the result", () => {
    let s = initialState();
    s = updateCharacter(s, {
      ...selectedCharacter(s),
      pose: { ...selectedCharacter(s).pose, rotationZ: 15 },
    });
    s = { ...s, expression: "happy", animation: "excited" };
    expect(parseStudio(JSON.stringify(s))).toEqual(s);
  });
  it("undoes and redoes creation, including selected character", () => {
    const s = initialState();
    let h = historyStep(
      { past: [], present: s, future: [] },
      {
        type: "edit",
        value: addCharacter(s, createPreset("new", "New", "circle", "#AAAAAA")),
      },
    );
    h = historyStep(h, { type: "undo" });
    expect(h.present).toEqual(s);
    h = historyStep(h, { type: "redo" });
    expect(selectedCharacter(h.present).id).toBe("new");
  });
  it("groups a slider drag into one undo entry", () => {
    const s = initialState();
    let h = historyStep(
      { past: [], present: s, future: [] },
      { type: "edit", value: { ...s, expression: "happy" } },
    );
    h = historyStep(h, {
      type: "edit",
      value: { ...s, expression: "sad" },
      group: true,
    });
    expect(historyStep(h, { type: "undo" }).present).toEqual(s);
  });
  it("preserves at least one character and selects after deletion", () => {
    let s = initialState();
    s = removeCharacter(s);
    expect(s.characters).toHaveLength(7);
    expect(selectedCharacter(s).id).toBe("nimbus");
    s = { ...s, characters: [s.characters[0]!] };
    expect(removeCharacter(s)).toEqual(s);
  });
  it("rejects malformed persisted data and duplicate IDs", () => {
    expect(() => parseStudio("{}")).toThrow();
    const s = initialState();
    s.characters.push(s.characters[0]!);
    expect(() => parseStudio(JSON.stringify(s))).toThrow();
  });
  it("exports only selected animations while keeping their expressions", () => {
    const d = characters[0]!;
    const result = exportDocument(d, ["idle", "happy"]);
    expect(Object.keys(result.animations)).toEqual(["idle", "happy"]);
    expect(parseCharacterDocument(JSON.parse(JSON.stringify(result)))).toEqual(
      result,
    );
    expect(Object.keys(d.animations)).toHaveLength(23);
  });
});
