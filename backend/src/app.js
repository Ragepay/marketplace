import express from "express";
import http from "http";
import mongoose from "mongoose";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import productsRoute from "./routes/products.router.js";
import usersRoute from "./routes/users.router.js";
import chatRoute from "./routes/chats.router.js";
import reviewsRoute from "./routes/reviews.router.js";
import reportsRoute from "./routes/reports.router.js";
import { initSocket } from "./socket.js";
import { config } from "./config.js";

const PORT = config.port;
const API_USER = config.api_user;
const API_PASSWORD = config.api_password;
const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:3000",
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    callback(new Error("Not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.options("*", cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: "Demasiados intentos. Intente nuevamente en 15 minutos." },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use("/api/users/login", authLimiter);
app.use("/api/users/register", authLimiter);

app.use("/api/products", productsRoute);
app.use("/api/users", usersRoute);
app.use("/api/chats", chatRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/reports", reportsRoute);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
});

const connectDB = async () => {
  try {
    await mongoose.connect(
      `mongodb+srv://${API_USER}:${API_PASSWORD}@coderback.vqrxnc2.mongodb.net/?retryWrites=true&w=majority&appName=Coderback`,
      { dbName: "Marketplace" }
    );
    console.log("Listo la base de datos");
  } catch (error) {
    console.error("Error conectando a la base de datos:", error.message);
    process.exit(1);
  }
};

// En tests no conectamos a la DB ni levantamos el server
if (process.env.NODE_ENV !== "test") {
  connectDB();

  // Server HTTP + WebSockets (socket.io)
  const server = http.createServer(app);
  const io = initSocket(server, allowedOrigins);
  app.set("io", io); // accesible desde controllers vía req.app.get("io")

  server.listen(PORT, () => {
    console.log(`Servidor ON, PORT: ${PORT}`);
  });
}

export default app;
