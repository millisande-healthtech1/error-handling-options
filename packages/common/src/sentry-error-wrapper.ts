export type LogEvent = {
  message: string;
  timestamp: Date;
  messageTemplate?: string;
  stack?: string;
  level: "error" | "warn" | "info" | "debug" | "verbose";
  tags?: { [key: string]: string };
  [key: PropertyKey]: unknown;
};

export class SentryErrorWrapper extends Error {
  constructor(info: LogEvent) {
    super(info.message);
    this.name = info.messageTemplate ?? info.message;
    if (info.stack) {
      this.stack = info.stack;
    }
  }
}
