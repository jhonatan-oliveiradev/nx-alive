# NX Alive interaction contract

Visual policy: [DESIGN.md](DESIGN.md). Local-first single-workspace product; no external write, billing, identity or permission flows.

| Capability          | Canonical owner                        | Source of truth           | Allowed variants                                 | Verification                     |
| ------------------- | -------------------------------------- | ------------------------- | ------------------------------------------------ | -------------------------------- |
| Select/Listbox      | Studio Select using native select      | This contract             | native OS popup                                  | UI interaction tests and browser |
| Form                | controls.tsx Range/Color, Studio forms | Character schema          | creation / editing                               | Studio tests                     |
| Scrollbar           | globals.css global baseline            | DESIGN.md                 | inspector / horizontal collection                | narrow and desktop inspection    |
| Toast               | Studio notice + save status            | This contract             | recoverable errors / success                     | persistence recovery test        |
| CRUD                | store.ts + Radix Modal                 | Character schema, history | create / duplicate / rename / delete             | Studio and store tests           |
| Direct manipulation | three-runtime.ts                       | Character pose            | pointer / arrows / view buttons / numeric fields | rotation tests + browser         |

Creating selects the new character and preserves the collection. Deletion requires the existing confirmation dialog and remains undoable. Changes save locally after 300ms. Storage failures show a notice and preserve recovery data. Native selects intentionally delegate popup geometry and keyboard behavior to the OS. Forms own validation; no browser confirmation dialogs or native validation bubbles.

A pointer drag commits once at release. Cancel/lost capture ends the gesture. The orientation fields, exported JSON and renderer all read the same pose. Rotation is accessible with arrow keys, Home and front/side/back buttons; keyboard events inside numeric/text controls retain native behavior. Zoom and guide visibility affect the viewport only, not the saved character. PNG captures the live 3D view; the flat SVG action is explicitly labeled.

The render loop stops advancing under reduced motion, hidden document or offscreen player. Pause retains elapsed animation time. Completion of one-shot animation pauses the Studio. Runtime errors render a recoverable message rather than silently substituting flat artwork for 3D. Modals retain Radix focus trapping/restoration and Escape handling. The mobile layout allows character selection and rotation; editing remains desktop-first.
