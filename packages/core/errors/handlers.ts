import { Prisma } from "@workspace/db";
import { randomUUID } from "node:crypto";
import { AppError, type ErrorType } from "./app-error";
import { NoSuchBucket, S3ServiceException } from "@workspace/aws/s3";

interface ResponseLike {
  status(code: number): ResponseLike;
  json(body: unknown): unknown;
}

interface SendErrorResponseOptions {
  path?: string;
  requestId?: string;
}

function formatTarget(target: unknown) {
  if (Array.isArray(target)) {
    return target.join(", ");
  }

  if (typeof target === "string") {
    return target;
  }

  return "The provided value";
}

export function mapPrismaError(error: Prisma.PrismaClientKnownRequestError) {
  switch (error.code) {
    case "P2002":
      return new AppError(
        `${formatTarget(error.meta?.target)} must be unique.`,
        {
          code: "UNIQUE_CONSTRAINT_VIOLATION",
          statusCode: 409,
          suggestion: "Use a different value and try again.",
        }
      );
    case "P2003":
      return new AppError(
        "The requested record references invalid related data.",
        {
          code: "FOREIGN_KEY_CONSTRAINT_VIOLATION",
          statusCode: 409,
          suggestion: "Verify the related record exists before retrying.",
        }
      );
    case "P2011":
      return new AppError("A required value is missing.", {
        code: "NULL_CONSTRAINT_VIOLATION",
        statusCode: 400,
        suggestion: "Provide all required fields and try again.",
      });
    case "P2025":
      return new AppError("The requested record was not found.", {
        code: "RECORD_NOT_FOUND",
        statusCode: 404,
        suggestion: "Verify the resource identifier and try again.",
      });
    default:
      return new AppError("Database request failed.", {
        code: "DATABASE_ERROR",
        statusCode: 500,
        suggestion: "Please try again later.",
      });
  }
}

function mapPrismaValidationError(error: Prisma.PrismaClientValidationError) {
  return new AppError("The database request payload is invalid.", {
    code: "DATABASE_VALIDATION_ERROR",
    statusCode: 400,
    suggestion:
      error.message.includes("Argument") || error.message.includes("Unknown")
        ? "Check the provided fields and their values, then try again."
        : "Review the request data and try again.",
  });
}

function mapPrismaInitializationError(
  error: Prisma.PrismaClientInitializationError
) {
  return new AppError("The database is temporarily unavailable.", {
    code: "DATABASE_UNAVAILABLE",
    statusCode: 503,
    suggestion:
      error.errorCode === "P1001"
        ? "Please try again in a moment."
        : "Please try again later.",
  });
}

function mapPrismaUnknownRequestError() {
  return new AppError("The database could not complete the request.", {
    code: "DATABASE_REQUEST_ERROR",
    statusCode: 500,
    suggestion: "Please try again later.",
  });
}

function mapPrismaRustPanicError() {
  return new AppError("The database engine encountered an internal error.", {
    code: "DATABASE_ENGINE_ERROR",
    statusCode: 503,
    suggestion: "Please try again later.",
  });
}

export function normalizeError(error: unknown) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return mapPrismaError(error);
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return mapPrismaValidationError(error);
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    return mapPrismaInitializationError(error);
  }

  if (error instanceof Prisma.PrismaClientRustPanicError) {
    return mapPrismaRustPanicError();
  }

  if (error instanceof Prisma.PrismaClientUnknownRequestError) {
    return mapPrismaUnknownRequestError();
  }

  if (error instanceof NoSuchBucket) {
    return new AppError(error.message || "Internal server error", {
      code: "NOT_FOUND",
      statusCode: 403,
      suggestion: "Please try again later",
    });
  }

  if (error instanceof S3ServiceException) {
    return new AppError(error.message, {
      code: error.name,
      statusCode: error.$metadata.httpStatusCode as number,
      suggestion: "Please try again later",
    });
  }

  if (error instanceof Error) {
    return new AppError(error.message || "Internal server error.", {
      code: "INTERNAL_SERVER_ERROR",
      statusCode: 500,
      suggestion: "Please try again later.",
    });
  }

  return new AppError("Internal server error.", {
    code: "INTERNAL_SERVER_ERROR",
    statusCode: 500,
    suggestion: "Please try again later.",
  });
}

export function buildErrorPayload(
  error: AppError,
  path = "unknown"
): ErrorType {
  return {
    code: error.code,
    message: error.message,
    timestamp: new Date().toISOString(),
    path,
    suggestion: error.suggestion,
  };
}

export function sendErrorResponse(
  response: ResponseLike,
  error: unknown,
  { path, requestId }: SendErrorResponseOptions = {}
) {
  const normalizedError = normalizeError(error);
  const payload = buildErrorPayload(normalizedError, path);

  return response.status(normalizedError.statusCode).json({
    success: false,
    status: normalizedError.status,
    statusCode: normalizedError.statusCode,
    error: payload,
    requestId: requestId ?? randomUUID(),
  });
}
