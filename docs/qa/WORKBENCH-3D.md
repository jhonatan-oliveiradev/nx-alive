# Volumetric workbench verification

Date: 2026-09-25

## Scope

Original NX Alive workbench: graphite controls, lavender stage, persistent character collection, inspector, and self-hosted typography. The reference informs interaction requirements only. Character geometry is original, including inferred side and rear surfaces; this is not a measured reconstruction of the reference.

The model uses +Y up and +Z facing forward. Existing vector facial artwork becomes mesh geometry on the front surface. Dragging rotates the complete model, surface guides, and orientation axes together. Pointer release commits one undoable pose. Arrow keys and Home provide keyboard equivalents. Front, side, and back presets expose volume directly.

## Automated evidence

- `npm run check`: passed (TypeScript, 40 tests, production build).
- Geometry tests cover all eight presets, finite bounds, front-facing facial geometry, custom extrusion, and rotation beyond 60 degrees.
- Generated React demo ZIP extracted and built successfully with its standalone bundled runtime.
- Premium UI audit: zero errors and warnings; report in `premium-audit.json`.

## Browser evidence

- Inspected desktop at 1366×768 and 1920×1080, and mobile at 390×844.
- Verified pointer rotation, keyboard rotation, undo, front/side/back views, surface guides, pause, and saved pose after reload.
- Photo mode produced an actual transparent PNG containing the volumetric character without viewport controls or surface guides.
- Final desktop captures: `workbench-3d.jpg` and `workbench-guides.jpg`. `workbench-1366.jpg` records the earlier responsive pass.

## Limits

The cloud browser reports WebGL unavailable. Browser evidence therefore covers the same mesh geometry projected by Three.js SVGRenderer with simplified shading. The UI discloses this as “Basic shading.” GPU lighting, depth-buffer appearance, and GPU performance still require visual review on a WebGL-capable device. No 60 fps claim is made. The fallback uses painter ordering and can show rear surface guide lines through the body.

The existing flat SVG export/runtime remain available. New X/Y poses can span ±180 degrees; older runtimes limited to ±60 degrees cannot load those expanded poses.
