
export class HttpError extends Error {
  statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.statusCode = statusCode;
    // Ensures proper stack trace for where the error was thrown
    Error.captureStackTrace(this, this.constructor);
  }
}
