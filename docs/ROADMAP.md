# Roadmap

## Gate 0 — Foundation

- [x] monorepo boundaries
- [x] `.character.json` draft schema
- [x] validation and scene graph
- [x] expression patches
- [x] semantic states
- [x] animation track schema
- [x] React/SVG renderer
- [x] PING stress-test character
- [x] Studio foundation shell
- [ ] CI green
- [ ] visual QA

**Exit:** PING renders entirely from data; no PING-specific geometry exists in the runtime.

## Gate 1 — Visual part editor

Selection, transform handles, drag/resize/rotate, layers, editable inspector, primitives, custom SVG import, undo/redo, persistence and JSON export.

## Gate 2 — Face, pose and expressions

Face editor, eye/mouth presets, pose snapshots, expression authoring, interpolation preview and look-at/cursor tracking.

## Gate 3 — Timeline and animation

Keyframe timeline, easing, loops, animation layers and reusable motion presets.

## Gate 4 — Runtime and export

Animation player, stable React API, Web Component, SVG/PNG export, package-size budget and Next/Vite/Electron examples.

## Gate 5 — Behavior Graph and ecosystem

Event → behavior graph, reusable packs, Creative Studio integration, plugin API and optional AI-assisted authoring.
