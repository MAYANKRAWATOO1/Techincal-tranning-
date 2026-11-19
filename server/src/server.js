import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";
import express from "express";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import taskRoutes from "./routes/tasks.js";

const app = express();
const port = Number(process.env.PORT) || 5000;
const jwtSecret = process.env.JWT_SECRET;
const mongoUri = process.env.MONGODB_URI;

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must be set to a random value of at least 32 characters.");
}
if (!mongoUri) {
  throw new Error("MONGODB_URI must be set to a MongoDB connection string.");
}

app.disable("x-powered-by");
app.use(express.json({ limit: "10kb" }));

app.get("/api/health", (_request, response) => {
  response.json({ status: "ok" });
});
app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);

const clientDirectory = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../client/dist",
);
app.use(express.static(clientDirectory));
app.get("*", (request, response, next) => {
  if (request.path.startsWith("/api/")) {
    return response.status(404).json({ message: "API route not found." });
  }
  return response.sendFile(path.join(clientDirectory, "index.html"), (error) => {
    if (error) next(error);
  });
});

app.use((error, _request, response, _next) => {
  console.error(error);
  if (error instanceof SyntaxError && "body" in error) {
    return response.status(400).json({ message: "Request body must be valid JSON." });
  }
  return response.status(500).json({ message: "An unexpected server error occurred." });
});

await mongoose.connect(mongoUri);
app.listen(port, () => {
  console.log(`Daybook server listening on port ${port}`);
});
