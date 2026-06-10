import mongoose from "mongoose";

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  lastname: { type: String, required: true, trim: true },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, "Email inválido"],
  },
  password: { type: String, required: true, select: false },
  image: [{ type: String }],
  products: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Chat" }],
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Product" }],
  emailVerified: { type: Boolean, default: false },
  isAdmin: { type: Boolean, default: false },
}, { timestamps: true });

userSchema.set("toJSON", {
  transform: (_, obj) => {
    delete obj.password;
    return obj;
  },
});

export const UserModel = mongoose.model("User", userSchema, "users");
