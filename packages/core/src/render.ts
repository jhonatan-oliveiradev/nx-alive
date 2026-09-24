import type { CharacterDocument } from "./schema";
import { parseCharacterDocument } from "./validate";
import { resolveAnimation, resolveExpression } from "./resolve";
export const bodyPaths = {
  circle: "M 100 0 A 100 100 0 1 1 -100 0 A 100 100 0 1 1 100 0 Z",
  blob: "M -97 27 C -112 -28 -73 -96 -15 -103 C 31 -115 77 -68 93 -21 C 111 32 90 83 39 98 C -21 118 -84 89 -97 27 Z",
  cloud:
    "M -96 73 C -145 51 -137 -11 -94 -26 C -99 -65 -56 -92 -25 -73 C -5 -120 67 -117 84 -67 C 126 -64 142 -16 113 13 C 142 57 98 101 56 83 C 18 118 -22 93 -39 85 C -65 98 -84 89 -96 73 Z",
  capsule: "M -72 -38 A 72 72 0 0 1 72 -38 L 72 38 A 72 72 0 0 1 -72 38 Z",
  "rounded-square":
    "M -50 -94 H 50 Q 98 -94 98 -46 V 46 Q 98 94 50 94 H -50 Q -98 94 -98 46 V -46 Q -98 -94 -50 -94 Z",
};
const esc = (s: string) =>
  s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&apos;",
      })[c]!,
  );
