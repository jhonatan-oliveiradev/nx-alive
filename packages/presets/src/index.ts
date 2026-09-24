import {
  defaultFace,
  defaultPose,
  parseCharacterDocument,
  type CharacterDocument,
  type CharacterExpression,
  type CharacterAnimation,
  type AnimationFrame,
} from "@nx-alive/core";
const expression = (
  name: string,
  eyes: CharacterExpression["eyes"],
  mouth: CharacterExpression["mouth"],
  extra: Partial<CharacterExpression> = {},
): CharacterExpression => ({
  name,
  eyes,
  mouth,
  x: 0,
  y: 0,
  eyeScale: 1,
  tilt: 0,
  blush: false,
  ...extra,
});
export const expressions: Record<string, CharacterExpression> = {
  neutral: expression("Neutral", "pill", "tiny"),
  happy: expression("Happy", "happy", "smile"),
  "very-happy": expression("Very happy", "happy", "open-smile", {
    blush: true,
  }),
  sad: expression("Sad", "sad", "sad", { y: 5 }),
  angry: expression("Angry", "angry", "flat", { y: 2 }),
  sleepy: expression("Sleepy", "flat", "tiny", { tilt: -6 }),
  sleeping: expression("Sleeping", "closed", "none", { y: 5 }),
  curious: expression("Curious", "wide", "tiny", { tilt: 9, x: 3 }),
  confused: expression("Confused", "wink", "o", { tilt: -10 }),
  surprised: expression("Surprised", "surprised", "o", { eyeScale: 1.2 }),
  scared: expression("Scared", "wide", "o", { eyeScale: 1.15, y: -4 }),
  shy: expression("Shy", "dot", "smile", { blush: true, tilt: 6, y: 6 }),
  bored: expression("Bored", "flat", "flat"),
  suspicious: expression("Suspicious", "wink", "flat", { x: 7 }),
  thinking: expression("Thinking", "pill", "tiny", { x: -6, y: -6, tilt: -7 }),
  excited: expression("Excited", "wide", "open-smile", { blush: true }),
  proud: expression("Proud", "closed", "smile", { y: -6 }),
  laughing: expression("Laughing", "happy", "laugh", { blush: true }),
  playful: expression("Playful", "wink", "open-smile", { tilt: 8 }),
  dizzy: expression("Dizzy", "dot", "o", { tilt: 15, eyeScale: 1.3 }),
};
const frame = (
  at: number,
  extra: Partial<AnimationFrame> = {},
): AnimationFrame => ({
  at,
  x: 0,
  y: 0,
  rotation: 0,
  scaleX: 1,
  scaleY: 1,
  ...extra,
});
function motion(
  name: string,
  expr: string,
  category: CharacterAnimation["category"],
  durationMs: number,
  mid: Partial<AnimationFrame>,
  loop = true,
): CharacterAnimation {
  return {
    name,
    expression: expr,
    category,
    durationMs,
    loop,
    frames: [
      frame(0),
      frame(0.25, {
        ...mid,
        rotation: -(mid.rotation ?? 0) * 0.45 || 0,
        y: (mid.y ?? 0) * 0.2,
        scaleY: 1 - (mid.scaleY ?? 1) + 1,
      }),
      frame(0.5, mid),
      frame(0.75, {
        rotation: (mid.rotation ?? 0) * 0.2,
        y: (mid.y ?? 0) * 0.35,
      }),
      frame(1),
    ],
  };
}
export const animations: Record<string, CharacterAnimation> = {
  sleeping: motion("Sleeping", "sleeping", "Life cycle", 4500, {
    scaleX: 1.035,
    scaleY: 0.96,
    y: 3,
  }),
  waking: motion(
    "Waking",
    "surprised",
    "Life cycle",
    1800,
    { scaleY: 1.13, scaleX: 0.94, y: -9 },
    false,
  ),
  idle: motion("Idle", "neutral", "Life cycle", 3400, {
    scaleY: 1.025,
    scaleX: 0.985,
    y: -2,
  }),
  listening: motion("Listening", "curious", "Life cycle", 2200, {
    rotation: 5,
    y: -2,
  }),
  thinking: motion("Thinking", "thinking", "Life cycle", 2800, {
    rotation: -5,
    x: -2,
  }),
  searching: motion("Searching", "curious", "Life cycle", 2100, {
    x: 12,
    rotation: 7,
  }),
  working: motion("Working", "neutral", "Life cycle", 950, {
    y: 3,
    rotation: -3,
  }),
  excited: motion("Excited", "excited", "Reactions", 650, {
    y: -22,
    scaleX: 0.94,
    scaleY: 1.08,
  }),
  bored: motion("Bored", "bored", "Reactions", 4200, {
    y: 6,
    scaleY: 0.95,
    rotation: -3,
  }),
  suspicious: motion("Suspicious", "suspicious", "Reactions", 2600, {
    x: 5,
    rotation: -7,
  }),
  angry: motion("Angry", "angry", "Reactions", 350, { x: 4, rotation: 3 }),
  drowsy: motion("Drowsy", "sleepy", "Reactions", 3200, { rotation: 12, y: 8 }),
  happy: motion("Happy", "happy", "Reactions", 1400, { y: -9, rotation: 5 }),
  curious: motion("Curious", "curious", "Reactions", 2400, {
    rotation: 11,
    y: -3,
  }),
  confused: motion("Confused", "confused", "Reactions", 1600, {
    rotation: -12,
    x: -4,
  }),
  surprised: motion(
    "Surprised",
    "surprised",
    "Reactions",
    1000,
    { scaleY: 1.15, scaleX: 0.9, y: -13 },
    false,
  ),
  proud: motion("Proud", "proud", "Reactions", 2600, { scaleY: 1.04, y: -5 }),
  shy: motion("Shy", "shy", "Reactions", 2800, {
    rotation: -8,
    scaleX: 0.95,
    scaleY: 0.96,
  }),
  sad: motion("Sad", "sad", "Reactions", 3600, { y: 7, scaleY: 0.95 }),
  laughing: motion("Laughing", "laughing", "Reactions", 750, {
    y: 4,
    scaleY: 0.92,
    scaleX: 1.05,
  }),
  scared: motion("Scared", "scared", "Reactions", 400, {
    x: 3,
    rotation: -3,
    scaleY: 1.04,
  }),
  playful: motion("Playful", "playful", "Reactions", 1100, {
    y: -12,
    rotation: 14,
  }),
  celebrate: motion("Celebrate", "very-happy", "Reactions", 900, {
    y: -26,
    rotation: -12,
    scaleY: 1.08,
  }),
};
export function createPreset(
  id: string,
  name: string,
  type: CharacterDocument["body"]["type"],
  color: string,
  extra: Partial<CharacterDocument> = {},
): CharacterDocument {
  return parseCharacterDocument({
    schemaVersion: "2.0",
    id,
    name,
    canvas: { width: 400, height: 400 },
    body: { type, visor: false, antennas: false },
    colors: {
      body: color,
      eyes: "#17202B",
      mouth: "#17202B",
      accent: "#F794B5",
      visor: "#24243B",
    },
    face: { ...defaultFace },
    pose: { ...defaultPose },
    expressions: structuredClone(expressions),
    animations: structuredClone(animations),
    metadata: {
      author: "NX Alive",
      description: "A little character with a lot to say.",
    },
    ...extra,
  });
}
export const characters: CharacterDocument[] = [
  createPreset("bloop", "Bloop", "circle", "#779AF5"),
  createPreset("nimbus", "Nimbus", "cloud", "#CCD1DC"),
  createPreset("momo", "Momo", "blob", "#F6B2D7"),
  createPreset("poppy", "Poppy", "capsule", "#EE6F70"),
  createPreset("yolk", "Yolk", "blob", "#F4CE55", {
    pose: { ...defaultPose, width: 0.8, height: 1.08 },
    face: { ...defaultFace, spacing: 40 },
  }),
  createPreset("dew", "Dew", "blob", "#82D3DB", {
    pose: { ...defaultPose, rotationZ: -12, width: 0.92 },
    face: { ...defaultFace, mouth: "tiny" },
  }),
  createPreset("noir", "Noir", "rounded-square", "#292B36", {
    colors: {
      body: "#292B36",
      eyes: "#FAF8F2",
      mouth: "#FAF8F2",
      accent: "#A6A2F5",
      visor: "#24243B",
    },
    pose: { ...defaultPose, rotationZ: 7 },
  }),
  createPreset("ping", "PING", "rounded-square", "#8784EF", {
    body: { type: "rounded-square", visor: true, antennas: true },
    colors: {
      body: "#8784EF",
      eyes: "#CEE7FF",
      mouth: "#CEE7FF",
      accent: "#C8C3FF",
      visor: "#25263F",
    },
    face: { ...defaultFace, spacing: 45, mouth: "tiny" },
  }),
];
export const pingCharacter = characters[7]!;
