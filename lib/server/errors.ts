export class HttpError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly headers?: HeadersInit,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export class ServiceUnavailableError extends HttpError {
  constructor(message: string) {
    super(503, message);
    this.name = "ServiceUnavailableError";
  }
}
