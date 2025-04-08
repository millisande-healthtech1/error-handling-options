import path from "path";
import { TelemetryClient } from "applicationinsights";
import winston, { Logger } from "winston";
import Transport from "winston-transport";

import { AsyncLocalStorage } from "node:async_hooks";
import { withIsolationScope } from "@sentry/core";
import AzureApplicationInsightsLogger from "./appinsights-transport";
import SentryTransport, { SentryShim } from "./sentry-transport";
import { serilogFormatter } from "./serilogFormatter";

export async function performSafeWithDefault<T>(
  fnDoWork: () => Promise<T>,
  defaultValue: T,
  errorMessage: string,
  ...errorVariables: unknown[]
) {
  try {
    return await fnDoWork();
  } catch (error: unknown) {
    logger.error(`${errorMessage} with error {error}`, [...errorVariables, error]);
    return defaultValue;
  }
}

const asyncLocalLoggerStorage = new AsyncLocalStorage<{ tags: LoggingTags }>();

const runWithLoggerStorage = <T>(fn: () => T) => {
  return asyncLocalLoggerStorage.run({ tags: {} }, () => fn());
};

export const runWithAsyncContext = <T>(
  sentry: { withIsolationScope: typeof withIsolationScope },
  fn: () => T,
) => {
  return runWithLoggerStorage(() => {
    return sentry.withIsolationScope((scope) => {
      scope.clearBreadcrumbs();
      return fn();
    });
  });
};

export const addTagsToLoggerContext = (newTags: LoggingTags) => {
  const store = asyncLocalLoggerStorage.getStore();
  if (store) {
    store.tags = { ...(store.tags ?? {}), ...newTags };
  }
};

export const getLabel = (callingModule: { filename: string }) => {
  const parts = callingModule.filename.split(path.sep);
  return path.join(parts[parts.length - 2] ?? "", parts.pop() ?? "");
};

export const consoleFormatter = winston.format((info) => {
  const padding = (info["padding"] && (info["padding"] as any)[info.level]) || "";
  info[Symbol.for("message")] = `${info["timestamp"]} ${info.level}:${padding} ${info.message}`;
  return info;
});

export const setDefaultTags = (defaultTags: Record<string, string | number>) => {
  logger.defaultMeta = defaultTags;
};

const winstonOptions = {
  level: "info",
  format: winston.format.combine(
    winston.format.timestamp({
      format: "YYYY-MM-DD HH:mm:ss",
    }),
    serilogFormatter(),
    winston.format((info) => {
      info["tags"] = {
        ...(asyncLocalLoggerStorage.getStore() || {}).tags,
        ...(info["tags"] || {}),
      };
      return info;
    })(),
    winston.format.errors(),
    winston.format.printf((info) => {
      if (info["stack"]) {
        return `[${info["label"]}]info["timestamp"]amp}][${info.level}] ${info.message} - ${info["stack"]}`;
      }
      return `[${info["label"]}][${info["timestamp"]}][${info.level}] ${info.message}`;
    }),
  ),
  defaultMeta: {},
  transports:
    process.env["NODE_ENV"] === "production"
      ? []
      : [
          new winston.transports.Console({
            format: winston.format.combine(winston.format.colorize(), consoleFormatter()),
          }),
        ],
};

//extend to have more tags available
export type LoggingTags = Partial<
  Record<"team" | "type" | "functionName" | "functionInvocationId", string>
>;

export interface CustomLogger extends Logger {
  withTags(tags: LoggingTags): Logger;
}

const baseLogger = winston.createLogger(winstonOptions);

const CustomWithTagsMethod = {
  withTags: (tags: LoggingTags) => baseLogger.child({ tags }),
};

export const logger: CustomLogger = Object.assign(baseLogger, CustomWithTagsMethod);
// This needs to be called only once, when the app starts
export const addSentryTransport = (sentry: SentryShim) => {
  logger.add(
    new SentryTransport({
      sentry,
    }),
  );
  return logger;
};

export const addAppInsightsTransport = (telemetryClient: TelemetryClient) => {
  logger.add(
    new AzureApplicationInsightsLogger({
      telemetryClient,
    }),
  );
};

export const addLogger = (winstonTransport: Transport) => logger.add(winstonTransport);

export const getLogger = (moduleName: { filename: string }) =>
  logger.child({ label: getLabel(moduleName) });
