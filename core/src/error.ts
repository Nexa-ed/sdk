export class NexaError extends Error {
  /**
   * HTTP status code from the Nexa API response.
   * 401 = invalid/missing API key
   * 403 = valid key but insufficient permissions
   * 404 = resource not found
   * 429 = rate limit exceeded
   */
  readonly status: number;

  /**
   * Machine-readable error code from the Nexa API (e.g. "UNAUTHORIZED", "NOT_FOUND").
   */
  readonly code: string | undefined;

  constructor(message: string, status: number, code?: string) {
    super(message);
    this.name = "NexaError";
    this.status = status;
    this.code = code;
    // Maintains proper prototype chain in ES5 transpilation
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isNexaError(err: unknown): err is NexaError {
  return err instanceof NexaError;
}
