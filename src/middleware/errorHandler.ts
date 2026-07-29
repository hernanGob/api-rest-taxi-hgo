import type {
    ErrorRequestHandler,
} from "express";
import { AppError } from "../shared/errors/appError.js";

export const errorHandler: ErrorRequestHandler = (
    error,
    _req,
    res,
    _next,
) => {
    if (error instanceof AppError) {
        return res
            .status(error.statusCode)
            .json({
                ok: false,
                status: error.status,
                msg: error.message,
            });
    }

    console.error(
        "[Unhandled error]",
        error,
    );

    return res.status(500).json({
        ok: false,
        status: "error",
        msg: "Error interno del servidor",
    });
};