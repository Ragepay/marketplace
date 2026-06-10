import { ReviewModel } from "../models/review.model.js";

// GET reseñas de un vendedor + promedio
export const getReviewsForUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const reviews = await ReviewModel.find({ toUser: userId })
      .populate("fromUser", "name lastname image")
      .sort({ createdAt: -1 });
    const count = reviews.length;
    const avg = count
      ? reviews.reduce((acc, r) => acc + r.rating, 0) / count
      : 0;
    return res.status(200).json({ reviews, count, avg: Math.round(avg * 10) / 10 });
  } catch (e) {
    return res.status(500).json({ error: "Error al obtener reseñas." });
  }
};

// POST crear/actualizar reseña a un vendedor
export const createReview = async (req, res) => {
  try {
    const { userId } = req.user;
    const { toUser, rating, comment } = req.body;

    if (!toUser || !rating) {
      return res.status(400).json({ error: "Vendedor y puntaje requeridos." });
    }
    if (toUser.toString() === userId.toString()) {
      return res.status(400).json({ error: "No podés reseñarte a vos mismo." });
    }
    if (rating < 1 || rating > 5) {
      return res.status(400).json({ error: "El puntaje debe ser entre 1 y 5." });
    }

    // upsert: si ya reseñó a ese vendedor, actualiza
    const review = await ReviewModel.findOneAndUpdate(
      { fromUser: userId, toUser },
      { rating, comment: comment || "" },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return res.status(201).json({ status: "success", data: review });
  } catch (e) {
    return res.status(500).json({ error: "Error al crear la reseña." });
  }
};
