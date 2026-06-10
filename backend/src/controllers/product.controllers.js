import { ProductModel } from "../models/product.model.js";
import { UserModel } from "../models/user.model.js";
import { uploadImages, deleteImage } from "../utils/cloudinary.util.js";
import fs from "fs-extra";
import { findChatByUsers } from "./chat.controllers.js";

export const getAllProducts = async (req, res) => {
  try {
    const {
      limit = 10,
      page = 1,
      query = "",
      status = "available",
      minPrice,
      maxPrice,
      category,
      province,
      sort = "recent",
    } = req.query;
    let filter = {};

    if (province) {
      const escapedProv = province.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter["location.province"] = { $regex: escapedProv, $options: "i" };
    }

    // status=all devuelve todo; por defecto solo disponibles en el catálogo
    if (status !== "all") {
      filter.status = status;
    }

    if (query) {
      // Escapar caracteres especiales para evitar ReDoS
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.$or = [
        { title: { $regex: escaped, $options: "i" } },
        { category: { $regex: escaped, $options: "i" } },
      ];
    }

    if (category) {
      const escapedCat = category.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.category = { $regex: escapedCat, $options: "i" };
    }

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    const sortMap = {
      recent: { createdAt: -1 },
      "price-asc": { price: 1 },
      "price-desc": { price: -1 },
      title: { title: 1 },
    };

    const options = {
      limit: Math.min(Number(limit), 50),
      page: Number(page),
      sort: sortMap[sort] || sortMap.recent,
    };

    const result = await ProductModel.paginate(filter, options);
    const linkPage = (p) => `/api/products/?limit=${limit}&page=${p}&query=${query}`;

    return res.status(200).json({
      status: "success",
      payload: result.docs,
      totalPages: result.totalPages,
      prevPage: result.prevPage,
      nextPage: result.nextPage,
      page: result.page,
      hasPrevPage: result.hasPrevPage,
      hasNextPage: result.hasNextPage,
      prevLink: result.hasPrevPage ? linkPage(result.prevPage) : null,
      nextLink: result.hasNextPage ? linkPage(result.nextPage) : null,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Error al obtener productos." });
  }
};

export const getProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const product = await ProductModel.findById(productId).lean();
    if (!product) {
      return res.status(404).json({ message: "Producto no encontrado" });
    }

    let chatId = null;
    if (req.user && product.ownerId) {
      const chat = await findChatByUsers(req.user.userId, product.ownerId);
      chatId = chat?._id || null;
    }

    return res.status(200).json({ ...product, chatId });
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener el producto." });
  }
};

export const getProductsByUser = async (req, res) => {
  try {
    const { userId } = req.user;
    const user = await UserModel.findById(userId).populate("products");
    if (!user) return res.status(404).json({ message: "Usuario no encontrado." });
    return res.status(200).json({ status: "success", payload: user.products });
  } catch (error) {
    return res.status(500).json({ message: "Error al obtener los productos del usuario." });
  }
};

