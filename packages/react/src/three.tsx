"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type HTMLAttributes,
} from "react";
import { mountCharacter, type ThreeOptions } from "./three-runtime";
import { parseCharacterDocument, type CharacterDocument } from "@nx-alive/core";
export type Character3DHandle = {
  capture: (background?: string) => Promise<Blob>;
};
export type Character3DProps = Omit<
  HTMLAttributes<HTMLDivElement>,
  "children"
> &
  ThreeOptions & { document: CharacterDocument; restartKey?: number };
export const Character3D = forwardRef<Character3DHandle, Character3DProps>(
  function Character3D(
    {
      document: doc,
      restartKey = 0,
      expression,
      animation,
      playing,
      guides,
      interactive,
      zoom,
      ambient,
      background,
      onPoseChange,
      onComplete,
      onError,
      ...props
    },
    ref,
  ) {
    const container = useRef<HTMLDivElement>(null),
      player = useRef<ReturnType<typeof mountCharacter> | null>(null);
    const [error, setError] = useState("");
    const options = {
      expression,
      animation,
      playing,
      guides,
      interactive,
      zoom,
      ambient,
      background,
      onPoseChange,
      onComplete,
      onError: (message: string) => {
        setError(message);
        onError?.(message);
      },
    };
    useImperativeHandle(
      ref,
      () => ({
        capture: async (background) => {
          if (!player.current) throw Error("The 3D preview is not available.");
          return player.current.capture(background);
        },
      }),
      [],
    );
    useEffect(() => {
      try {
        player.current = mountCharacter(container.current!, doc, options);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "The preview could not be created. Reload to try again.",
        );
      }
      return () => {
        player.current?.destroy();
        player.current = null;
      };
    }, []);
    useEffect(() => {
      try {
        player.current?.update(options, doc);
        if (player.current && error) setError("");
      } catch (e) {
        setError(
          e instanceof Error ? e.message : "This shape could not be displayed.",
        );
      }
    });
    useEffect(() => {
      player.current?.restart();
    }, [restartKey, doc.id]);
    return (
      <div
        {...props}
        ref={container}
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          minHeight: 200,
          ...props.style,
        }}
      >
        {error && (
          <div role="alert" className="three-error">
            <strong>3D preview unavailable</strong>
            <p>{error}</p>
          </div>
        )}
      </div>
    );
  },
);
export const Character = Character3D;
export function createCharacter(input: unknown) {
  const document = parseCharacterDocument(input);
  return function CreatedCharacter(props: Omit<Character3DProps, "document">) {
    return <Character3D document={document} {...props} />;
  };
}
