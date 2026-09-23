# NX Alive

**Characters that live inside products.**

NX Alive is a character creation and runtime platform for expressive 2D mascots, assistants, creatures and product characters.

It is not a GIF maker and not a PING-specific mascot runtime. The product is built around a portable character document that can be authored visually and consumed by applications.

```text
NX Alive Studio
      ↓
.character.json
      ↓
@nx-alive/core
      ↓
@nx-alive/react
      ↓
Next.js / Vite / Electron / product UI
```

## Gate 0

The first gate proves the architecture with the PING mascot as a stress test.

Current workspace:

```text
apps/
  studio/             visual authoring shell

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

## Character API

```tsx
import { Character } from "@nx-alive/react";
import { pingCharacter } from "@nx-alive/presets";

<Character document={pingCharacter} state="happy" />
<Character document={pingCharacter} state="password" />
<Character document={pingCharacter} state="error" />
```

## Local development

Requires Node 22+ and pnpm 10.

```bash
pnpm install
pnpm dev
```

Validation:

```bash
pnpm check
```

## Product direction

The planned product surface grows through five gates:

1. portable schema + renderer;
2. visual part editor;
3. pose/face/expression authoring;
4. animation timeline + runtime export;
5. Behavior Graph, packs, plugins and Creative Studio integration.

See [the roadmap](./docs/ROADMAP.md).
