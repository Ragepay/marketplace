import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
import "../Landing/landing.styles.css";

export const Recover = () => {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get("token");
  const navigate = useNavigate();

  // Si viene token en la URL, mostramos el form de nueva contraseña
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const BACKEND = import.meta.env.VITE_URL_BACKEND;

  const handleRequest = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/users/recover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      toast.success(data.message || "Si el email existe, recibirás instrucciones.");
    } catch {
      toast.error("Error al enviar la solicitud.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      toast.error("Las contraseñas no coinciden.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${BACKEND}/api/users/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenFromUrl, newPassword: password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo restablecer.");
      toast.success("Contraseña restablecida. Iniciá sesión.");
      setTimeout(() => navigate("/"), 1500);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-brand">Pop<span>Mart</span></h1>

        {tokenFromUrl ? (
          <>
            <p className="login-subtitle">Ingresá tu nueva contraseña</p>
            <form className="login-form" onSubmit={handleReset}>
              <input
                type="password"
                placeholder="Nueva contraseña"
                className="login-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
              <input
                type="password"
                placeholder="Repetir contraseña"
                className="login-input"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={6}
                required
              />
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Guardando..." : "Restablecer contraseña"}
              </button>
            </form>
          </>
        ) : (
          <>
            <p className="login-subtitle">
              Te enviaremos un enlace para restablecer tu contraseña
            </p>
            <form className="login-form" onSubmit={handleRequest}>
              <input
                type="email"
                placeholder="Correo electrónico"
                className="login-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <button type="submit" className="login-button" disabled={loading}>
                {loading ? "Enviando..." : "Enviar enlace"}
              </button>
            </form>
          </>
        )}

        <div className="login-footer">
          <a onClick={() => navigate("/")} className="create-account">
            Volver al inicio de sesión
          </a>
        </div>
      </div>
    </div>
  );
};
