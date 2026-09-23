export type CharacterSchemaVersion = "1.0";

export type Transform2D = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
};

export type Appearance = {
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
};

export type CharacterShape =
  | { kind: "group" }
  | { kind: "circle"; radius: number }
  | { kind: "ellipse"; rx: number; ry: number }
  | { kind: "rounded-rect"; width: number; height: number; rx: number; ry?: number }
  | { kind: "capsule"; width: number; height: number }
  | { kind: "path"; d: string; fillRule?: "nonzero" | "evenodd" };

export type CharacterPart = {
  id: string;
  name: string;
  parentId?: string;
  zIndex: number;
  visible: boolean;
  transform: Transform2D;
  shape: CharacterShape;
  appearance: Appearance;
};

export type CharacterPartPatch = {
  partId: string;
  visible?: boolean;
  transform?: Partial<Transform2D>;
  appearance?: Appearance;
  shape?: CharacterShape;
};

export type CharacterExpression = {
  id: string;
  name: string;
  patches: CharacterPartPatch[];
};

export type AnimatableProperty =
  | "x" | "y" | "scaleX" | "scaleY" | "rotation" | "opacity";

export type CharacterKeyframe = {
  at: number;
  value: number;
  easing?: "linear" | "ease-in" | "ease-out" | "ease-in-out";
};

export type CharacterTrack = {
  partId: string;
  property: AnimatableProperty;
  keyframes: CharacterKeyframe[];
};

export type CharacterAnimation = {
  id: string;
  name: string;
  durationMs: number;
  loop: boolean;
  tracks: CharacterTrack[];
};

export type CharacterState = {
  expression?: string;
  animation?: string;
};

export type CharacterDocument = {
  schemaVersion: CharacterSchemaVersion;
  id: string;
  name: string;
  canvas: { width: number; height: number };
  parts: CharacterPart[];
  expressions: Record<string, CharacterExpression>;
  animations: Record<string, CharacterAnimation>;
  states: Record<string, CharacterState>;
  defaultState: string;
  metadata?: {
    author?: string;
    description?: string;
    tags?: string[];
  };
};

export const identityTransform = (): Transform2D => ({
  x: 0,
  y: 0,
  scaleX: 1,
  scaleY: 1,
  rotation: 0,
});
