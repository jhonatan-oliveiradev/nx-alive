# NX Alive

**Small shapes. Big personality.** A local-first studio for simple, expressive 3D mascots. Pick a body, give it a face, choose a movement, and use the same character in your product.

## Run

Node.js 22+ and npm 10+:

```sh
npm install
npm run dev
```

Open http://localhost:3000. No account, cloud database or environment variables are required.

```sh
npm run typecheck
npm test
npm run build
```

Next.js 16 App Router, React 19, TypeScript, npm workspaces, Tailwind v4, shadcn-style Button (CVA/Slot), Radix Dialog and Lucide. The main viewport uses Three.js geometry and WebGL 2, with a vector 3D compatibility renderer when WebGL is unavailable. No bones or physics. Lightweight SVG remains available for flat illustrations and thumbnails.

## Studio

- Original animation workbench: graphite tools, lavender stage, left navigation, bottom character collection and a compact inspector.
- Eight original mascots, including a simplified PING; 20 expressions and 23 animations.
- Create, select, rename, duplicate and delete characters. Circle, blob, cloud, capsule, rounded square and custom SVG bodies.
- Body/face controls, numeric inputs and sliders, orientation and section resets.
- Real character thumbnails; custom expressions and motion timing, bounce and tilt.
- Play, pause and restart; drag to rotate in 360°, use arrow keys/Home, front/side/back views, zoom, surface guides and a synchronized orientation compass.
- Local storage, project backup/import, character JSON import, schema validation and undo/redo (Ctrl/⌘ Z, Shift to redo).
- Photo mode: capture the current 3D view as PNG with transparent, white, dark or custom background; a separately labeled flat SVG export. PNG dimensions follow the viewport and pixel ratio.
- Portable JSON and runnable React/Next.js or framework-free ESM demo ZIPs, with selected animations and their runtime included.

## Architecture

```
apps/studio       Next.js editor, persistence, history and download UI
packages/core     v2 schema, validation, expression/motion resolution, SVG renderer, ESM mount adapter
packages/react    SVG Character plus a /three entry with Character3D and portable Three.js player
packages/presets  eight characters and reusable expression/movement libraries
scripts           bundles standalone export runtimes before dev/build
```

Studio → `.character.json` → runtime → product. The runtime never imports the Studio. The renderers validate input and respect reduced-motion preferences. The 3D runtime generates mesh geometry and projects the face onto its surface. React does not re-render on animation frames. The WebGL renderer provides smooth lighting; the compatibility renderer has simpler shading and may show facets.

## Character format

`schemaVersion: "2.0"` contains `id`, `name`, `canvas`, `body`, `face`, `pose`, `colors`, `expressions`, `animations` and `metadata`. There is no parts hierarchy. Expressions combine eye/mouth presets and small facial offsets. Animations have a duration, loop flag, expression and a short sequence of body transforms.

```tsx
"use client";
import { Character, createCharacter } from "@nx-alive/react/three";
import { parseCharacterDocument } from "@nx-alive/core";
import cloudyJson from "./cloudy.character.json";

const cloudy = parseCharacterDocument(cloudyJson);
const Cloudy = createCharacter(cloudy);

export function App() {
  return (
    <div style={{ height: 480 }}>
      <Character document={cloudy} animation="happy" />
    </div>
  );
  // Or: <Cloudy animation="idle" guides />
}
```

The `@nx-alive/*` packages are currently workspace packages, **not published npm packages**. For use outside this repository, download a demo ZIP from Export. Its local `runtime/react.mjs` or `runtime/character.mjs` is self-contained; the React demo includes types and uses Next.js, while ESM uses a small Node static server.

```js
import { mountCharacter } from "./runtime/character.mjs";
const player = mountCharacter(element, character, { animation: "idle" });
player.update({ animation: "happy" });
player.destroy();
```

## Boundaries

- v2 intentionally replaces the experimental v1 parts schema. Old v1 characters are rejected with a validation error; no lossy automatic conversion is attempted.
- SVG import accepts a single outlined path with a viewBox. Flatten transforms before importing; other shapes, layers, masks and embedded resources are not imported.
- All three pose angles support -180° to 180°. Existing v2 documents remain readable; older runtimes with the previous ±60° X/Y validation limit cannot load newly saved larger angles.
- PNG captures the displayed 3D orientation and paused motion pose. Flat SVG remains a distinct 2D rendition. No animated GIF/video or GLB export is provided.
- Local storage is per browser/device. Use project backups before clearing browser data. Invalid saved data is preserved for recovery; storage failures are surfaced.
- Desktop editing; smaller screens display the mascot and a larger-screen notice.

## Roadmap

Improve custom motion authoring, add more original shapes, publish stable runtime packages, and add explicit v2 migration tools if needed. AI generation, behavior graphs, accounts, marketplace and collaboration are outside this release.

The product flow was informed by Bible Strong Avatar Lab. No reference implementation code or character paths were copied.
