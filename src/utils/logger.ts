/* 先做簡單版，之後可以換 winston / pino */

export const logger = {
  info: (...args: unknown[]) => {
    console.log("[INFO]", ...args);
  },
  error: (...args: unknown[]) => {
    console.error("[ERROR]", ...args);
  },
};
