import { afterEach, describe, expect, it, vi } from "vitest";
import { unzipSync, strFromU8 } from "fflate";
import { characters } from "@nx-alive/presets";
import { buildDemoZip } from "./export";
afterEach(() => vi.unstubAllGlobals());
describe("integration packages", () => {
  it.each(["react", "esm"] as const)(
    "packages a standalone %s demo with the exact character and runtime",
    async (format) => {
      const runtime = "export const verifiedRuntime = true;";
      vi.stubGlobal("fetch", async () => new Response(runtime));
      const files = unzipSync(await buildDemoZip(characters[0]!, format));
      expect(JSON.parse(strFromU8(files["character.character.json"]!))).toEqual(
        characters[0],
      );
      const filename = format === "react" ? "react.mjs" : "character.mjs";
      expect(strFromU8(files[`runtime/${filename}`]!)).toBe(runtime);
      const pkg = JSON.parse(strFromU8(files["package.json"]!));
      expect(pkg.scripts.dev).toBe(
        format === "react" ? "next dev" : "node server.mjs",
      );
      expect(
        files[format === "react" ? "app/page.tsx" : "index.html"],
      ).toBeTruthy();
    },
  );
  it("reports a missing runtime rather than downloading a broken demo", async () => {
    vi.stubGlobal("fetch", async () => new Response("", { status: 404 }));
    await expect(buildDemoZip(characters[0]!, "react")).rejects.toThrow(
      "Runtime is unavailable",
    );
  });
});
