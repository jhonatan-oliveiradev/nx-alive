import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
// Accept common preview-server flags while keeping Next.js as the only server.
const args = process.argv
  .slice(2)
  .filter((arg) => arg !== "--strictPort")
  .map((arg) => (arg === "--host" ? "--hostname" : arg));
if (!args.includes("--hostname") && !args.includes("-H"))
  args.push("--hostname", "0.0.0.0");
const child = spawn(
  process.execPath,
  [
    fileURLToPath(
      new URL("../node_modules/next/dist/bin/next", import.meta.url),
    ),
    "dev",
    fileURLToPath(new URL("../apps/studio", import.meta.url)),
    ...args,
  ],
  { stdio: "inherit" },
);
child.on("exit", (code) => process.exit(code ?? 1));
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () => child.kill(signal));
