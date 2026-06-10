import { Router } from "express";
import auth, { optionalAuth } from "../middlewares/auth.js";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProductById,
  updateProductStatus,
  deleteProductById,
  getProductsByUser,
} from "../controllers/product.controllers.js";
import { uploadImages } from "../middlewares/cloudinary.middleware.js";

const app = Router();

// GET all products ✅
app.get("/", getAllProducts);

// POST create product ✅ TODO > add middleware: auth
app.post("/", uploadImages, auth, createProduct);

// GET user by id ✅
app.get("/posts", auth, getProductsByUser);

// GET product by id — auth opcional (guests pueden ver detalles)
app.get("/:productId", optionalAuth, getProductById);

// PUT update product by id ✅ TODO > add middleware: auth, owner
app.put("/:productId", uploadImages, auth, updateProductById);

// PATCH cambiar estado (disponible/reservado/vendido) — solo dueño
app.patch("/:productId/status", auth, updateProductStatus);

// DELETE product by id ✅ TODO > add middleware: auth, owner | admin
app.delete("/:productId", auth, deleteProductById);

export default app;