export const createProduct = async (req, res) => {
  try {
    const { title, price, description, category, province, city } = req.body;
    const { userId } = req.user;

    if (!title || !description || !price || !category) {
      return res.status(400).json({ status: "error", message: "Todos los campos son requeridos." });
    }

    if (Number(price) < 0) {
      return res.status(400).json({ status: "error", message: "El precio no puede ser negativo." });
    }

    if (!req.files || !req.files.productImage) {
      return res.status(400).json({ status: "error", message: "Se requiere al menos una imagen." });
    }

    const images = Array.isArray(req.files.productImage)
      ? req.files.productImage
      : [req.files.productImage];

    const uploadedImages = await Promise.all(
      images.map(async (file) => {
        const result = await uploadImages(file.tempFilePath);
        await fs.unlink(file.tempFilePath).catch(() => {});
        if (!result) throw new Error("Error subiendo imagen a Cloudinary.");
        return { public_id: result.public_id, secure_url: result.secure_url };
      })
    );

    const product = await ProductModel.create({
      title,
      price: Number(price),
      description,
      productImage: uploadedImages,
      category,
      location: { province: province || "", city: city || "" },
      ownerId: userId,
    });

    await addProduct({ userId, productId: product._id });

    return res.status(201).json({
      status: "success",
      message: "Producto creado exitosamente.",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Error al crear el producto." });
  }
};

export const updateProductById = async (req, res) => {
  try {
    const { productId } = req.params;
    const { title, price, description, category } = req.body;
    const { userId } = req.user;

    const existingProduct = await ProductModel.findById(productId);
    if (!existingProduct) {
      return res.status(404).json({ status: "error", message: "Producto no encontrado." });
    }

    // Verificar que el usuario es el dueño
    if (existingProduct.ownerId?.toString() !== userId.toString()) {
      return res.status(403).json({ status: "error", message: "No tienes permiso para editar este producto." });
    }

    if (price !== undefined && Number(price) < 0) {
      return res.status(400).json({ status: "error", message: "El precio no puede ser negativo." });
    }

    let uploadedImages = existingProduct.productImage || [];
    if (req.files && req.files.productImage) {
      const images = Array.isArray(req.files.productImage)
        ? req.files.productImage
        : [req.files.productImage];

      uploadedImages = await Promise.all(
        images.map(async (file) => {
          const result = await uploadImages(file.tempFilePath);
          await fs.unlink(file.tempFilePath).catch(() => {});
          if (!result) throw new Error("Error subiendo imagen.");
          return { public_id: result.public_id, secure_url: result.secure_url };
        })
      );
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      productId,
      {
        ...(title && { title }),
        ...(price !== undefined && { price: Number(price) }),
        ...(description && { description }),
        ...(category && { category }),
        productImage: uploadedImages,
      },
      { new: true }
    );

    return res.status(200).json({
      status: "success",
      message: "Producto actualizado.",
      data: updatedProduct,
    });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Error al actualizar el producto." });
  }
};

export const updateProductStatus = async (req, res) => {
  try {
    const { productId } = req.params;
    const { status } = req.body;
    const { userId } = req.user;

    if (!["available", "reserved", "sold"].includes(status)) {
      return res.status(400).json({ status: "error", message: "Estado inválido." });
    }

    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ status: "error", message: "Producto no encontrado." });
    }
    if (product.ownerId?.toString() !== userId.toString()) {
      return res.status(403).json({ status: "error", message: "No tenés permiso." });
    }

    product.status = status;
    await product.save();

    return res.status(200).json({ status: "success", data: product });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Error al actualizar el estado." });
  }
};

export const deleteProductById = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId } = req.params;

    const product = await ProductModel.findById(productId);
    if (!product) {
      return res.status(404).json({ status: "error", message: "Producto no encontrado." });
    }

    // Permitir si es el dueño o un administrador (moderación)
    const requester = await UserModel.findById(userId).select("isAdmin");
    const isOwner = product.ownerId?.toString() === userId.toString();
    if (!isOwner && !requester?.isAdmin) {
      return res.status(403).json({ status: "error", message: "No tienes permiso para eliminar este producto." });
    }

    await ProductModel.findByIdAndDelete(productId);

    if (product.productImage?.length > 0) {
      await Promise.allSettled(product.productImage.map((img) => deleteImage(img.public_id)));
    }

    // Remover el producto del array del dueño real
    if (product.ownerId) {
      await UserModel.findByIdAndUpdate(product.ownerId, { $pull: { products: productId } });
    }

    return res.status(200).json({ status: "success", message: "Producto eliminado." });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Error al eliminar el producto." });
  }
};

const addProduct = async ({ userId, productId }) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) return;

    const exists = user.products.some((p) => p._id.toString() === productId.toString());
    if (!exists) {
      user.products.push(productId);
      await user.save();
    }
  } catch (error) {
    console.error("Error al asociar producto al usuario:", error.message);
  }
};
