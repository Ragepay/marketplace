import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { ChatModel } from "./models/chat.model.js";
import { ensureDB, touchActivity } from "./db.js";

export const initSocket = (httpServer, allowedOrigins) => {
  const io = new Server(httpServer, {
    cors: {
      origin: allowedOrigins,
      methods: ["GET", "POST"],
    },
  });

  // Auth por JWT en el handshake
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("No autorizado"));
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.userId;
      next();
    } catch {
      next(new Error("Token inválido"));
    }
  });

  io.on("connection", (socket) => {
    touchActivity(); // un chat abierto cuenta como actividad

    // Unirse a la sala de un chat (verificando que el usuario pertenece)
    socket.on("join-chat", async (chatId) => {
      try {
        await ensureDB();
        touchActivity();
        const chat = await ChatModel.findById(chatId).select("users");
        if (chat && chat.users.some((u) => u.toString() === socket.userId)) {
          socket.join(chatId);
        }
      } catch {
        /* ignore */
      }
    });

    socket.on("leave-chat", (chatId) => socket.leave(chatId));
  });

  return io;
};
