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

export class ForbiddenError extends AppError {
  constructor(
    message = "Admin level perimission required.",
    suggestion = "Only admin can take this action."
  ) {
    super(message, {
      code: "INSUFFICIENT_PERMISSIONS",
      statusCode: 403,
      suggestion,
    });
    this.name = "ForbiddenError";
  }
}

export class ResourceExpiredError extends AppError {
  constructor(
    message = "This resource has expired.",
    suggestion = "The resource is no longer available. Please request a new one or contact support if you believe this is a mistake."
  ) {
    super(message, {
      code: "RESOURCE_EXPIRED",
      statusCode: 410,
      suggestion,
    });
    this.name = "ResourceExpiredError";
  }
}
