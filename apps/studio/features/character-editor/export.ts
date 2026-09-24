import {
  parseCharacterDocument,
  renderCharacterSvg,
  serializeCharacter,
  type CharacterDocument,
  type RenderOptions,
} from "@nx-alive/core";
import { strToU8, zipSync } from "fflate";
export function download(
  data: BlobPart,
  name: string,
  type = "application/json",
) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
export function exportDocument(d: CharacterDocument, ids: string[]) {
  return parseCharacterDocument({
    ...d,
    animations: Object.fromEntries(
      Object.entries(d.animations).filter(([id]) => ids.includes(id)),
    ),
  });
}
export async function photo(
  d: CharacterDocument,
  options: RenderOptions,
  format: "svg" | "png",
) {
  const source = renderCharacterSvg(d, {
    ...options,
    playing: false,
    ambient: false,
    id: "photo",
  });
  if (format === "svg") {
    download(source, `${d.id}.svg`, "image/svg+xml");
    return;
  }
  const url = URL.createObjectURL(
    new Blob([source], { type: "image/svg+xml" }),
  );
  try {
    const img = new Image();
    img.src = url;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = 1600;
    canvas.height = (1600 * d.canvas.height) / d.canvas.width;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw Error("PNG export is not supported in this browser.");
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) =>
        b ? resolve(b) : reject(Error("PNG export failed.")),
      ),
    );
    download(blob, `${d.id}.png`, "image/png");
  } finally {
    URL.revokeObjectURL(url);
  }
}
export function importSvg(text: string): CharacterDocument["body"] {
  if (text.length > 100000)
    throw Error("Use a simple SVG smaller than 100 KB.");
  const xml = new DOMParser().parseFromString(text, "image/svg+xml");
  const root = xml.documentElement;
  if (root.localName !== "svg" || xml.querySelector("parsererror"))
    throw Error("This file is not a valid SVG.");
  const paths = Array.from(xml.querySelectorAll("path"));
  const path = paths[0];
  if (
    !path ||
    paths.length !== 1 ||
    xml.querySelector(
      "script,foreignObject,image,use,rect,circle,ellipse,polygon,polyline,line",
    ) ||
    path.closest("[transform]")
  )
    throw Error(
      "Use one outlined path, with transforms flattened and a viewBox.",
    );
  const box = root
    .getAttribute("viewBox")
    ?.trim()
    .split(/[\s,]+/)
    .map(Number);
  if (
    !box ||
    box.length !== 4 ||
    !box.every(Number.isFinite) ||
    box[2]! <= 0 ||
    box[3]! <= 0
  )
    throw Error("Your SVG needs a valid viewBox.");
  return {
    type: "custom",
    path: path.getAttribute("d") ?? "",
    viewBox: box as [number, number, number, number],
    visor: false,
    antennas: false,
  };
}
export async function buildDemoZip(
  d: CharacterDocument,
  format: "react" | "esm",
) {
  const filename = format === "react" ? "react.mjs" : "character.mjs";
  const response = await fetch(`/runtime/${filename}`);
  if (!response.ok)
    throw Error("Runtime is unavailable. Restart the Studio and try again.");
  const runtime = await response.text();
  const json = serializeCharacter(d);
  const animation = Object.keys(d.animations)[0] ?? "";
  const files: Record<string, Uint8Array> = {
    "character.character.json": strToU8(json),
    [`runtime/${filename}`]: strToU8(runtime),
    "README.md": strToU8(
      "NX Alive exported character\n\nRun npm install, then npm run dev. Open http://localhost:3000.\nThe runtime is included locally; no unpublished package is required.\n",
    ),
  };
  if (format === "react") {
    files["package.json"] = strToU8(
      JSON.stringify(
        {
          name: "nx-alive-demo",
          private: true,
          scripts: {
            dev: "next dev",
            build: "next build",
            start: "next start",
          },
          dependencies: {
            next: "^16.3.1",
            react: "^19.2.0",
            "react-dom": "^19.2.0",
          },
          devDependencies: {
            typescript: "^5.9.2",
            "@types/react": "^19.1.12",
            "@types/node": "^22.18.1",
          },
        },
        null,
        2,
      ),
    );
    files["app/layout.tsx"] = strToU8(
      `export default function Layout({children}:{children:React.ReactNode}) {return <html lang="en"><body style={{margin:0,background:'#111419',color:'white'}}>{children}</body></html>}`,
    );
    files["app/page.tsx"] = strToU8(
      `'use client';\nimport {createCharacter} from '../runtime/react.mjs';\nimport character from '../character.character.json';\nconst Mascot=createCharacter(character);\nexport default function Page(){return <main style={{width:480,maxWidth:'100%',margin:'10vh auto'}}><Mascot animation=${JSON.stringify(animation)}/></main>}`,
    );
    files["runtime/react.d.mts"] = strToU8(
      `import type {ComponentType,HTMLAttributes} from 'react';\nexport declare function createCharacter(document:unknown):ComponentType<HTMLAttributes<HTMLDivElement>&{animation?:string;expression?:string;playing?:boolean}>;`,
    );
  } else {
    files["package.json"] = strToU8(
      JSON.stringify(
        {
          name: "nx-alive-esm-demo",
          private: true,
          scripts: { dev: "node server.mjs" },
        },
        null,
        2,
      ),
    );
    files["index.html"] = strToU8(
      `<html lang="en"><meta charset="utf-8"><title>${d.name.replace(/[<>&"]/g, "")} · NX Alive</title><body style="background:#111419"><div id="mascot" style="width:480px;max-width:100%;margin:10vh auto"></div><script type="module">import {mountCharacter} from './runtime/character.mjs';const character=await fetch('./character.character.json').then(r=>r.json());mountCharacter(document.querySelector('#mascot'),character,{animation:${JSON.stringify(animation)}});</script></body></html>`,
    );
    files["server.mjs"] = strToU8(
      `import {createServer} from 'node:http';import {readFile} from 'node:fs/promises';const files={'/':'index.html','/index.html':'index.html','/runtime/character.mjs':'runtime/character.mjs','/character.character.json':'character.character.json'};createServer(async(req,res)=>{const p=files[req.url];if(!p){res.writeHead(404);res.end();return;}try{res.setHeader('Content-Type',p.endsWith('.mjs')?'text/javascript':p.endsWith('.json')?'application/json':'text/html');res.end(await readFile(new URL(p,import.meta.url)));}catch{res.writeHead(500);res.end();}}).listen(3000);`,
    );
  }
  return zipSync(files);
}

export async function copyText(text: string) {
  if (navigator.clipboard && window.isSecureContext) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const input = document.createElement("textarea");
  input.value = text;
  input.style.position = "fixed";
  input.style.opacity = "0";
  document.body.append(input);
  input.select();
  try {
    if (!document.execCommand("copy"))
      throw Error(
        "Copy is unavailable in this browser. Download the JSON instead.",
      );
  } finally {
    input.remove();
  }
}

export async function downloadDemo(
  d: CharacterDocument,
  format: "react" | "esm",
) {
  const zip = await buildDemoZip(d, format);
  download(
    new Uint8Array(zip).buffer,
    `${d.id}-${format}-demo.zip`,
    "application/zip",
  );
}
