"use client";
import {
  memo,
  useId,
  useMemo,
  useRef,
  useEffect,
  type HTMLAttributes,
} from "react";
import { renderCharacterSvg, type CharacterDocument } from "@nx-alive/core";
export type CharacterProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> & {
  document: CharacterDocument;
  expression?: string | undefined;
  animation?: string | undefined;
  playing?: boolean | undefined;
  ambient?: boolean | undefined;
  lookAt?: boolean | undefined;
  hoverReaction?: boolean | undefined;
  background?: string | undefined;
};
export const Character = memo(function Character({
  document,
  expression,
  animation,
  playing = true,
  ambient = true,
  lookAt = false,
  hoverReaction = false,
  background,
  ...props
}: CharacterProps) {
  const id = useId(),
    ref = useRef<HTMLDivElement>(null);
  const svg = useMemo(
    () =>
      renderCharacterSvg(document, {
        id,
        expression,
        animation,
        playing: true,
        ambient,
        background,
      }),
    [document, id, expression, animation, ambient, background],
  );
  useEffect(() => {
    ref.current
      ?.querySelectorAll<SVGElement>(".nx-motion, .nx-blink")
      .forEach((node) => {
        node.style.animationPlayState = playing ? "running" : "paused";
      });
  }, [playing, svg]);
  return (
    <div
      {...props}
      ref={ref}
      onPointerMove={(e) => {
        if (!lookAt) return;
        const r = e.currentTarget.getBoundingClientRect();
        e.currentTarget.style.setProperty(
          "--nx-look-x",
          `${((e.clientX - r.left - r.width / 2) / r.width) * 8}px`,
        );
        e.currentTarget.style.setProperty(
          "--nx-look-y",
          `${((e.clientY - r.top - r.height / 2) / r.height) * 6}px`,
        );
      }}
      onPointerEnter={() => {
        if (
          hoverReaction &&
          !matchMedia("(prefers-reduced-motion: reduce)").matches
        )
          ref.current?.animate(
            [
              { transform: "scale(1)" },
              { transform: "scale(1.035)" },
              { transform: "scale(1)" },
            ],
            { duration: 350 },
          );
      }}
      onPointerLeave={(e) => {
        e.currentTarget.style.setProperty("--nx-look-x", "0px");
        e.currentTarget.style.setProperty("--nx-look-y", "0px");
      }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
});
export function createCharacter(document: CharacterDocument) {
  return function CreatedCharacter(props: Omit<CharacterProps, "document">) {
    return <Character document={document} {...props} />;
  };
}
export type { CharacterDocument } from "@nx-alive/core";
