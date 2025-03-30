import { getTemplatedMessageArguments } from "./serilogFormatter";

export class TemplatedError extends Error {
  messageTemplate: string;

  constructor(templatedMessage: string, ...params: unknown[]) {
    const { message, messageTemplate, boundProperties } = getTemplatedMessageArguments(
      templatedMessage,
      params,
    );
    super(message);
    this.messageTemplate = messageTemplate;
    Object.keys(boundProperties).forEach((key) => {
      // @ts-ignore
      this[key] = boundProperties[key];
    });
    // @ts-ignore
    Error.captureStackTrace(this, this.constructor);
  }
}
