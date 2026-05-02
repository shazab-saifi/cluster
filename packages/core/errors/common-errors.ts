import { AppError } from "./app-error";

export class BadRequestError extends AppError {
  constructor(
    message = "Bad request.",
    suggestion = "Check the request and try again."
  ) {
    super(message, {
      code: "BAD_REQUEST",
      statusCode: 400,
      suggestion,
    });
    this.name = "BadRequestError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message = "Invalid inputs.",
    suggestion = "Check the request body and try again."
  ) {
    super(message, {
      code: "INVALID_INPUTS",
      statusCode: 400,
      suggestion,
    });
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends AppError {
  constructor(
    message = "Unauthorized.",
    suggestion = "Make sure to sign in first before making this request."
  ) {
    super(message, {
      code: "UNAUTHORIZED",
      statusCode: 401,
      suggestion,
    });
    this.name = "UnauthorizedError";
  }
}

export class NotFoundError extends AppError {
  constructor(
    message = "Resource not found.",
    suggestion = "Verify the resource identifier and try again."
  ) {
    super(message, {
      code: "NOT_FOUND",
      statusCode: 404,
      suggestion,
    });
    this.name = "NotFoundError";
  }
}
