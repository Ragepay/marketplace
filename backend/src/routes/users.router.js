import { Router } from "express";
import {
  getAllUsers,
  getUserById,
  getPublicUser,
  getUserByEmail,
  resetPassword,
  verifyEmail,
  getFavorites,
  addFavorite,
  removeFavorite,
  createUser,
  updateUser,
  changePassword,
  deleteUser,
  loginUser,
} from "../controllers/user.controllers.js";
import auth from "../middlewares/auth.js";

const app = Router();

app.get("/", auth, getAllUsers);

// Favoritos (antes de /:id para que no choque)
app.get("/me/favorites", auth, getFavorites);
app.post("/me/favorites", auth, addFavorite);
app.delete("/me/favorites/:productId", auth, removeFavorite);

app.get("/verify", verifyEmail);
app.get("/:id/public", getPublicUser);
app.get("/:id", auth, getUserById);
app.post("/recover", getUserByEmail);
app.post("/reset-password", resetPassword);
app.post("/register", createUser);
app.post("/login", loginUser);
app.put("/:id/password", auth, changePassword);
app.put("/:id", auth, updateUser);
app.delete("/:id", auth, deleteUser);

export default app;
