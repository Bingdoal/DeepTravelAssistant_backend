import dotenv from "dotenv";

dotenv.config();

const PORT = process.env.PORT ? Number(process.env.PORT) : 3000;
const NODE_ENV = process.env.NODE_ENV || "development";

export const env = {
  port: PORT,
  nodeEnv: NODE_ENV,
};
