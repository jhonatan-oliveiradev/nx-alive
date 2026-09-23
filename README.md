# NX Alive

**Characters that live inside products.**

NX Alive is a character creation and runtime platform for expressive 2D mascots, assistants, creatures and product characters.

It is not a GIF maker and not a PING-specific mascot runtime. The product is built around a portable character document that can be authored visually and consumed by applications.

```text
NX Alive Studio (Next.js)
      ↓
.character.json
      ↓
@nx-alive/core
      ↓
@nx-alive/react
      ↓
Next.js / React / Electron / product UI
```

## Workspace

```text
apps/
  studio/             Next.js App Router visual authoring product

packages/
  core/               schema, validation, scene graph, state resolution
  react/              generic SVG renderer
  presets/            stress-test characters

docs/
  ARCHITECTURE.md
  CHARACTER_FORMAT.md
  ROADMAP.md
```

The runtime contains no PING-specific geometry. PING lives in `ping.character.json`.

## Studio stack

The product shell uses the same web stack intended for the rest of the NX ecosystem:

- Next.js App Router
- React
- TypeScript
- Tailwind CSS v4
- shadcn/ui-ready aliases and utilities
- npm workspaces

The character engine remains framework-independent.

## Character API

```tsx
import { Character } from "@nx-alive/react";
import { pingCharacter } from "@nx-alive/presets";

<Character document={pingCharacter} state="idle" />
<Character document={pingCharacter} state="password" />
<Character document={pingCharacter} state="error" />
```

## Local development

Requires Node 22+ and npm 10+.

```bash
npm install
npm run dev
```

Open `http://localhost:3000`. The root redirects to the PING character editor. The library is available at `/characters`.

Validation:

```bash
npm run check
```

No pnpm installation or pre-build of workspace packages is required for development.

## Product direction

The planned product surface grows through five gates:

1. portable schema + renderer;
2. visual part editor;
3. pose/face/expression authoring;
4. animation timeline + runtime export;
5. Behavior Graph, packs, plugins and Creative Studio integration.

See [the roadmap](./docs/ROADMAP.md).
