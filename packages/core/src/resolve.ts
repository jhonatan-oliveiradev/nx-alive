import type {
  Appearance,
  CharacterDocument,
  CharacterPart,
  Transform2D,
} from "./schema";

function mergeTransform(base: Transform2D, patch?: Partial<Transform2D>): Transform2D {
  return patch ? { ...base, ...patch } : base;
}

function mergeAppearance(base: Appearance, patch?: Appearance): Appearance {
  return patch ? { ...base, ...patch } : base;
}

export function resolveExpression(
  document: CharacterDocument,
  expressionId?: string,
): CharacterPart[] {
  const expression = expressionId ? document.expressions[expressionId] : undefined;
  const patches = new Map(expression?.patches.map((patch) => [patch.partId, patch]) ?? []);

  return document.parts.map((part) => {
    const patch = patches.get(part.id);
    if (!patch) return part;
    return {
      ...part,
      visible: patch.visible ?? part.visible,
      transform: mergeTransform(part.transform, patch.transform),
      appearance: mergeAppearance(part.appearance, patch.appearance),
      shape: patch.shape ?? part.shape,
    };
  });
}

export function resolveCharacterState(
  document: CharacterDocument,
  stateId = document.defaultState,
) {
  const resolvedStateId = document.states[stateId] ? stateId : document.defaultState;
  const state = document.states[resolvedStateId];

  return {
    stateId: resolvedStateId,
    expressionId: state?.expression,
    animationId: state?.animation,
    parts: resolveExpression(document, state?.expression),
  };
}

export function buildPartTree(parts: CharacterPart[]) {
  const children = new Map<string | null, CharacterPart[]>();

  for (const part of parts) {
    const key = part.parentId ?? null;
    const list = children.get(key) ?? [];
    list.push(part);
    children.set(key, list);
  }

  for (const list of children.values()) {
    list.sort((a, b) => a.zIndex - b.zIndex);
  }

  return children;
}
