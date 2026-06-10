import jwt from "jsonwebtoken";

const auth = (req, res, next) => {
  const authHeader = req.header("Authorization");

  if (!authHeader) {
    return res.status(401).json({ message: "Acceso denegado. No se proporcionó token." });
  }

  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    return res.status(401).json({ message: "Acceso denegado. No se proporcionó token." });
  }

  try {
    const verified = jwt.verify(token, process.env.JWT_SECRET);
    req.user = verified;
    next();
  } catch (error) {
    if (error.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expirado. Inicie sesión nuevamente." });
    }
    return res.status(400).json({ message: "Token inválido." });
  }
};

export default auth;

export const optionalAuth = (req, res, next) => {
  const authHeader = req.header("Authorization");
  if (!authHeader) return next();

  const token = authHeader.replace("Bearer ", "");
  if (!token) return next();

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
  } catch (_) {
    // Token inválido o expirado — continuar sin user
  }
  next();
};
