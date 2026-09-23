# `.character.json` draft format

A character document contains a canvas, scene-graph parts, expressions, animation tracks and semantic states.

## Parts

Gate 0 supports:

- `group`
- `circle`
- `ellipse`
- `rounded-rect`
- `capsule`
- `path`

A part can reference `parentId`, making transforms local to that parent.

## Expressions

Expressions are sparse patches over the base character:

```json
{
  "id": "sleeping",
  "name": "Sleeping",
  "patches": [
    {
      "partId": "left-eye",
      "shape": { "kind": "path", "d": "M -14 0 Q 0 6 14 0" }
    }
  ]
}
```

## Semantic states

Products integrate at the state level:

```tsx
<Character document={ping} state="password" />
```

A state maps to an expression and optionally an animation. This keeps product logic independent from SVG geometry.
