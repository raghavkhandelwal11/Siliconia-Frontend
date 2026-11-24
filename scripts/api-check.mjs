// Fails if lib/api/schema.d.ts is out of date with lib/api/openapi.yaml (CI drift check).
import { execSync } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const out = join(mkdtempSync(join(tmpdir(), "api-check-")), "schema.d.ts");
execSync(`npx openapi-typescript lib/api/openapi.yaml -o ${out}`, { stdio: "ignore" });
const fresh = readFileSync(out, "utf8");
const committed = readFileSync("lib/api/schema.d.ts", "utf8");
if (fresh !== committed) {
  console.error("lib/api/schema.d.ts is out of date. Run `npm run api:gen` (or `npm run api:sync`) and commit.");
  process.exit(1);
}
console.log("API types are up to date.");
