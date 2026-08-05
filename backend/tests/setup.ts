import dotenv from "dotenv";
import { sql } from "drizzle-orm";
import { db } from "../src/db/index.js";

dotenv.config({ path: ".env.test" });

export const clearDatabase = async () => {
  await db.execute(sql`TRUNCATE TABLE users RESTART IDENTITY CASCADE;`);
};

export const closeDatabase = async () => {
  // The Neon serverless driver is HTTP based and does not hold open TCP connections.
  // We leave this empty for structural parity with your previous projects.
};
