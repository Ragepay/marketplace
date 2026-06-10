import { UserModel } from "../models/user.model.js";
import nodemailer from "nodemailer";
import { config } from "../config.js";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const SALT_ROUNDS = 10;
const JWT_EXPIRES_IN = "24h";

const signJWT = (email, userId) =>
  jwt.sign({ email, userId }, process.env.JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });

const createTransporter = () =>
  nodemailer.createTransport({
    service: "gmail",
    auth: { user: config.email, pass: config.email_password },
  });

// GET all users — no devuelve contraseñas (select: false en modelo)
export const getAllUsers = async (req, res) => {
  try {
    const users = await UserModel.find({}).populate("products").populate("chats");
    return res.status(200).json(users);
  } catch (e) {
    return res.status(500).json({ error: "Error al obtener usuarios." });
  }
};

// GET user by id
export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id).populate("products").populate("chats");
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });
    return res.status(200).json(user);
  } catch (e) {
    return res.status(500).json({ error: "Error al obtener el usuario." });
  }
};

// ===== Favoritos (persistidos en el server) =====
export const getFavorites = async (req, res) => {
  try {
    const user = await UserModel.findById(req.user.userId).populate("favorites");
    return res.status(200).json(user?.favorites || []);
  } catch (e) {
    return res.status(500).json({ error: "Error al obtener favoritos." });
  }
};

export const addFavorite = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: "productId requerido." });
    await UserModel.findByIdAndUpdate(req.user.userId, { $addToSet: { favorites: productId } });
    return res.status(200).json({ status: "success" });
  } catch (e) {
    return res.status(500).json({ error: "Error al agregar favorito." });
  }
};

export const removeFavorite = async (req, res) => {
  try {
    const { productId } = req.params;
    await UserModel.findByIdAndUpdate(req.user.userId, { $pull: { favorites: productId } });
    return res.status(200).json({ status: "success" });
  } catch (e) {
    return res.status(500).json({ error: "Error al quitar favorito." });
  }
};

// GET verificar email
export const verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ error: "Token requerido." });
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: "El enlace es inválido o expiró." });
    }
    await UserModel.findByIdAndUpdate(decoded.userId, { emailVerified: true });
    return res.status(200).json({ status: "success", message: "Email verificado." });
  } catch (e) {
    return res.status(500).json({ error: "Error al verificar el email." });
  }
};

// GET public seller profile — datos no sensibles + productos disponibles
export const getPublicUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await UserModel.findById(id)
      .select("name lastname image createdAt")
      .populate({ path: "products", match: { status: { $ne: "sold" } } });
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });
    return res.status(200).json(user);
  } catch (e) {
    return res.status(500).json({ error: "Error al obtener el perfil." });
  }
};

// POST recover password — envía link, no la contraseña
export const getUserByEmail = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email requerido." });

    const user = await UserModel.findOne({ email });
    if (!user) {
      // Respuesta genérica para no revelar si el email existe
      return res.status(200).json({ message: "Si el email existe, recibirá instrucciones." });
    }

    const resetToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });

    const transporter = createTransporter();
    await transporter.sendMail({
      from: config.email,
      to: email,
      subject: "Recuperación de contraseña — Marketplace",
      text: `Recibimos una solicitud para restablecer tu contraseña.\n\nSi no la solicitaste, ignora este correo.\n\nToken de recuperación (válido 1 hora): ${resetToken}\n\nEste es un correo autogenerado, no respondas.`,
    });

    return res.status(200).json({ message: "Si el email existe, recibirá instrucciones." });
  } catch (e) {
    return res.status(500).json({ error: "Error al procesar la solicitud." });
  }
};

// POST reset password — usa el token enviado por email en /recover
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token y nueva contraseña requeridos." });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ error: "La contraseña debe tener al menos 6 caracteres." });
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(400).json({ error: "El enlace es inválido o expiró." });
    }

    const user = await UserModel.findById(decoded.userId).select("+password");
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    return res.status(200).json({ status: "success", message: "Contraseña restablecida." });
  } catch (e) {
    return res.status(500).json({ error: "Error al restablecer la contraseña." });
  }
};

