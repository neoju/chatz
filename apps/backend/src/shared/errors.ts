/**
 * Base HTTP Exception class - similar to NestJS HttpException
 * Provides a structured way to throw HTTP errors with status codes
 */
export class HttpException extends Error {
  constructor(
    private readonly response: string | Record<string, unknown>,
    private readonly status: number
  ) {
    super();
    this.initMessage();
    this.initName();
  }

  public getStatus(): number {
    return this.status;
  }

  public getResponse(): string | Record<string, unknown> {
    return this.response;
  }

  private initMessage(): void {
    if (typeof this.response === 'string') {
      this.message = this.response;
    } else if (
      typeof this.response === 'object' &&
      this.response !== null &&
      'message' in this.response
    ) {
      this.message = String(this.response.message);
    } else {
      this.message = 'Http Exception';
    }
  }

  private initName(): void {
    this.name = this.constructor.name;
  }
}

/**
 * 400 Bad Request - The server cannot process the request due to client error
 */
export class BadRequestException extends HttpException {
  constructor(message?: string | Record<string, unknown>) {
    super(message ?? 'Bad Request', 400);
  }
}

/**
 * 401 Unauthorized - Authentication is required and has failed or not been provided
 */
export class UnauthorizedException extends HttpException {
  constructor(message?: string | Record<string, unknown>) {
    super(message ?? 'Unauthorized', 401);
  }
}

/**
 * 403 Forbidden - Server understood the request but refuses to authorize it
 */
export class ForbiddenException extends HttpException {
  constructor(message?: string | Record<string, unknown>) {
    super(message ?? 'Forbidden', 403);
  }
}

/**
 * 404 Not Found - The requested resource could not be found
 */
export class NotFoundException extends HttpException {
  constructor(message?: string | Record<string, unknown>) {
    super(message ?? 'Not Found', 404);
  }
}

/**
 * 409 Conflict - Request conflicts with the current state of the server
 */
export class ConflictException extends HttpException {
  constructor(message?: string | Record<string, unknown>) {
    super(message ?? 'Conflict', 409);
  }
}

/**
 * 410 Gone - The requested resource is no longer available
 */
export class GoneException extends HttpException {
  constructor(message?: string | Record<string, unknown>) {
    super(message ?? 'Gone', 410);
  }
}

/**
 * 422 Unprocessable Entity - Semantic errors in the request
 */
export class UnprocessableEntityException extends HttpException {
  constructor(message?: string | Record<string, unknown>) {
    super(message ?? 'Unprocessable Entity', 422);
  }
}

/**
 * 500 Internal Server Error - Generic server error
 */
export class InternalServerErrorException extends HttpException {
  constructor(message?: string | Record<string, unknown>) {
    super(message ?? 'Internal Server Error', 500);
  }
}
