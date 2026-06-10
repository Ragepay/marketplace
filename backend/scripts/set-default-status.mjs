// Setea status="available" a los productos que no tengan el campo. Idempotente.
//   node scripts/set-default-status.mjs
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

const { API_USER, API_PASSWORD } = process.env;

await mongoose.connect(
  `mongodb+srv://${API_USER}:${API_PASSWORD}@coderback.vqrxnc2.mongodb.net/?retryWrites=true&w=majority&appName=Coderback`,
  { dbName: "Marketplace" }
);

const Product = mongoose.connection.collection("products");
const result = await Product.updateMany(
  { status: { $exists: false } },
  { $set: { status: "available" } }
);
console.log(`Productos actualizados con status=available: ${result.modifiedCount}`);

await mongoose.disconnect();