// POST create user
export const createUser = async (req, res) => {
  try {
    const { name, lastname, email, password } = req.body;

    if (!name || !lastname || !email || !password) {
      return res.status(400).json({ error: "Todos los campos son requeridos." });
    }

    const existing = await UserModel.findOne({ email });
    if (existing) {
      return res.status(400).json({ error: "Ya existe un usuario con ese email." });
    }

    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const image = `https://ui-avatars.com/api/?background=random&name=${encodeURIComponent(name)}+${encodeURIComponent(lastname)}`;

    const newUser = await UserModel.create({
      name,
      lastname,
      email,
      password: hashedPassword,
      image,
    });

    try {
      const verifyToken = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, { expiresIn: "7d" });
      const verifyLink = `${process.env.FRONTEND_URL || ""}/verify?token=${verifyToken}`;
      const transporter = createTransporter();
      await transporter.sendMail({
        from: config.email,
        to: email,
        subject: "Bienvenido a Marketplace — verificá tu email",
        text: `¡Bienvenido ${name}!\n\nTu registro fue exitoso.\nVerificá tu email haciendo clic acá (válido 7 días):\n${verifyLink}\n\nEste es un correo autogenerado, no respondas.`,
      });
    } catch (mailErr) {
      console.error("Error enviando email de bienvenida:", mailErr.message);
    }

    return res.status(201).json({
      status: "success",
      message: "Usuario creado exitosamente.",
      data: newUser,
    });
  } catch (e) {
    return res.status(500).json({ error: "Error al crear el usuario." });
  }
};

// POST login user
export const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email y contraseña requeridos." });
    }

    // Se usa +password porque el campo tiene select: false
    const user = await UserModel.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: "Credenciales incorrectas." });
    }

    const token = signJWT(user.email, user._id);
    return res.status(200).json({ _id: user._id.toString(), token });
  } catch (e) {
    return res.status(500).json({ error: "Error al iniciar sesión." });
  }
};

// DELETE user by id
export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await UserModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ error: "Usuario no encontrado." });
    return res.status(200).json({ status: "success", message: "Usuario eliminado." });
  } catch (e) {
    return res.status(500).json({ error: "Error al eliminar el usuario." });
  }
};

// PUT update user by id
export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Solo el propio usuario puede editar su perfil
    if (req.user.userId.toString() !== id) {
      return res.status(403).json({ error: "No tenés permiso para editar este perfil." });
    }

    const updates = req.body;

    // No permitir cambiar password ni campos sensibles por esta ruta
    delete updates.password;
    delete updates.products;
    delete updates.chats;

    if (updates.email) {
      const existing = await UserModel.findOne({ email: updates.email, _id: { $ne: id } });
      if (existing) {
        return res.status(400).json({ error: "Ese email ya está en uso." });
      }
    }

    const updated = await UserModel.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    });
    if (!updated) return res.status(404).json({ error: "Usuario no encontrado." });
    return res.status(200).json({ status: "success", data: updated });
  } catch (e) {
    return res.status(500).json({ error: "Error al actualizar el usuario." });
  }
};

// PUT change password — verifica la contraseña actual
export const changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;

    if (req.user.userId.toString() !== id) {
      return res.status(403).json({ error: "No tenés permiso para esta acción." });
    }

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: "Contraseña actual y nueva requeridas." });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "La nueva contraseña debe tener al menos 6 caracteres." });
    }

    const user = await UserModel.findById(id).select("+password");
    if (!user) return res.status(404).json({ error: "Usuario no encontrado." });

    const match = await bcrypt.compare(currentPassword, user.password);
    if (!match) {
      return res.status(400).json({ error: "La contraseña actual es incorrecta." });
    }

    user.password = await bcrypt.hash(newPassword, SALT_ROUNDS);
    await user.save();

    return res.status(200).json({ status: "success", message: "Contraseña actualizada." });
  } catch (e) {
    return res.status(500).json({ error: "Error al cambiar la contraseña." });
  }
};
