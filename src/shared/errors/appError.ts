export type ErrorStatus =
    | "error"
    | "invalid_credentials"
    | "too_many_attempts"
    | "not_found"
    | "not_password";

export class AppError extends Error {
    constructor(
        message: string,
        public readonly statusCode: number,
        public readonly status: ErrorStatus = "error",
        public readonly isOperational = true,
    ) {
        super(message);

        this.name = "AppError";

        Object.setPrototypeOf(
            this,
            new.target.prototype,
        );

        Error.captureStackTrace(
            this,
            this.constructor,
        );
    }
}
