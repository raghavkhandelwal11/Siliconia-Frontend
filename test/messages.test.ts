import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import messages from "@/messages/en.json";

// Every literal key passed to a translator must exist in messages/en.json,
// so no page renders a MISSING_MESSAGE error.
function files(dir: string): string[] {
  return readdirSync(dir).flatMap((f) => {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) return f === "node_modules" || f.startsWith(".") ? [] : files(p);
    return /\.tsx?$/.test(f) && !/\.test\.tsx?$/.test(f) && !f.endsWith(".d.ts") ? [p] : [];
  });
}

function has(path: string): boolean {
  let node: unknown = messages;
  for (const part of path.split(".")) {
    if (node == null || typeof node !== "object" || !(part in node)) return false;
    node = (node as Record<string, unknown>)[part];
  }
  return true;
}

describe("messages", () => {
  it("has every key the code uses", () => {
    const missing: string[] = [];
    for (const file of [...files("app"), ...files("components"), ...files("lib")]) {
      const src = readFileSync(file, "utf8");
      // Each call uses the nearest translator declared above it (one per component).
      const decls: { v: string; ns: string; at: number }[] = [];
      for (const m of src.matchAll(/const (\w+) = (?:await )?(?:use|get)Translations\("([\w.]+)"\)/g))
        decls.push({ v: m[1], ns: m[2], at: m.index });
      for (const m of src.matchAll(/const \[(\w+)[^\]]*\] = await Promise\.all\(\[\s*getTranslations\("([\w.]+)"\)/g))
        decls.push({ v: m[1], ns: m[2], at: m.index });
      for (const v of new Set(decls.map((d) => d.v))) {
        for (const m of src.matchAll(new RegExp(`\\b${v}(?:\\.rich|\\.raw|\\.markup)?\\("([\\w.]+)"`, "g"))) {
          const d = decls.filter((x) => x.v === v && x.at < m.index).at(-1);
          if (d && !has(`${d.ns}.${m[1]}`)) missing.push(`${file}: ${d.ns}.${m[1]}`);
        }
      }
    }
    expect(missing).toEqual([]);
  });
});
