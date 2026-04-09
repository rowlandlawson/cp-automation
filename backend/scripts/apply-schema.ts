import { applyDatabaseSchema } from "../config/database";

const result = await applyDatabaseSchema();

console.log(`[db:apply-schema] ${result.state} - ${result.message}`);

if (result.state !== "applied") {
  process.exitCode = 1;
}
