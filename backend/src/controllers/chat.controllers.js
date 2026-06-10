import mongoose from "mongoose";
import { ChatModel } from "../models/chat.model.js";
import { UserModel } from "../models/user.model.js";

export const getAllChats = async (req, res) => {
  try {
    const { userId } = req.user;
    // Solo devuelve los chats del usuario autenticado, con datos de los participantes
    const chats = await ChatModel.find({ users: userId })
      .populate("users", "name lastname image")
      .sort({ updatedAt: -1 });
    return res.status(200).json({ chats });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Error al obtener los chats." });
  }
};

export const getUnreadCount = async (req, res) => {
  try {
    const { userId } = req.user;
    const chats = await ChatModel.find({ users: userId }).select("messages");
    let count = 0;
    chats.forEach((chat) => {
      chat.messages.forEach((m) => {
        if (m.emisor.toString() !== userId.toString() && !m.read) count++;
      });
    });
    return res.status(200).json({ count });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Error al obtener no leídos." });
  }
};

export const getChatById = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const chat = await ChatModel.findById(id).populate("users", "name lastname image");
    if (!chat) {
      return res.status(404).json({ status: "error", message: "Chat no encontrado." });
    }

    // Verificar que el usuario pertenece al chat
    const isMember = chat.users.some((u) => u._id.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ status: "error", message: "No tienes acceso a este chat." });
    }

    // Marcar como leídos los mensajes recibidos (de la otra persona)
    let changed = false;
    chat.messages.forEach((m) => {
      if (m.emisor.toString() !== userId.toString() && !m.read) {
        m.read = true;
        changed = true;
      }
    });
    if (changed) await chat.save();

    return res.status(200).json({ chat });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Error al obtener el chat." });
  }
};

export const findChatByUsers = async (userId, productOwnerId) => {
  try {
    return await ChatModel.findOne({
      users: { $all: [userId, productOwnerId] },
    }).lean();
  } catch (error) {
    throw error;
  }
};

export const createNewChat = async (req, res) => {
  try {
    const { userId } = req.user;
    const { ownerId } = req.body;

    if (!ownerId || !mongoose.Types.ObjectId.isValid(ownerId)) {
      return res.status(400).json({ error: "ID del destinatario inválido." });
    }

    if (userId.toString() === ownerId.toString()) {
      return res.status(400).json({ error: "No puedes crear un chat contigo mismo." });
    }

    // Verificar que no existe ya un chat entre estos usuarios
    const existingChat = await ChatModel.findOne({
      users: { $all: [userId, ownerId] },
    });
    if (existingChat) {
      return res.status(200).json({ status: "success", chat: existingChat });
    }

    const newChat = await ChatModel.create({ users: [userId, ownerId], messages: [] });

    await addChat(userId, newChat._id);
    await addChat(ownerId, newChat._id);

    return res.status(201).json({ status: "success", chat: newChat });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Error al crear el chat." });
  }
};

export const addMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const { contenido } = req.body;
    const { userId } = req.user;

    if (!contenido?.trim()) {
      return res.status(400).json({ status: "error", message: "El mensaje no puede estar vacío." });
    }

    if (contenido.length > 1000) {
      return res.status(400).json({ status: "error", message: "El mensaje excede el límite de 1000 caracteres." });
    }

    const chat = await ChatModel.findById(id);
    if (!chat) {
      return res.status(404).json({ status: "error", message: "Chat no encontrado." });
    }

    // Verificar que el usuario pertenece al chat
    const isMember = chat.users.some((u) => u.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ status: "error", message: "No tienes acceso a este chat." });
    }

    chat.messages.push({ emisor: userId, contenido: contenido.trim() });
    const saved = await chat.save();

    // Emitir el último mensaje en tiempo real a la sala del chat
    const lastMessage = saved.messages[saved.messages.length - 1];
    const io = req.app.get("io");
    if (io) io.to(id).emit("new-message", { chatId: id, message: lastMessage });

    return res.status(200).json({ message: saved });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Error al enviar el mensaje." });
  }
};

export const deleteChat = async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;

    const chat = await ChatModel.findById(id);
    if (!chat) {
      return res.status(404).json({ status: "error", message: "Chat no encontrado." });
    }

    const isMember = chat.users.some((u) => u.toString() === userId.toString());
    if (!isMember) {
      return res.status(403).json({ status: "error", message: "No tienes permiso para eliminar este chat." });
    }

    await ChatModel.findByIdAndDelete(id);

    return res.status(200).json({ status: "success", message: "Chat eliminado." });
  } catch (error) {
    return res.status(500).json({ status: "error", message: "Error al eliminar el chat." });
  }
};

const addChat = async (userId, chatId) => {
  try {
    const user = await UserModel.findById(userId);
    if (!user) return;

    // Fix: verificar en user.chats (no user.products como estaba antes)
    const chatExists = user.chats.some((c) => c._id.toString() === chatId.toString());
    if (!chatExists) {
      user.chats.push(chatId);
      await user.save();
    }
  } catch (error) {
    console.error("Error al vincular chat al usuario:", error.message);
  }
};
