const tokenizer = /\{@?\w+}/g;

type TextToken = {
  kind: "text";
  text: string;
};

type SymbolToken = {
  kind: "symbol";
  name: string;
  destructure: boolean;
  raw: string;
};

type Token = TextToken | SymbolToken;

export class MessageTemplate {
  /**
   * Gets or sets the raw message template of this instance.
   */
  raw: string;

  private readonly tokens: Token[];

  /**
   * Creates a new MessageTemplate instance with the given template.
   */
  constructor(messageTemplate: string) {
    if (messageTemplate === null || !messageTemplate.length) {
      throw new Error('Argument "messageTemplate" is required.');
    }

    this.raw = messageTemplate;
    this.tokens = this.tokenize(messageTemplate);
  }

  render(properties: Record<string, unknown> = {}): string {
    if (!this.tokens.length) {
      return this.raw;
    }

    const result: string[] = [];
    for (let i = 0; i < this.tokens.length; i += 1) {
      const token = this.tokens[i]!;
      if (token.kind === "symbol") {
        if (Object.prototype.hasOwnProperty.call(properties, token.name)) {
          result.push(this.toText(properties[token.name]));
        } else {
          result.push(token.raw);
        }
      } else {
        result.push(token.text);
      }
    }
    return result.join("");
  }

  bindProperties(positionalArgs: unknown[]): Record<string, unknown> {
    const result: Record<string, unknown> = {};
    let nextArg = 0;
    for (let i = 0; i < this.tokens.length && nextArg < positionalArgs.length; i += 1) {
      const token = this.tokens[i];
      if (token && token.kind === "symbol") {
        const p = positionalArgs[nextArg];
        result[token.name] = this.capture(p, token.destructure);
        nextArg += 1;
      }
    }

    while (nextArg < positionalArgs.length) {
      const arg = positionalArgs[nextArg];
      if (typeof arg !== "undefined") {
        result[`a${nextArg}`] = this.capture(arg);
      }
      nextArg += 1;
    }

    return result;
  }

  private tokenize(template: string): Token[] {
    const tokens: Token[] = [];
    let result = tokenizer.exec(template);
    let textStart: number | undefined;

    while (result !== null) {
      if (result.index !== textStart) {
        tokens.push({
          kind: "text",
          text: template.slice(textStart, result.index),
        });
      }

      let destructure = false;

      let token = result[0].slice(1, -1);
      if (token.indexOf("@") === 0) {
        token = token.slice(1);
        destructure = true;
      }

      tokens.push({
        kind: "symbol",
        name: token,
        destructure,
        raw: result[0],
      });

      textStart = tokenizer.lastIndex;
      result = tokenizer.exec(template);
    }

    if (textStart && textStart >= 0 && textStart < template.length) {
      tokens.push({ kind: "text", text: template.slice(textStart) });
    }

    return tokens;
  }

  private toText(property: unknown): string {
    if (typeof property === "undefined") {
      return "undefined";
    }

    if (property === null) {
      return "null";
    }

    if (typeof property === "string") {
      return property;
    }

    if (typeof property === "number") {
      return property.toString();
    }

    if (typeof property === "boolean") {
      return property.toString();
    }

    // @ts-ignore
    if (typeof property.toISOString === "function") {
      // @ts-ignore
      return property.toISOString();
    }

    if (typeof property === "object") {
      let s = JSON.stringify(property);
      if (s.length > 70) {
        s = `${s.slice(0, 67)}...`;
      }

      return s;
    }

    return property.toString();
  }

  private capture(property: unknown, destructure?: boolean): unknown {
    if (typeof property === "function") {
      return property.toString();
    }

    if (typeof property === "object") {
      // null value will be automatically stringified as "null", in properties it will be as null
      // otherwise it will throw an error
      if (property === null) {
        return property;
      }

      // Could use instanceof Date, but this way will be kinder
      // to values passed from other contexts...

      // @ts-ignore
      if (destructure || typeof property.toISOString === "function") {
        return property;
      }

      return property.toString();
    }

    return property;
  }
}
