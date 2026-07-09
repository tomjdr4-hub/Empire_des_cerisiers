// Compile packs/_source/<pack>/*.json en compendiums LevelDB packs/<pack>/.
import { compilePack } from "@foundryvtt/foundryvtt-cli";
import { readdirSync } from "node:fs";

const SOURCE_ROOT = "packs/_source";
const DEST_ROOT = "packs";

const packs = readdirSync(SOURCE_ROOT, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name);

for (const pack of packs) {
  console.log(`Compilation du pack "${pack}"...`);
  await compilePack(`${SOURCE_ROOT}/${pack}`, `${DEST_ROOT}/${pack}`, { log: true });
}

console.log("Compendiums compilés.");
