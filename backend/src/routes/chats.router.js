import { Router } from "express";
import auth from "../middlewares/auth.js";
import {
  getChatById,
  createNewChat,
  getAllChats,
  getUnreadCount,
  deleteChat,
  addMessages,
} from "../controllers/chat.controllers.js";

const app = Router();

app.get("/", auth, getAllChats);
app.get("/unread", auth, getUnreadCount);
app.get("/:id", auth, getChatById);
app.post("/", auth, createNewChat);
app.post("/:id", auth, addMessages);
app.delete("/:id", auth, deleteChat);

export default app;
