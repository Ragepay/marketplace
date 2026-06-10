// Elimina productos sin dueño o cuyo dueño ya no existe.
// Por seguridad SOLO SIMULA por defecto. Para borrar de verdad pasá --apply.
//   node scripts/delete-orphans.mjs          -> simula (no borra nada)
//   node scripts/delete-orphans.mjs --apply  -> borra
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

const apply = process.argv.includes("--apply");
const { API_USER, API_PASSWORD } = process.env;

await mongoose.connect(
  `mongodb+srv://${API_USER}:${API_PASSWORD}@coderback.vqrxnc2.mongodb.net/?retryWrites=true&w=majority&appName=Coderback`,
  { dbName: "Marketplace" }
);

const Product = mongoose.connection.collection("products");
const User = mongoose.connection.collection("users");

// IDs de usuarios existentes
const users = await User.find({}).project({ _id: 1 }).toArray();
const validIds = new Set(users.map((u) => u._id.toString()));

// Buscar productos huérfanos: sin ownerId o con ownerId que ya no existe
const all = await Product.find({}).project({ title: 1, ownerId: 1 }).toArray();
const orphans = all.filter(
  (p) => !p.ownerId || !validIds.has(p.ownerId.toString())
);

console.log(`Total productos: ${all.length}`);
console.log(`A eliminar (sin dueño o dueño inexistente): ${orphans.length}`);
console.log(
  "Detalle:",
  JSON.stringify(
    orphans.map((p) => ({ id: p._id, title: p.title, ownerId: p.ownerId || null })),
    null,
    2
  )
);

if (!apply) {
  console.log("\n[SIMULACIÓN] No se borró nada. Volvé a correr con --apply para eliminar.");
} else {
  const ids = orphans.map((p) => p._id);
  const result = await Product.deleteMany({ _id: { $in: ids } });
  console.log(`\nEliminados: ${result.deletedCount}`);

  // Limpiar referencias colgantes en el array products de cualquier usuario
  await User.updateMany(
    { products: { $in: ids } },
    { $pull: { products: { $in: ids } } }
  );
  console.log("Referencias en users.products limpiadas.");
}

await mongoose.disconnect();
