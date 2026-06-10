// Reporte de SOLO LECTURA: productos sin dueño + lista de usuarios.
// No modifica nada.
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

const { API_USER, API_PASSWORD } = process.env;

await mongoose.connect(
  `mongodb+srv://${API_USER}:${API_PASSWORD}@coderback.vqrxnc2.mongodb.net/?retryWrites=true&w=majority&appName=Coderback`,
  { dbName: "Marketplace" }
);

const Product = mongoose.connection.collection("products");
const User = mongoose.connection.collection("users");

const total = await Product.countDocuments({});
const sinOwner = await Product.countDocuments({
  $or: [{ ownerId: { $exists: false } }, { ownerId: null }],
});

console.log("=== PRODUCTOS ===");
console.log(JSON.stringify({ total, conOwner: total - sinOwner, sinOwner }, null, 2));

const muestraOrphans = await Product.find({
  $or: [{ ownerId: { $exists: false } }, { ownerId: null }],
})
  .limit(5)
  .project({ title: 1 })
  .toArray();
console.log("Muestra sin dueño:", JSON.stringify(muestraOrphans, null, 2));

console.log("\n=== USUARIOS ===");
const users = await User.find({})
  .project({ name: 1, lastname: 1, email: 1 })
  .toArray();
console.log(JSON.stringify(users, null, 2));

await mongoose.disconnect();
