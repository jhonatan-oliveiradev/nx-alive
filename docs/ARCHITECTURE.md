# NX Alive architecture

The Studio owns editing state, a bounded 40-step undo history, local storage and downloads. It uses a versioned Studio envelope (`schemaVersion: 2`) around independent character documents (`schemaVersion: "2.0"`). Updates validate the modified character before entering history. Drag updates share a history entry. Failed local-storage reads do not silently overwrite the original.

Core uses Zod to validate nested input and cross-references. Rendering emits a body and face, with optional visor/antenna accents. Imported SVG contributes only a validated path and viewBox. Expression resolution is immutable. Animation resolution is independent from the Studio, with a pure sampler and CSS keyframe playback.

React wraps the renderer in a memoized component. It scopes CSS using `useId`, moves eyes through CSS custom properties, and never drives React state once per animation frame. The ESM DOM adapter uses the same renderer. Reduced-motion preferences disable autonomous animations and pointer motion.

The export build bundles local ESM/React adapters into the Studio public directory. Exported demos include those exact artifacts and JSON, so users do not depend on unpublished npm packages. The React demo uses Next.js. Export selection filters motions without removing expression dependencies.

The old v1 parts tree was replaced deliberately. Legacy JSON is rejected clearly. No database, authentication, cloud storage, skeletons or graph engine is involved.
