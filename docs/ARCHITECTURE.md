# Architecture

NX Alive separates authoring from runtime consumption.

```text
Studio
  ↓ writes
.character.json
  ↓
@nx-alive/core
  ↓
@nx-alive/react / future web runtime
  ↓
product UI
```

## Boundaries

### `@nx-alive/core`
Framework-agnostic source of truth: schema, scene graph, validation, expressions, animation tracks and semantic states.

### `@nx-alive/react`
Thin SVG renderer. Product code selects state/expression; it does not manipulate character geometry.

### `@nx-alive/presets`
Bundled stress-test characters. PING is first because it exercises hierarchy, custom paths, expressions, states and animation tracks.

### Studio
Visual authoring app. Gate 0 is intentionally read-only. Gate 1 adds direct manipulation, history and persistence.

## Constraints

1. Character files stay portable and serializable.
2. Runtime never depends on the Studio.
3. Semantic state is the product integration surface.
4. Expressions patch the base character instead of duplicating it.
5. Animation is data, not hard-coded component behavior.
6. SVG paths are first-class so NX Alive is not limited to geometric blobs.
