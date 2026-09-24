# Character v2

A character has one body definition, one face, a pose, colors, metadata and reusable expression/animation maps. See `packages/core/src/schema.ts` for the executable contract and `packages/presets/src/index.ts` for complete examples.

- Canvas: width/height in SVG units (presets use 400×400).
- Body: circle, blob, cloud, capsule, rounded-square or custom path/viewBox; optional visor and antennas.
- Face: eye and mouth presets, spacing, scale, rotation and offsets.
- Pose: x/y, overall scale, width/height and X/Y/Z orientation. X/Y are a 2D approximation.
- Colors: six-digit hex values; no external paint URLs.
- Expressions: eye/mouth selection, relative face offsets, scale, tilt and blush.
- Animations: strictly ordered normalized frames from 0 to 1, duration, loop and valid expression reference. Frames transform the whole body; no individual bones.

Use `parseCharacterDocument(unknown)` at input boundaries and `serializeCharacter(document)` for export. Invalid nested objects, non-finite transforms, unsupported versions and missing expression references are rejected. Imports discard unknown fields. Custom SVG never becomes raw injected markup.
