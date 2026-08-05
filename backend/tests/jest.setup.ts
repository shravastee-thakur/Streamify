import { clearDatabase, closeDatabase } from "./setup.js";

afterEach(async () => {
  await clearDatabase();
});

afterAll(async () => {
  await closeDatabase();
});
