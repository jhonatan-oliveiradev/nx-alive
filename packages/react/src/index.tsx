import {
  buildPartTree,
  resolveCharacterState,
  resolveExpression,
  type Appearance,
  type CharacterDocument,
  type CharacterPart,
  type CharacterShape,
} from "@nx-alive/core";
import type { CSSProperties, SVGProps } from "react";

export type CharacterProps = Omit<SVGProps<SVGSVGElement>, "children"> & {
  document: CharacterDocument;
  state?: string;
  expression?: string;
  label?: string;
};

function shapeProps(appearance: Appearance) {
  return {
    fill: appearance.fill ?? "none",
    stroke: appearance.stroke,
    strokeWidth: appearance.strokeWidth,
    opacity: appearance.opacity,
  };
}

function Shape({
  shape,
  appearance,
}: {
  shape: CharacterShape;
  appearance: Appearance;
}) {
  const props = shapeProps(appearance);

  switch (shape.kind) {
    case "group":
      return null;
    case "circle":
      return <circle cx={0} cy={0} r={shape.radius} {...props} />;
    case "ellipse":
      return <ellipse cx={0} cy={0} rx={shape.rx} ry={shape.ry} {...props} />;
    case "rounded-rect":
      return (
        <rect
          x={-shape.width / 2}
          y={-shape.height / 2}
          width={shape.width}
          height={shape.height}
          rx={shape.rx}
          ry={shape.ry ?? shape.rx}
          {...props}
        />
      );
    case "capsule": {
      const radius = Math.min(shape.width, shape.height) / 2;
      return (
        <rect
          x={-shape.width / 2}
          y={-shape.height / 2}
          width={shape.width}
          height={shape.height}
          rx={radius}
          {...props}
        />
      );
    }
    case "path":
      return <path d={shape.d} fillRule={shape.fillRule} {...props} />;
  }
}

function PartNode({
  part,
  childrenByParent,
}: {
  part: CharacterPart;
  childrenByParent: Map<string | null, CharacterPart[]>;
}) {
  if (!part.visible) return null;

  const { x, y, scaleX, scaleY, rotation } = part.transform;
  const children = childrenByParent.get(part.id) ?? [];
  const style: CSSProperties = { transformOrigin: "center" };

  return (
    <g
      data-alive-part={part.id}
      transform={`translate(${x} ${y}) rotate(${rotation}) scale(${scaleX} ${scaleY})`}
      style={style}
    >
      <Shape shape={part.shape} appearance={part.appearance} />
      {children.map((child) => (
        <PartNode key={child.id} part={child} childrenByParent={childrenByParent} />
      ))}
    </g>
  );
}

export function Character({
  document,
  state,
  expression,
  label = document.name,
  ...svgProps
}: CharacterProps) {
  const stateResult = resolveCharacterState(document, state);
  const parts = expression
    ? resolveExpression(document, expression)
    : stateResult.parts;
  const tree = buildPartTree(parts);
  const roots = tree.get(null) ?? [];

  return (
    <svg
      viewBox={`0 0 ${document.canvas.width} ${document.canvas.height}`}
      role="img"
      aria-label={label}
      data-nx-alive-character={document.id}
      data-nx-alive-state={stateResult.stateId}
      {...svgProps}
    >
      {roots.map((part) => (
        <PartNode key={part.id} part={part} childrenByParent={tree} />
      ))}
    </svg>
  );
}

export type { CharacterDocument } from "@nx-alive/core";
