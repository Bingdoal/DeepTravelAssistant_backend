import express, { Application } from "express";
import { env } from "./config/env";
import { router } from "./routers";
import { notFoundHandler } from "./middlewares/notFoundHandler";
import { errorHandler } from "./middlewares/errorHandler";

export const createApp = (): Application => {
  const app = express();

  // 基本內建 middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // 之後如果要放 request logging, cors 等也在這邊加

  // routes
  app.use("/api", router);

  // 404
  app.use(notFoundHandler);

  // 統一 error handler
  app.use(errorHandler);

  return app;
};
