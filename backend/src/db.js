import mongoose from "mongoose";
import { config } from "./config.js";

const URI = `mongodb+srv://${config.api_user}:${config.api_password}@coderback.vqrxnc2.mongodb.net/?retryWrites=true&w=majority&appName=Coderback`;

// Tras este tiempo sin actividad (HTTP o sockets) cerramos la conexión a Mongo
// para que Railway deje de ver tráfico y pueda dormir la app.
const IDLE_MS = 5 * 60 * 1000;

let idleTimer = null;
let connectingPromise = null;
// Permite que la desconexión por idle respete chats activos (sockets abiertos).
let getActiveSockets = () => 0;

export const setActiveSocketsGetter = (fn) => {
  getActiveSockets = fn;
};

// Conecta a Mongo si no está conectado. Reusa la promesa si hay una conexión en curso.
export const ensureDB = async () => {
  if (mongoose.connection.readyState === 1) return; // ya conectado
  if (!connectingPromise) {
    connectingPromise = mongoose
      .connect(URI, { dbName: "Marketplace" })
      .then(() => console.log("DB conectada"))
      .catch((err) => {
        connectingPromise = null;
        console.error("Error conectando a la base de datos:", err.message);
        throw err;
      });
  }
  await connectingPromise;
};

const disconnectIfIdle = async () => {
  // Si todavía hay un chat abierto, reprogramamos en vez de cortar.
  if (getActiveSockets() > 0) {
    touchActivity();
    return;
  }
  try {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      connectingPromise = null;
      console.log("DB desconectada por inactividad");
    }
  } catch (err) {
    console.error("Error al desconectar la base de datos:", err.message);
  }
};

// Marca actividad: reinicia el contador de inactividad.
export const touchActivity = () => {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(disconnectIfIdle, IDLE_MS);
  if (idleTimer.unref) idleTimer.unref(); // no mantener vivo el proceso solo por este timer
};
