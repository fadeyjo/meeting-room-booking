import "module-alias/register";
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";
import swaggerUi from "swagger-ui-express";

import invitationsRoutes from "./routes/invitations.routes";
import { errorHandler } from "@shared-backend/middleware/error.middleware";

dotenv.config({
  path: path.resolve(__dirname, "../../shared/config/.env")
});

const openapiPath = path.join(__dirname, "../..", "openapi.json");
const swaggerDocument = JSON.parse(fs.readFileSync(openapiPath, "utf-8"));

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use("/api/invitations", invitationsRoutes)

app.use(errorHandler);

const PORT = Number(process.env.PORT);

app.listen(PORT, () => {
  console.log(`InvitationsService running on port ${PORT}`);
});