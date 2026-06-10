import { ReportModel } from "../models/report.model.js";
import { UserModel } from "../models/user.model.js";

const isAdmin = async (userId) => {
  const u = await UserModel.findById(userId).select("isAdmin");
  return !!u?.isAdmin;
};

// POST crear reporte
export const createReport = async (req, res) => {
  try {
    const { userId } = req.user;
    const { productId, reason } = req.body;
    if (!productId || !reason?.trim()) {
      return res.status(400).json({ error: "Producto y motivo requeridos." });
    }
    await ReportModel.create({ productId, byUser: userId, reason: reason.trim() });
    return res.status(201).json({ status: "success", message: "Reporte enviado." });
  } catch (e) {
    return res.status(500).json({ error: "Error al crear el reporte." });
  }
};

// GET listar reportes (solo admin)
export const getReports = async (req, res) => {
  try {
    if (!(await isAdmin(req.user.userId))) {
      return res.status(403).json({ error: "Acceso solo para administradores." });
    }
    const reports = await ReportModel.find({})
      .populate("productId", "title")
      .populate("byUser", "name lastname")
      .sort({ createdAt: -1 });
    return res.status(200).json(reports);
  } catch (e) {
    return res.status(500).json({ error: "Error al obtener reportes." });
  }
};

// PATCH resolver reporte (solo admin)
export const resolveReport = async (req, res) => {
  try {
    if (!(await isAdmin(req.user.userId))) {
      return res.status(403).json({ error: "Acceso solo para administradores." });
    }
    const { id } = req.params;
    const report = await ReportModel.findByIdAndUpdate(id, { status: "resolved" }, { new: true });
    if (!report) return res.status(404).json({ error: "Reporte no encontrado." });
    return res.status(200).json({ status: "success", data: report });
  } catch (e) {
    return res.status(500).json({ error: "Error al resolver el reporte." });
  }
};
