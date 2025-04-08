import { addBreadcrumb, captureException, captureMessage, flush } from "@sentry/core";
import TransportStream from "winston-transport";
import { SentryErrorWrapper } from "./sentry-error-wrapper";

export type LogEvent = {
  message: string;
  timestamp: Date;
  messageTemplate?: string;
  stack?: string;
  level: "error" | "warn" | "info" | "debug" | "verbose";
  tags?: { [key: string]: string };
  [key: PropertyKey]: unknown;
};

const levelsMap = {
  verbose: "debug",
  info: "info",
  debug: "debug",
  warn: "warning",
  error: "error",
} as const;

export type SentryShim = {
  captureMessage: typeof captureMessage;
  captureException: typeof captureException;
  flush: typeof flush;
  addBreadcrumb: typeof addBreadcrumb;
};

export interface SentryTransportOptions extends TransportStream.TransportStreamOptions {
  sentry: SentryShim;
}

export default class SentryTransport extends TransportStream {
  public override silent = false;
  private sentry: SentryShim;

  public constructor(opts: SentryTransportOptions) {
    super(opts);

    this.silent = (opts && opts.silent) || false;
    this.sentry = opts?.sentry;
  }

  public override log(info: LogEvent, callback: () => void) {
    setImmediate(() => {
      this.emit("logged", info);
    });

    if (this.silent) {
      return callback();
    }

    const { message, tags, ...meta } = info;
    const logTags = tags || {};

    const winstonLevel = info[Symbol.for("level")] as keyof typeof levelsMap;

    // Ignore messages with [sentry-skip]
    if (meta.messageTemplate?.includes("[sentry-skip]") || message.includes("[sentry-skip]")) {
      return callback();
    }

    const sentryLevel = levelsMap[winstonLevel];
    if (sentryLevel === "info") {
      this.sentry.addBreadcrumb({
        message,
      });
      return callback();
    }

    const fingerprint = [meta.messageTemplate || message];

    // Capturing Errors / Exceptions
    if (info.stack) {
      const error = new SentryErrorWrapper(info);
      this.sentry.captureException(error, {
        fingerprint,
        tags: logTags,
        extra: meta,
      });

      return callback();
    } else if (Object.entries(meta).some((y) => y[1] instanceof Error)) {
      const [_, error] = Object.entries(meta).filter((y) => y[1] instanceof Error)[0]!;
      this.sentry.captureException(error, {
        fingerprint,
        tags: logTags,
        extra: meta,
      });
    }

    this.sentry.captureMessage(message, {
      level: sentryLevel,
      fingerprint,
      tags: logTags,
      extra: meta,
    });
    return callback();
  }

  // biome-ignore lint/suspicious/noExplicitAny: <explanation>
  override end(...args: any[]) {
    super.end(...args);
    this.sentry.flush().catch((e) => {
      throw e;
    });
    return this;
  }
}
