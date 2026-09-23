# Architecture

NX Alive separates the **product shell**, **authoring model** and **runtime**.

```text
Next.js Studio
  ↓ authors
.character.json
  ↓ validated by
@nx-alive/core
  ↓ rendered by
@nx-alive/react / future web runtime
  ↓
product UI
```

## Studio

`apps/studio` is a Next.js App Router application. Next owns product concerns such as routing, persistence endpoints, authentication, sharing and future marketplace/account surfaces.

The editor itself lives under `features/character-editor` rather than inside route components, so editor logic does not become coupled to App Router.

Tailwind CSS and shadcn/ui conventions are configured for product UI. The Gate 0 editor styles remain intentionally simple while authoring primitives are proven.

## Package boundaries

### `@nx-alive/core`

Framework-agnostic source of truth: schema, scene graph, validation, expressions, animation tracks and semantic states. It does not depend on Next.js, React or browser APIs.

### `@nx-alive/react`

Thin SVG renderer. Product code selects state/expression; it does not manipulate character geometry.

### `@nx-alive/presets`

Bundled stress-test characters. PING is first because it exercises hierarchy, custom paths, expressions, states and animation tracks.

Private workspace packages expose source during development and are transpiled by Next.js. Their build scripts still emit distributable artifacts for future package publication.

## Constraints

1. Character files stay portable and serializable.
2. Runtime packages never depend on the Studio.
3. Semantic state is the product integration surface.
4. Expressions patch the base character instead of duplicating it.
5. Animation is data, not hard-coded component behavior.
6. SVG paths are first-class so NX Alive is not limited to geometric blobs.
7. Next.js is the Studio/product framework, not a requirement for runtime consumers.
