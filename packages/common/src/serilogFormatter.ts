import winston from "winston";

import { MessageTemplate } from "./messageTemplate";

export const getTemplatedMessageArguments = (templatedMessage: string, args: unknown[]) => {
  const messageTemplate = new MessageTemplate(templatedMessage);
  const boundProperties = messageTemplate.bindProperties(args);
  const message = messageTemplate.render(boundProperties);
  return { messageTemplate: messageTemplate.raw, boundProperties, message };
};

export const serilogFormatter = winston.format((info) => {
  try {
          // @ts-ignore
    const argumentsPassedIn: unknown[] = info[Symbol.for("splat")];
    const { message, messageTemplate, boundProperties } = getTemplatedMessageArguments(
            // @ts-ignore
      info.message,
      argumentsPassedIn,
    );

    info.message = message;

    info["messageTemplate"] = messageTemplate;
    Object.keys(boundProperties)
      .filter((k) => !(k in info))
      .forEach((k) => {
        info[k] = boundProperties[k];
      });
    return info;
  } catch {
    return info;
  }
});
