---
version: alpha
name: NX Alive — Animation workbench
description: Original 3D character workbench
colors:
  primary: "#b6a5fb"
  on-primary: "#252039"
  background: "#24232e"
  surface: "#2c2b38"
  border: "#383747"
  text: "#ecebf5"
  muted: "#aaa9bc"
  stage: "#e9e6f0"
  stage-ink: "#373145"
  danger: "#de6d8b"
typography:
  display:
    fontFamily: "Space Grotesk, DM Sans, sans-serif"
  body:
    fontFamily: "DM Sans, Arial, sans-serif"
  utility:
    fontFamily: "monospace"
rounded:
  control: "8px"
  panel: "12px"
  stage: "20px"
spacing:
  header: "68px"
  rail: "84px"
  inspector: "356px"
components:
  button:
    rounded: "8px"
  dialog:
    rounded: "18px"
---

# NX Alive design system

## Overview

An animation workbench for designers and developers creating expressive mascots for products. Product register, desktop-first, English UI with a Portuguese mobile notice retained from the first release. No Japanese market requirements. The current request explicitly replaces the reference-like split editor with an original system.

The signature is a lavender cyclorama with a solid, touchable character over a subtle orbital ground mark. Graphite tools surround the stage: left tool rail, right inspector, cast collection along the bottom. No reference branding, reference paths or reference implementation code.

Runtime CSS is canonical (Model B). This document mirrors the accepted palette and explains its use. `apps/studio/app/globals.css :root` owns all semantic UI tokens; shared Button and controls consume them directly, without a second Tailwind palette.

## Colors

Primary → `--accent`; on-primary → `--accent-ink`; background → `--paper`; surface → `--surface`; text → `--ink`; muted → `--muted`; border → `--border`; stage → `--stage`; stage-ink → `--stage-ink`; danger → `--danger`. Stage utilities deliberately use a light semantic surface. There is one authored theme, not an unimplemented theme switch. Selection uses a border and pressed semantics in addition to color. Forced colors use native system colors.

## Typography

Self-hosted Space Grotesk for names/headings, DM Sans for editing, monospace for orientation/status metadata. Character name is the only oversized text. Inspector copy remains short and task-oriented. Font CSS is bundled locally; no runtime font service dependency.

## Layout

68px shared header, 84px tool rail, flexible stage, 356px inspector; inspector expands to 390px above 1700px. Collection scrolls horizontally; inspector owns vertical scrolling. Stage never inherits inspector scrolling. At 800px and below, rotation and collection remain usable while the editor is replaced by a larger-screen notice. Photo mode keeps orientation, excludes guides from the image, and uses a bottom export panel.

## Elevation & Depth

Real mesh lighting communicates volume. The UI uses tonal layers and borders. Shadows are limited to the floating viewport toolbar and modal; avoid glows, nested decorative cards and glass panels.

## Shapes

8px controls, 12px tiles, 20px stage entrance. Lucide strokes, compact labeled actions, no emoji navigation. The dark frame and light stage are deliberate and distinct from the reference's dark stage and light right editor.

## Components

Shared Button, Range, Color and Radix Modal remain canonical. Buttons have hover, visible focus, pressed and disabled states. Native selects intentionally retain OS-owned popup behavior. Dialogs trap focus and restore it. Notices use the existing live status region.

Drag updates the actual 3D orientation; pointer release commits one undo entry. Arrow keys and front/side/back buttons provide non-drag alternatives. Surface guides and the orientation compass follow the same model transform. Reduced motion stops autonomous motion, while explicit user rotation remains available. Object animation never drives React updates per frame.

## Do's and Don'ts

- Do keep the cast, active character and editing mode visible.
- Do use genuine volume and correct rear occlusion.
- Don't describe an SVG projection or CSS rotation as 3D.
- Don't add decorative dashboards, fake metrics or reference-like branding.
