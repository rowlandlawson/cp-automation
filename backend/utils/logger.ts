import { env } from "../config/env";

type LogLevel = "error" | "info" | "warn";

type LogContext = Record<string, unknown>;

function getErrorDetails(error: unknown): LogContext {
  if (error instanceof Error) {
    return {
      error_message: error.message,
      error_name: error.name,
      error_stack: error.stack,
    };
  }

  return {
    error_message: String(error),
  };
}

function writeLog(level: LogLevel, event: string, context: LogContext = {}): void {
  const payload = {
    environment: env.NODE_ENV,
    event,
    level,
    service: "cp-automation-backend",
    timestamp: new Date().toISOString(),
    ...context,
  };

  const line = JSON.stringify(payload);

  if (level === "error") {
    console.error(line);
    return;
  }

  if (level === "warn") {
    console.warn(line);
    return;
  }

  console.log(line);
}

export function logInfo(event: string, context: LogContext = {}): void {
  writeLog("info", event, context);
}

export function logWarn(event: string, context: LogContext = {}): void {
  writeLog("warn", event, context);
}

export function logError(event: string, error: unknown, context: LogContext = {}): void {
  writeLog("error", event, {
    ...context,
    ...getErrorDetails(error),
  });
}

let processHandlersRegistered = false;

export function registerProcessLogging(): void {
  if (processHandlersRegistered) {
    return;
  }

  processHandlersRegistered = true;

  process.on("unhandledRejection", (reason) => {
    logError("process_unhandled_rejection", reason);
  });

  process.on("uncaughtException", (error) => {
    logError("process_uncaught_exception", error);
  });
}
