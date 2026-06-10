// Promueve un usuario a administrador por email.
//   node scripts/make-admin.mjs benjapey99@gmail.com
import dotenv from "dotenv";
import mongoose from "mongoose";
dotenv.config();

const email = process.argv[2];
if (!email) {
  console.error("Uso: node scripts/make-admin.mjs email@dominio.com");
  process.exit(1);
}

const { API_USER, API_PASSWORD } = process.env;
await mongoose.connect(
  `mongodb+srv://${API_USER}:${API_PASSWORD}@coderback.vqrxnc2.mongodb.net/?retryWrites=true&w=majority&appName=Coderback`,
  { dbName: "Marketplace" }
);

const User = mongoose.connection.collection("users");
const result = await User.updateOne({ email: email.toLowerCase().trim() }, { $set: { isAdmin: true } });
console.log(result.matchedCount ? `Listo: ${email} ahora es admin.` : `No se encontró ${email}.`);

await mongoose.disconnect();
