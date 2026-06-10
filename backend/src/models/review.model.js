import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    fromUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    toUser: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, default: "", maxlength: 500 },
  },
  { timestamps: true }
);

// Un usuario solo puede dejar una reseña por vendedor
reviewSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

export const ReviewModel = mongoose.model("Review", reviewSchema, "reviews");
