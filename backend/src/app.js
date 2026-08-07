import express from "express";
import cors from "cors";
import notificationRoutes from "./routes/notification.routes.js";
import {
  notFound,
  errorHandler
} from "./middleware/error-handler.js";

const app = express();

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN || "http://localhost:5175"
  })
);

app.use(express.json({ limit: "1mb" }));

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "System Services API is running"
  });
});

app.use("/api/v1", notificationRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
