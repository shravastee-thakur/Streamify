import { env } from "./config/env.js";
import app from "./app.js";
import logger from "./utils/logger.js";

const port = env.PORT;

app.listen(port, () => {
  logger.info(`Server is running on port: http://localhost:${port}`);
});
