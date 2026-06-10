import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import "../Landing/landing.styles.css";

export const Verify = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [state, setState] = useState("loading"); // loading | ok | error
  const [message, setMessage] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setState("error");
      setMessage("Falta el token de verificación.");
      return;
    }
    fetch(`${import.meta.env.VITE_URL_BACKEND}/api/users/verify?token=${token}`)
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Error al verificar.");
        setState("ok");
        setMessage(data.message || "Email verificado.");
      })
      .catch((err) => {
        setState("error");
        setMessage(err.message);
      });
  }, [params]);

  return (
    <div className="login-page">
      <div className="login-container">
        <h1 className="login-brand">Pop<span>Mart</span></h1>
        <p className="login-subtitle">
          {state === "loading" && "Verificando tu email..."}
          {state === "ok" && `✅ ${message}`}
          {state === "error" && `⚠️ ${message}`}
        </p>
        {state !== "loading" && (
          <button className="login-button" onClick={() => navigate("/")}>
            Ir a iniciar sesión
          </button>
        )}
      </div>
    </div>
  );
};
