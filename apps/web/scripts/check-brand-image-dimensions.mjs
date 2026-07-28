import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const sourceRoot = path.join(appRoot, "app");
const componentRoot = path.join(appRoot, "components");

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) return sourceFiles(absolutePath);
    return entry.name.endsWith(".tsx") ? [absolutePath] : [];
  });
}

function pngDimensions(filePath) {
  const buffer = readFileSync(filePath);
  const signature = buffer.subarray(0, 8).toString("hex");
  if (signature !== "89504e470d0a1a0a" || buffer.length < 24) {
    throw new Error(`${filePath} no es un PNG válido`);
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
  };
}

const declarations = [];
const errors = [];

for (const filePath of [
  ...sourceFiles(sourceRoot),
  ...sourceFiles(componentRoot),
]) {
  const source = readFileSync(filePath, "utf8");
  const relativePath = path.relative(appRoot, filePath);
  const declaredSources = new Set();

  for (const match of source.matchAll(/<Image\b[\s\S]*?\/>/g)) {
    const block = match[0];
    const src = block.match(/src=["'](\/brand\/[^"']+\.png)["']/)?.[1];
    if (!src) continue;
    declaredSources.add(src);
    const width = block.match(/width=\{(\d+)\}/)?.[1];
    const height = block.match(/height=\{(\d+)\}/)?.[1];
    if (!width || !height) {
      errors.push(
        `${relativePath}: ${src} debe declarar width y height numéricos`,
      );
      continue;
    }
    declarations.push({
      filePath: relativePath,
      src,
      width: Number(width),
      height: Number(height),
    });
  }

  for (const match of source.matchAll(
    /\{\s*key:\s*["'][^"']+["'],\s*src:\s*["'](\/brand\/[^"']+\.png)["'],\s*width:\s*(\d+),\s*height:\s*(\d+),/g,
  )) {
    const [, src, width, height] = match;
    declaredSources.add(src);
    declarations.push({
      filePath: relativePath,
      src,
      width: Number(width),
      height: Number(height),
    });
  }

  const referencedSources = new Set(
    [...source.matchAll(/["'](\/brand\/[^"']+\.png)["']/g)].map(
      (match) => match[1],
    ),
  );
  for (const src of referencedSources) {
    if (!declaredSources.has(src)) {
      errors.push(
        `${relativePath}: ${src} no está asociado a dimensiones verificables`,
      );
    }
  }
}

for (const declaration of declarations) {
  const assetPath = path.join(appRoot, "public", declaration.src);
  if (!statSync(assetPath).isFile()) {
    errors.push(`${declaration.filePath}: no existe ${declaration.src}`);
    continue;
  }
  const actual = pngDimensions(assetPath);
  if (
    declaration.width !== actual.width ||
    declaration.height !== actual.height
  ) {
    errors.push(
      `${declaration.filePath}: ${declaration.src} declara ${declaration.width}x${declaration.height}, pero el PNG mide ${actual.width}x${actual.height}`,
    );
  }
  if (/-(?:white|black)\.png$/.test(declaration.src)) {
    errors.push(
      `${declaration.filePath}: ${declaration.src} es monocromo y no debe usarse en la UI`,
    );
  }
}

if (errors.length > 0) {
  process.stderr.write(`${errors.join("\n")}\n`);
  process.exitCode = 1;
} else {
  process.stdout.write(
    `Brand assets verificados: ${declarations.length} declaraciones con dimensiones reales.\n`,
  );
}
