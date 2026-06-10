// Asigna un dueño (por email) a todos los productos que NO tienen ownerId.
// Uso:  node scripts/assign-orphans.mjs vendedor@email.com
// Agregá --dry para ver cuántos cambiaría sin modificar nada.
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

const email = process.argv[2];
const dryRun = process.argv.includes("--dry");

if (!email) {
  console.error("Falta el email. Uso: node scripts/assign-orphans.mjs vendedor@email.com [--dry]");
  process.exit(1);
}

const { API_USER, API_PASSWORD } = process.env;

await mongoose.connect(
  `mongodb+srv://${API_USER}:${API_PASSWORD}@coderback.vqrxnc2.mongodb.net/?retryWrites=true&w=majority&appName=Coderback`,
  { dbName: "Marketplace" }
);

const Product = mongoose.connection.collection("products");
const User = mongoose.connection.collection("users");

const user = await User.findOne({ email: email.toLowerCase().trim() });
if (!user) {
  console.error(`No existe un usuario con email ${email}.`);
  await mongoose.disconnect();
  process.exit(1);
}

const filter = { $or: [{ ownerId: { $exists: false } }, { ownerId: null }] };
const count = await Product.countDocuments(filter);

console.log(`Productos sin dueño: ${count}`);
console.log(`Dueño a asignar: ${user.name} ${user.lastname} (${user._id})`);

if (dryRun) {
  console.log("--dry: no se modificó nada.");
} else {
  const result = await Product.updateMany(filter, { $set: { ownerId: user._id } });
  console.log(`Actualizados: ${result.modifiedCount}`);

  // Mantener consistente el array products del usuario
  const ids = await Product.find({ ownerId: user._id }).project({ _id: 1 }).toArray();
  await User.updateOne(
    { _id: user._id },
    { $set: { products: ids.map((p) => p._id) } }
  );
  console.log("Listo: array 'products' del usuario sincronizado.");
}

await mongoose.disconnect();
