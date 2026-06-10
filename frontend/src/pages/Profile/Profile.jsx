import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import NavBar from "../../components/Navbar";
import { FiUser, FiLock } from "react-icons/fi";
import "./profile.styles.css";

export const Profile = () => {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const BACKEND = import.meta.env.VITE_URL_BACKEND;

  const [form, setForm] = useState({ name: "", lastname: "", email: "" });
  const [avatar, setAvatar] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);

  const [pwd, setPwd] = useState({ currentPassword: "", newPassword: "", confirm: "" });
  const [savingPwd, setSavingPwd] = useState(false);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const res = await fetch(`${BACKEND}/api/users/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error();
        const data = await res.json();
        setForm({
          name: data.name || "",
          lastname: data.lastname || "",
          email: data.email || "",
        });
        setAvatar(Array.isArray(data.image) ? data.image[0] : data.image);
      } catch {
        toast.error("No se pudo cargar el perfil.");
      }
    };
    if (userId && token) loadUser();
  }, [userId, token, BACKEND]);

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await fetch(`${BACKEND}/api/users/${userId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al guardar.");
      toast.success("Perfil actualizado.");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePwdSubmit = async (e) => {
    e.preventDefault();
    if (pwd.newPassword !== pwd.confirm) {
      toast.error("Las contraseñas nuevas no coinciden.");
      return;
    }
    setSavingPwd(true);
    try {
      const res = await fetch(`${BACKEND}/api/users/${userId}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: pwd.currentPassword,
          newPassword: pwd.newPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al cambiar la contraseña.");
      toast.success("Contraseña actualizada.");
      setPwd({ currentPassword: "", newPassword: "", confirm: "" });
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSavingPwd(false);
    }
  };

  const displayName = `${form.name} ${form.lastname}`.trim() || "Mi perfil";

  return (
    <>
      <NavBar />
      <div className="profile-page">
        <div className="profile-head">
          <img
            className="profile-avatar"
            src={
              avatar ||
              `https://ui-avatars.com/api/?background=7C5DFA&color=fff&name=${encodeURIComponent(displayName)}`
            }
            alt={displayName}
          />
          <div>
            <h1 className="profile-name">{displayName}</h1>
            <p className="profile-email">{form.email}</p>
          </div>
        </div>

        <div className="profile-grid">
          <form className="profile-card" onSubmit={handleProfileSubmit}>
            <h2 className="profile-card-title"><FiUser /> Datos personales</h2>

            <label className="field-label">
              Nombre
              <input
                className="field-input"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                required
              />
            </label>
            <label className="field-label">
              Apellido
              <input
                className="field-input"
                value={form.lastname}
                onChange={(e) => setForm({ ...form, lastname: e.target.value })}
                required
              />
            </label>
            <label className="field-label">
              Email
              <input
                className="field-input"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>

            <button className="btn-primary" type="submit" disabled={savingProfile}>
              {savingProfile ? "Guardando..." : "Guardar cambios"}
            </button>
          </form>

          <form className="profile-card" onSubmit={handlePwdSubmit}>
            <h2 className="profile-card-title"><FiLock /> Cambiar contraseña</h2>

            <label className="field-label">
              Contraseña actual
              <input
                className="field-input"
                type="password"
                value={pwd.currentPassword}
                onChange={(e) => setPwd({ ...pwd, currentPassword: e.target.value })}
                required
              />
            </label>
            <label className="field-label">
              Nueva contraseña
              <input
                className="field-input"
                type="password"
                value={pwd.newPassword}
                onChange={(e) => setPwd({ ...pwd, newPassword: e.target.value })}
                minLength={6}
                required
              />
            </label>
            <label className="field-label">
              Repetir nueva contraseña
              <input
                className="field-input"
                type="password"
                value={pwd.confirm}
                onChange={(e) => setPwd({ ...pwd, confirm: e.target.value })}
                minLength={6}
                required
              />
            </label>

            <button className="btn-primary" type="submit" disabled={savingPwd}>
              {savingPwd ? "Actualizando..." : "Actualizar contraseña"}
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
