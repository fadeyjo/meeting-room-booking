import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import swaggerUi from "swagger-ui-express";

import authRoutes from "./routes/auth.routes";
import { errorHandler } from "./middleware/error.middleware";
import swaggerDocument from "./swagger.json";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/auth", authRoutes);

app.use(errorHandler);

const PORT = Number(process.env.PORT);

app.listen(PORT, () => {
  console.log(`AuthService running on port ${PORT}`);
});