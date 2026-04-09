import { createApp } from "./app";
import { env } from "./config/env";
import { logInfo, registerProcessLogging } from "./utils/logger";

const app = createApp();

registerProcessLogging();

app.listen(env.PORT, () => {
  logInfo("server_started", {
    environment: env.NODE_ENV,
    port: env.PORT,
    url: `http://localhost:${env.PORT}`,
  });
});
