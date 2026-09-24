import type { AnimationFrame, CharacterDocument } from "./schema";
export function resolveExpression(document: CharacterDocument, id?: string) {
  const e =
    id && Object.hasOwn(document.expressions, id)
      ? document.expressions[id]
      : undefined;
  return {
    ...document.face,
    eyes: e?.eyes ?? document.face.eyes,
    mouth: e?.mouth ?? document.face.mouth,
    x: document.face.x + (e?.x ?? 0),
    y: document.face.y + (e?.y ?? 0),
    eyeScale: document.face.eyeScale * (e?.eyeScale ?? 1),
    tilt: e?.tilt ?? 0,
    blush: e?.blush ?? false,
  };
}
export function resolveAnimation(document: CharacterDocument, id?: string) {
  return id && Object.hasOwn(document.animations, id)
    ? document.animations[id]
    : undefined;
}
export const restFrame: AnimationFrame = {
  at: 0,
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
};
export function sampleAnimation(
  document: CharacterDocument,
  id: string,
  timeMs: number,
): AnimationFrame {
  const a = resolveAnimation(document, id);
  if (!a) return { ...restFrame };
  const t = a.loop
    ? (Math.max(0, timeMs) % a.durationMs) / a.durationMs
    : Math.min(1, Math.max(0, timeMs) / a.durationMs);
  const i = a.frames.findIndex((f) => f.at >= t);
  const end = a.frames[Math.max(0, i)]!;
  const start = a.frames[Math.max(0, i - 1)]!;
  const raw = end.at === start.at ? 0 : (t - start.at) / (end.at - start.at);
  const p = raw * raw * (3 - 2 * raw);
  return {
    at: t,
    x: start.x + (end.x - start.x) * p,
    y: start.y + (end.y - start.y) * p,
    rotation: start.rotation + (end.rotation - start.rotation) * p,
    scaleX: start.scaleX + (end.scaleX - start.scaleX) * p,
    scaleY: start.scaleY + (end.scaleY - start.scaleY) * p,
  };
}
