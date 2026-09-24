import { build } from 'esbuild';
import { mkdir } from 'node:fs/promises';
await mkdir('apps/studio/public/runtime',{recursive:true});
await build({entryPoints:['packages/core/src/web.ts'],outfile:'apps/studio/public/runtime/character.mjs',bundle:true,format:'esm',minify:true});
await build({entryPoints:['packages/react/src/index.tsx'],outfile:'apps/studio/public/runtime/react.mjs',bundle:true,format:'esm',external:['react','react/jsx-runtime'],banner:{js:'"use client";'},minify:true});
