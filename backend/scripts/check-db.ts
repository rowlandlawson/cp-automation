import { testDatabaseConnection } from "../config/database";

const result = await testDatabaseConnection();

console.log(`[db:check] ${result.state} - ${result.message}`);

if (result.state !== "connected") {
  process.exitCode = 1;
}