function eye(p: string, side: number) {
  const line = (d: string) =>
    `<path d="${d}" fill="none" stroke="currentColor" stroke-width="8" stroke-linecap="round"/>`;
  if (p === "dot") return '<circle r="7"/>';
  if (p === "wide" || p === "surprised")
    return `<ellipse rx="${p === "wide" ? 12 : 11}" ry="17"/>`;
  if (p === "closed" || p === "flat" || (p === "wink" && side === 1))
    return line("M -8 2 Q 0 5 8 2");
  if (p === "happy") return line("M -9 4 Q 0 -11 9 4");
  if (p === "angry")
    return `<g transform="rotate(${side * -22})"><rect x="-7" y="-12" width="14" height="24" rx="6"/></g>`;
  if (p === "sad")
    return `<g transform="rotate(${side * 24})"><rect x="-6" y="-10" width="12" height="22" rx="6"/></g>`;
  return '<rect x="-7" y="-15" width="14" height="30" rx="7"/>';
}
function mouth(p: string) {
  const line = (d: string) =>
    `<path d="${d}" fill="none" stroke="currentColor" stroke-width="5" stroke-linecap="round"/>`;
  if (p === "none") return "";
  if (p === "tiny") return line("M -3 0 L 3 0");
  if (p === "smile") return line("M -12 -3 Q 0 12 12 -3");
  if (p === "sad") return line("M -11 5 Q 0 -7 11 5");
  if (p === "flat") return line("M -10 0 L 10 0");
  if (p === "o") return '<ellipse rx="7" ry="10"/>';
  return `<path d="M -17 -4 Q 0 0 17 -4 Q 16 ${p === "laugh" ? 30 : 23} 0 ${p === "laugh" ? 25 : 18} Q -16 23 -17 -4 Z"/><path d="M -8 13 Q 0 6 8 13 Q 0 22 -8 13" fill="#F594B3"/>`;
}
export type RenderOptions = {
  expression?: string | undefined;
  animation?: string | undefined;
  playing?: boolean | undefined;
  id?: string | undefined;
  background?: string | undefined;
  ambient?: boolean | undefined;
};
/** Generates only validated SVG primitives; never inserts imported SVG markup. */
export function renderCharacterSvg(
  input: CharacterDocument,
  options: RenderOptions = {},
): string {
  const d = parseCharacterDocument(input),
    p = d.pose,
    c = d.colors;
  const animation = resolveAnimation(d, options.animation);
  const f = resolveExpression(d, options.expression ?? animation?.expression);
  const id = (options.id ?? "nx-character").replace(/[^\w-]/g, "");
  const motion =
    animation?.frames
      .map(
        (k) =>
          `${k.at * 100}%{transform:translate(${k.x}px,${k.y}px) rotate(${k.rotation}deg) scale(${k.scaleX},${k.scaleY})}`,
      )
      .join("") ??
    "0%,100%{transform:scale(1)}50%{transform:scale(1.012,.988)}";
  const background =
    options.background && /^#[\da-f]{6}$/i.test(options.background)
      ? `<rect width="100%" height="100%" fill="${options.background}"/>`
      : "";
  let body = "";
  if (d.body.type === "custom") {
    const [x, y, w, h] = d.body.viewBox!;
    const s = 210 / Math.max(w, h);
    body = `<path d="${esc(d.body.path!)}" transform="scale(${s}) translate(${-x - w / 2} ${-y - h / 2})"/>`;
  } else body = `<path d="${bodyPaths[d.body.type]}"/>`;
  const ambient = options.ambient !== false;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${d.canvas.width} ${d.canvas.height}" role="img" aria-label="${esc(d.name)}" data-character="${d.id}"><style>
@keyframes ${id}-motion{${motion}}@keyframes ${id}-blink{0%,43%,47%,100%{transform:scaleY(1)}45%{transform:scaleY(.08)}}
#${id} .nx-motion{animation:${id}-motion ${animation?.durationMs ?? 3600}ms ease-in-out ${animation?.loop === false ? "1" : "infinite"} both;animation-play-state:${options.playing === false ? "paused" : "running"};${!animation && !ambient ? "animation:none;" : ""}}
#${id} .nx-blink{animation:${id}-blink 5300ms linear infinite;animation-play-state:${options.playing === false ? "paused" : "running"};${!ambient ? "animation:none;" : ""}}
#${id} .nx-look{transform:translate(var(--nx-look-x,0px),var(--nx-look-y,0px));transition:transform 100ms ease-out}
@media(prefers-reduced-motion:reduce){#${id} .nx-motion,#${id} .nx-blink{animation:none!important}#${id} .nx-look{transform:none;transition:none}}
</style>${background}<g id="${id}" transform="translate(${d.canvas.width / 2 + p.x} ${d.canvas.height / 2 + p.y})"><g transform="rotate(${p.rotationZ}) scale(${p.scale * p.width * Math.cos((p.rotationY * Math.PI) / 180)} ${p.scale * p.height * Math.cos((p.rotationX * Math.PI) / 180)})"><g class="nx-motion"><g fill="${c.body}">${d.body.antennas ? `<path d="M -43 -73 L -51 -107 M 43 -73 L 51 -107" stroke="${c.body}" stroke-width="11" stroke-linecap="round"/><circle cx="-52" cy="-110" r="9" fill="${c.accent}"/><circle cx="52" cy="-110" r="9" fill="${c.accent}"/>` : ""}${body}</g>${d.body.visor ? `<rect x="-75" y="-45" width="150" height="94" rx="37" fill="${c.visor}"/>` : ""}<g transform="translate(${f.x + p.rotationY * 0.35} ${f.y + p.rotationX * 0.3 - 7}) rotate(${f.tilt})">${f.blush ? `<ellipse cx="-47" cy="24" rx="14" ry="7" fill="${c.accent}" opacity=".65"/><ellipse cx="47" cy="24" rx="14" ry="7" fill="${c.accent}" opacity=".65"/>` : ""}<g class="nx-look"><g transform="translate(0 ${f.eyeY})" fill="${c.eyes}" color="${c.eyes}"><g class="nx-blink">${[-1, 1].map((side) => `<g transform="translate(${(side * f.spacing) / 2} 0) rotate(${f.eyeRotation}) scale(${f.eyeScale})">${eye(f.eyes, side)}</g>`).join("")}</g></g></g><g transform="translate(0 ${f.mouthY})" fill="${c.mouth}" color="${c.mouth}">${mouth(f.mouth)}</g></g></g></g></g></svg>`;
}
