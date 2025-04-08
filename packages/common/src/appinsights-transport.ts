import { TelemetryClient } from "applicationinsights";
import { SeverityLevel } from "applicationinsights/out/Declarations/Contracts";
import TransportStream from "winston-transport";

export type LogEvent = {
  message: string;
  timestamp: Date;
  messageTemplate?: string;
  stack?: string;
  level: "error" | "warn" | "info" | "debug" | "verbose";
  tags?: { [key: string]: string };
  [key: PropertyKey]: unknown;
};

function getMessageLevel(winstonLevel: LogEvent["level"]) {
  const levels = {
    error: SeverityLevel.Error,
    warn: SeverityLevel.Warning,
    info: SeverityLevel.Information,
    verbose: SeverityLevel.Verbose,
    debug: SeverityLevel.Verbose,
  } as const;

  return winstonLevel in levels ? levels[winstonLevel] as SeverityLevel : SeverityLevel.Information;
}

export interface AppInsightsLoggerOptions extends TransportStream.TransportStreamOptions {
  telemetryClient: TelemetryClient;
}

const isErrorLike = (obj: unknown): obj is Error => obj instanceof Error;

function replaceNonSerializable(obj: object) {
  const newObject: Record<string, unknown> = {};
  Object.keys(obj).forEach((key) => {
    try {
      const value = obj[key as keyof typeof obj];
      JSON.stringify(value);
      newObject[key] = value;
    } catch {
      newObject[key] = "cannot serialize";
    }
  });
  return newObject;
}

export default class AzureApplicationInsightsLogger extends TransportStream {
  private client: TelemetryClient;

  constructor(options: AppInsightsLoggerOptions) {
    super(options);
    this.client = options.telemetryClient;
  }

  override log(info: LogEvent, callback: () => void) {
    const { level, message, ...meta } = info;
    const severity: any = getMessageLevel(level);

    const properties = replaceNonSerializable(meta);
    if (info.stack) {
      this.client.trackException({
        exception: isErrorLike(info) ? info : new Error(message),
        severity,
        properties,
      });
    } else if (Object.entries(meta).some((y) => y[1] instanceof Error)) {
      const [_keyName, error] = Object.entries(meta).filter((y) => isErrorLike(y[1]))[0]!;

      this.client.trackException({
        exception: error as Error,
        severity,
        properties,
      });
    } else {
      this.client.trackTrace({
        message,
        severity,
        properties,
      });
    }

    return callback();
  }
}
