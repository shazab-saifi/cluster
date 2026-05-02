export interface ErrorType {
  code: string;
  message: string;
  timestamp: string;
  path: string;
  suggestion: string;
}

export interface AppErrorOptions {
  code: string;
  statusCode: number;
  suggestion?: string;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly status: "fail" | "error";
  public readonly suggestion: string;

  constructor(
    message: string,
    {
      code,
      statusCode,
      suggestion = "Please try again later.",
    }: AppErrorOptions
  ) {
    super(message);
    this.name = "AppError";
    this.code = code;
    this.statusCode = statusCode;
    this.status = statusCode >= 500 ? "error" : "fail";
    this.suggestion = suggestion;
  }
}
