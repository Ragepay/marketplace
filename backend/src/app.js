import express from "express";
import http from "http";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import productsRoute from "./routes/products.router.js";
import usersRoute from "./routes/users.router.js";
import chatRoute from "./routes/chats.router.js";
import reviewsRoute from "./routes/reviews.router.js";
import reportsRoute from "./routes/reports.router.js";
import { initSocket } from "./socket.js";
import { ensureDB, touchActivity, setActiveSocketsGetter } from "./db.js";
import { config } from "./config.js";

const PORT = config.port;
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

// Conexión lazy a Mongo: aseguramos la conexión en cada request y marcamos
// actividad. Si la app está dormida, la primera request la reconecta.
// En tests no tocamos Mongo (los tests son de validación/auth).
if (process.env.NODE_ENV !== "test") {
  app.use(async (req, res, next) => {
    try {
      await ensureDB();
      touchActivity();
      next();
    } catch (err) {
      res
        .status(503)
        .json({ error: "Servicio iniciando, reintente en unos segundos" });
    }
  });
}

app.use("/api/products", productsRoute);
app.use("/api/users", usersRoute);
app.use("/api/chats", chatRoute);
app.use("/api/reviews", reviewsRoute);
app.use("/api/reports", reportsRoute);

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Error interno del servidor" });
});

// En tests no levantamos el server ni conectamos a la DB.
// No conectamos a Mongo en el arranque a propósito: la conexión es lazy
// (ver middleware arriba) para que la app pueda dormir cuando no hay tráfico.
if (process.env.NODE_ENV !== "test") {
  // Server HTTP + WebSockets (socket.io)
  const server = http.createServer(app);
  const io = initSocket(server, allowedOrigins);
  app.set("io", io); // accesible desde controllers vía req.app.get("io")

  // La desconexión por inactividad respeta los chats abiertos.
  setActiveSocketsGetter(() => io.engine?.clientsCount || 0);

  server.listen(PORT, () => {
    console.log(`Servidor ON, PORT: ${PORT}`);
  });
}

export default app;
