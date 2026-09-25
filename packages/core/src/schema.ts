import { z } from "zod";

const number = (min: number, max: number) =>
  z.number().finite().min(min).max(max);
const color = z.string().regex(/^#[\da-f]{6}$/i);
const key = z.string().regex(/^[a-z][a-z0-9-]{0,79}$/);
export const eyePresets = [
  "pill",
  "dot",
  "wide",
  "closed",
  "happy",
  "wink",
  "flat",
  "angry",
  "sad",
  "surprised",
] as const;
export const mouthPresets = [
  "none",
  "tiny",
  "smile",
  "open-smile",
  "sad",
  "flat",
  "o",
  "laugh",
] as const;
export const bodyTypes = [
  "circle",
  "blob",
  "cloud",
  "capsule",
  "rounded-square",
  "custom",
] as const;
export const poseSchema = z.object({
  x: number(-100, 100),
  y: number(-100, 100),
  scale: number(0.3, 1.6),
  width: number(0.5, 1.5),
  height: number(0.5, 1.5),
  rotationX: number(-180, 180),
  rotationY: number(-180, 180),
  rotationZ: number(-180, 180),
});
export const faceSchema = z.object({
  x: number(-50, 50),
  y: number(-50, 50),
  eyes: z.enum(eyePresets),
  mouth: z.enum(mouthPresets),
  spacing: number(12, 90),
  eyeY: number(-40, 40),
  eyeScale: number(0.4, 2),
  eyeRotation: number(-45, 45),
  mouthY: number(0, 70),
});
export const expressionSchema = z.object({
  name: z.string().trim().min(1).max(60),
  eyes: z.enum(eyePresets),
  mouth: z.enum(mouthPresets),
  x: number(-15, 15),
  y: number(-15, 15),
  eyeScale: number(0.5, 1.5),
  tilt: number(-20, 20),
  blush: z.boolean(),
});
export const frameSchema = z.object({
  at: number(0, 1),
  x: number(-30, 30),
  y: number(-40, 40),
  rotation: number(-30, 30),
  scaleX: number(0.7, 1.3),
  scaleY: number(0.7, 1.3),
});
export const animationSchema = z
  .object({
    name: z.string().trim().min(1).max(60),
    category: z.enum(["Life cycle", "Reactions", "Custom"]),
    expression: key,
    durationMs: number(300, 12000),
    loop: z.boolean(),
    frames: z.array(frameSchema).min(2).max(24),
  })
  .superRefine((a, ctx) => {
    if (
      a.frames[0]?.at !== 0 ||
      a.frames.at(-1)?.at !== 1 ||
      a.frames.some((f, i) => i > 0 && f.at <= a.frames[i - 1]!.at)
    )
      ctx.addIssue({
        code: "custom",
        message: "Frames must be strictly ordered from 0 to 1",
      });
  });
export const characterSchema = z
  .object({
    schemaVersion: z.literal("2.0"),
    id: key,
    name: z.string().trim().min(1).max(60),
    canvas: z.object({ width: number(64, 2048), height: number(64, 2048) }),
    body: z.object({
      type: z.enum(bodyTypes),
      path: z
        .string()
        .max(20000)
        .regex(/^[MmLlHhVvCcSsQqTtAaZz\d\s.,eE+\-]*$/)
        .optional(),
      viewBox: z
        .tuple([
          number(-10000, 10000),
          number(-10000, 10000),
          number(0.01, 20000),
          number(0.01, 20000),
        ])
        .optional(),
      visor: z.boolean(),
      antennas: z.boolean(),
    }),
    colors: z.object({
      body: color,
      eyes: color,
      mouth: color,
      accent: color,
      visor: color,
    }),
    face: faceSchema,
    pose: poseSchema,
    expressions: z.record(key, expressionSchema),
    animations: z.record(key, animationSchema),
    metadata: z.object({
      description: z.string().max(500),
      author: z.string().max(100),
    }),
  })
  .superRefine((d, ctx) => {
    if (!Object.keys(d.expressions).length)
      ctx.addIssue({
        code: "custom",
        message: "At least one expression is required",
      });
    if (d.body.type === "custom" && (!d.body.path?.trim() || !d.body.viewBox))
      ctx.addIssue({
        code: "custom",
        message: "Custom body needs a path and viewBox",
      });
    if (
      Object.keys(d.expressions).length > 100 ||
      Object.keys(d.animations).length > 100
    )
      ctx.addIssue({
        code: "custom",
        message: "Maximum 100 expressions and animations",
      });
    for (const a of Object.values(d.animations))
      if (!Object.hasOwn(d.expressions, a.expression))
        ctx.addIssue({
          code: "custom",
          message: `Missing expression: ${a.expression}`,
        });
  });
export type CharacterDocument = z.infer<typeof characterSchema>;
export type CharacterExpression = z.infer<typeof expressionSchema>;
export type CharacterAnimation = z.infer<typeof animationSchema>;
export type AnimationFrame = z.infer<typeof frameSchema>;
export type Pose = z.infer<typeof poseSchema>;
export const defaultPose: Pose = {
  x: 0,
  y: 0,
  scale: 1,
  width: 1,
  height: 1,
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
};
export const defaultFace: CharacterDocument["face"] = {
  x: 0,
  y: 0,
  eyes: "pill",
  mouth: "smile",
  spacing: 48,
  eyeY: 0,
  eyeScale: 1,
  eyeRotation: 0,
  mouthY: 29,
};
