import { Request, Response, NextFunction } from "express";
import { logger } from "../utils/logger";

export const errorHandler = (
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  logger.error("Unhandled error", err);

  res.status(500).json({
    message: "Internal server error",
  });
};
