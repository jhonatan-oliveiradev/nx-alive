# NX Alive

**Small shapes. Big personality.** A local-first studio for simple, expressive 2D mascots. Pick a body, give it a face, choose a movement, and use the same character in your product.

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

Next.js 16 App Router, React 19, TypeScript, npm workspaces, Tailwind v4, shadcn-style Button (CVA/Slot), Radix Dialog and Lucide. Rendering uses SVG and CSS; no WebGL, bones or physics.

## Studio

- Dark live preview and a light editor with Avatar, Pose, Expressions, Animations and Export tabs.
- Eight original mascots, including a simplified PING; 20 expressions and 23 animations.
- Create, select, rename, duplicate and delete characters. Circle, blob, cloud, capsule, rounded square and custom SVG bodies.
- Body/face controls, numeric inputs and sliders, orientation and section resets.
- Real character thumbnails; custom expressions and motion timing, bounce and tilt.
- Play, pause, restart, auto blink, gentle breathing, optional cursor tracking and hover reaction.
- Local storage, project backup/import, character JSON import, schema validation and undo/redo (Ctrl/⌘ Z, Shift to redo).
- Photo mode: transparent, white, dark or custom background; SVG and 1600px-wide PNG.
- Portable JSON and runnable React/Next.js or framework-free ESM demo ZIPs, with selected animations and their runtime included.

## Architecture

```
apps/studio       Next.js editor, persistence, history and download UI
packages/core     v2 schema, validation, expression/motion resolution, SVG renderer, ESM mount adapter
packages/react    memoized Character component and createCharacter factory
packages/presets  eight characters and reusable expression/movement libraries
scripts           bundles standalone export runtimes before dev/build
```

Studio → `.character.json` → runtime → product. The runtime never imports the Studio. The renderer validates input, emits only known SVG primitives, scopes animation CSS by instance and respects reduced-motion preferences. React does not re-render on animation frames.

## Character format

`schemaVersion: "2.0"` contains `id`, `name`, `canvas`, `body`, `face`, `pose`, `colors`, `expressions`, `animations` and `metadata`. There is no parts hierarchy. Expressions combine eye/mouth presets and small facial offsets. Animations have a duration, loop flag, expression and a short sequence of body transforms.

```tsx
'use client';
import { Character, createCharacter } from '@nx-alive/react';
import { parseCharacterDocument } from '@nx-alive/core';
import cloudyJson from './cloudy.character.json';

const cloudy = parseCharacterDocument(cloudyJson);
const Cloudy = createCharacter(cloudy);

export function App() {
  return <Character document={cloudy} animation="happy" />;
  // Or: <Cloudy animation="idle" lookAt />
}
```

The `@nx-alive/*` packages are currently workspace packages, **not published npm packages**. For use outside this repository, download a demo ZIP from Export. Its local `runtime/react.mjs` or `runtime/character.mjs` is self-contained; the React demo includes types and uses Next.js, while ESM uses a small Node static server.

```js
import { mountCharacter } from './runtime/character.mjs';
const player = mountCharacter(element, character, { animation: 'idle' });
player.update({ animation: 'happy' });
player.destroy();
```

## Boundaries

- v2 intentionally replaces the experimental v1 parts schema. Old v1 characters are rejected with a validation error; no lossy automatic conversion is attempted.
- SVG import accepts a single outlined path with a viewBox. Flatten transforms before importing; other shapes, layers, masks and embedded resources are not imported.
- X/Y orientation simulates turning with scaling/face offsets; this remains a 2D editor.
- Photo mode exports a static pose with the selected expression, not a frozen arbitrary animation frame or animated GIF/video.
- Local storage is per browser/device. Use project backups before clearing browser data. Invalid saved data is preserved for recovery; storage failures are surfaced.
- Desktop editing; smaller screens display the mascot and a larger-screen notice.

## Roadmap

Improve custom motion authoring, add more original shapes, publish stable runtime packages, and add explicit v2 migration tools if needed. AI generation, behavior graphs, accounts, marketplace and collaboration are outside this release.

The product flow was informed by Bible Strong Avatar Lab. No reference implementation code or character paths were copied.
