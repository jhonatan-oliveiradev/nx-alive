import { parseCharacterDocument, type CharacterDocument } from "@nx-alive/core";
import { characters } from "@nx-alive/presets";
export type StudioState = {
  schemaVersion: 2;
  characters: CharacterDocument[];
  selectedId: string;
  expression: string;
  animation: string;
  preferences: { lookAt: boolean; hover: boolean };
};
export const storageKey = "nx-alive:studio:v2";
export const initialState = (): StudioState => ({
  schemaVersion: 2,
  characters: structuredClone(characters),
  selectedId: "bloop",
  expression: "",
  animation: "idle",
  preferences: { lookAt: true, hover: true },
});
export function parseStudio(raw: string): StudioState {
  const v = JSON.parse(raw);
  if (
    v?.schemaVersion !== 2 ||
    !Array.isArray(v.characters) ||
    !v.characters.length ||
    v.characters.length > 100
  )
    throw Error("Unsupported or empty Studio project.");
  const docs = v.characters.map(parseCharacterDocument) as CharacterDocument[];
  if (new Set(docs.map((d) => d.id)).size !== docs.length)
    throw Error("Duplicate character IDs.");
  const selected = docs.find((d) => d.id === v.selectedId) ?? docs[0]!;
  return {
    schemaVersion: 2,
    characters: docs,
    selectedId: selected.id,
    expression: Object.hasOwn(selected.expressions, v.expression)
      ? v.expression
      : "",
    animation: Object.hasOwn(selected.animations, v.animation)
      ? v.animation
      : "",
    preferences: {
      lookAt: v.preferences?.lookAt === true,
      hover: v.preferences?.hover === true,
    },
  };
}
export function selectedCharacter(s: StudioState) {
  return s.characters.find((d) => d.id === s.selectedId) ?? s.characters[0]!;
}
export function updateCharacter(
  s: StudioState,
  d: CharacterDocument,
): StudioState {
  return {
    ...s,
    characters: s.characters.map((c) =>
      c.id === d.id ? parseCharacterDocument(d) : c,
    ),
  };
}
export function addCharacter(
  s: StudioState,
  d: CharacterDocument,
): StudioState {
  if (s.characters.length >= 100)
    throw Error("Your library supports up to 100 characters.");
  return {
    ...s,
    characters: [...s.characters, parseCharacterDocument(d)],
    selectedId: d.id,
    expression: "",
    animation: "idle",
  };
}
export function removeCharacter(s: StudioState): StudioState {
  if (s.characters.length === 1) return s;
  const docs = s.characters.filter((c) => c.id !== s.selectedId);
  return {
    ...s,
    characters: docs,
    selectedId: docs[0]!.id,
    expression: "",
    animation: "idle",
  };
}
export type History = {
  past: StudioState[];
  present: StudioState;
  future: StudioState[];
};
export function historyStep(
  h: History,
  action:
    | { type: "edit"; value: StudioState; group?: boolean }
    | { type: "undo" | "redo" },
): History {
  if (action.type === "undo")
    return h.past.length
      ? {
          past: h.past.slice(0, -1),
          present: h.past.at(-1)!,
          future: [h.present, ...h.future],
        }
      : h;
  if (action.type === "redo")
    return h.future.length
      ? {
          past: [...h.past, h.present],
          present: h.future[0]!,
          future: h.future.slice(1),
        }
      : h;
  if (action.type === "edit")
    return {
      past: action.group ? h.past : [...h.past.slice(-39), h.present],
      present: action.value,
      future: [],
    };
  return h;
}
