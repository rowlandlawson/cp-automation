import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repoRoot = process.cwd();
const sourceRoots = ["assets/js", "admin/js"];

function collectJsFiles(relativeDir) {
  const absoluteDir = path.join(repoRoot, relativeDir);
  const entries = readdirSync(absoluteDir, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryRelativePath = path.join(relativeDir, entry.name);
    const entryAbsolutePath = path.join(repoRoot, entryRelativePath);

    if (entry.isDirectory()) {
      files.push(...collectJsFiles(entryRelativePath));
      continue;
    }

    if (!entry.isFile() || path.extname(entry.name) !== ".js") {
      continue;
    }

    if (!statSync(entryAbsolutePath).size) {
      continue;
    }

    files.push(entryRelativePath.replaceAll("\\", "/"));
  }

  return files;
}

const filesToCheck = sourceRoots.flatMap(collectJsFiles).sort();

if (!filesToCheck.length) {
  console.log("No frontend JavaScript files found for syntax checks.");
  process.exit(0);
}

console.log(`Checking frontend syntax for ${filesToCheck.length} files...`);

for (const file of filesToCheck) {
  const result = spawnSync("node", ["--check", file], {
    cwd: repoRoot,
    stdio: "inherit",
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

console.log("Frontend syntax checks passed.");
