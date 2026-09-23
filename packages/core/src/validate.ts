import type { CharacterDocument } from "./schema";

export class CharacterValidationError extends Error {
  readonly issues: string[];

  constructor(issues: string[]) {
    super(`Invalid NX Alive character document:\n- ${issues.join("\n- ")}`);
    this.name = "CharacterValidationError";
    this.issues = issues;
  }
}

export function validateCharacterDocument(document: CharacterDocument): string[] {
  const issues: string[] = [];

  if (document.schemaVersion !== "1.0") issues.push("unsupported schemaVersion");
  if (!document.id?.trim()) issues.push("id is required");
  if (!document.name?.trim()) issues.push("name is required");
  if (document.canvas.width <= 0 || document.canvas.height <= 0) {
    issues.push("canvas width and height must be greater than zero");
  }

  const ids = new Set<string>();

  for (const part of document.parts) {
    if (ids.has(part.id)) issues.push(`duplicate part id "${part.id}"`);
    ids.add(part.id);
    if (!part.id.trim()) issues.push("every part requires an id");
    if (part.transform.scaleX === 0 || part.transform.scaleY === 0) {
      issues.push(`part "${part.id}" cannot use a zero scale`);
    }
  }

  for (const part of document.parts) {
    if (part.parentId && !ids.has(part.parentId)) {
      issues.push(`part "${part.id}" references missing parent "${part.parentId}"`);
    }
  }

  const parentById = new Map(document.parts.map((part) => [part.id, part.parentId] as const));

  for (const part of document.parts) {
    const visited = new Set<string>();
    let cursor: string | undefined = part.id;
    while (cursor) {
      if (visited.has(cursor)) {
        issues.push(`part hierarchy contains a cycle at "${cursor}"`);
        break;
      }
      visited.add(cursor);
      cursor = parentById.get(cursor);
    }
  }

  if (!document.states[document.defaultState]) {
    issues.push(`defaultState "${document.defaultState}" is not defined`);
  }

  for (const [stateId, state] of Object.entries(document.states)) {
    if (state.expression && !document.expressions[state.expression]) {
      issues.push(`state "${stateId}" references missing expression "${state.expression}"`);
    }
    if (state.animation && !document.animations[state.animation]) {
      issues.push(`state "${stateId}" references missing animation "${state.animation}"`);
    }
  }

  for (const expression of Object.values(document.expressions)) {
    for (const patch of expression.patches) {
      if (!ids.has(patch.partId)) {
        issues.push(`expression "${expression.id}" references missing part "${patch.partId}"`);
      }
    }
  }

  for (const animation of Object.values(document.animations)) {
    if (animation.durationMs <= 0) {
      issues.push(`animation "${animation.id}" must have a positive duration`);
    }
    for (const track of animation.tracks) {
      if (!ids.has(track.partId)) {
        issues.push(`animation "${animation.id}" references missing part "${track.partId}"`);
      }
      let lastAt = -1;
      for (const keyframe of track.keyframes) {
        if (keyframe.at < 0 || keyframe.at > 1) {
          issues.push(`animation "${animation.id}" has a keyframe outside 0..1`);
        }
        if (keyframe.at < lastAt) {
          issues.push(`animation "${animation.id}" keyframes must be ordered`);
        }
        lastAt = keyframe.at;
      }
    }
  }

  return [...new Set(issues)];
}

export function parseCharacterDocument(value: unknown): CharacterDocument {
  if (!value || typeof value !== "object") {
    throw new CharacterValidationError(["document must be an object"]);
  }

  const document = value as CharacterDocument;
  const issues = validateCharacterDocument(document);
  if (issues.length) throw new CharacterValidationError(issues);
  return document;
}
