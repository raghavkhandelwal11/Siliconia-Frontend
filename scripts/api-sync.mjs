// Copies the API contract from the backend repo (checked out next to this one)
// and regenerates the TypeScript types: `npm run api:sync`.
import { copyFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { resolve } from "node:path";

const source = resolve(process.env.BACKEND_DIR ?? "../siliconia_backend", "api/openapi.yaml");
if (!existsSync(source)) {
  console.error(`Backend spec not found at ${source}. Set BACKEND_DIR to the Siliconia_Backend checkout.`);
  process.exit(1);
}
copyFileSync(source, "lib/api/openapi.yaml");
execSync("npm run api:gen", { stdio: "inherit" });
console.log("API contract synced from", source);
