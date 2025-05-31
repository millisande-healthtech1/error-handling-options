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

    // This is overwriting the full stack trace with just the information provided in the constructor, turned off for my purposes
    // // @ts-ignore
    // Error.captureStackTrace(this, this.constructor);
  }
}
