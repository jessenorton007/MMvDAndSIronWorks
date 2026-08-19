import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import ts from "typescript";

const artifactDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
async function importDataModule(filename) {
  const source = await readFile(path.resolve(artifactDir, "../ironworks/src/data", filename), "utf8");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.ESNext, target: ts.ScriptTarget.ES2022 },
    fileName: filename,
  }).outputText;
  return import(`data:text/javascript;base64,${Buffer.from(output).toString("base64")}`);
}

export async function generateSeoData() {
  const [etsy, premade, serviceData] = await Promise.all([
    importDataModule("etsy-products.ts"),
    importDataModule("premade-items.ts"),
    importDataModule("services.ts"),
  ]);
  const output = {
    defaultEtsyProducts: etsy.defaultEtsyProducts,
    preMadeItems: premade.preMadeItems,
    services: serviceData.services,
  };
  await writeFile(
    path.resolve(artifactDir, "src/lib/seo-source-data.json"),
    `${JSON.stringify(output, null, 2)}\n`,
    "utf8",
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await generateSeoData();
}
