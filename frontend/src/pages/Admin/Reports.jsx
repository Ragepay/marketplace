import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import NavBar from "../../components/Navbar";
import "./reports.styles.css";

export const AdminReports = () => {
  const BACKEND = import.meta.env.VITE_URL_BACKEND;
  const token = localStorage.getItem("token");
  const [reports, setReports] = useState([]);
  const [state, setState] = useState("loading"); // loading | ok | forbidden | error

  const load = () => {
    fetch(`${BACKEND}/api/reports`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 403) return setState("forbidden");
        if (!res.ok) throw new Error();
        const data = await res.json();
        setReports(data);
        setState("ok");
      })
      .catch(() => setState("error"));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const resolve = async (id) => {
    try {
      const res = await fetch(`${BACKEND}/api/reports/${id}/resolve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo resolver.");
      setReports((prev) => prev.map((r) => (r._id === id ? { ...r, status: "resolved" } : r)));
      toast.success("Reporte resuelto.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const deletePublication = async (report) => {
    const productId = report.productId?._id;
    if (!productId) return;
    if (!window.confirm("¿Eliminar la publicación reportada? No se puede deshacer.")) return;
    try {
      const res = await fetch(`${BACKEND}/api/products/${productId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo eliminar la publicación.");
      // marcar el reporte resuelto y reflejar que el producto ya no existe
      await fetch(`${BACKEND}/api/reports/${report._id}/resolve`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports((prev) =>
        prev.map((r) =>
          r._id === report._id ? { ...r, status: "resolved", productId: null } : r
        )
      );
      toast.success("Publicación eliminada y reporte resuelto.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <>
      <NavBar />
      <div className="admin-page">
        <h1 className="admin-title">Moderación — Reportes</h1>

        {state === "loading" && <p className="admin-muted">Cargando...</p>}
        {state === "forbidden" && <p className="admin-muted">Acceso solo para administradores.</p>}
        {state === "error" && <p className="admin-muted">Error al cargar reportes.</p>}

        {state === "ok" && reports.length === 0 && (
          <p className="admin-muted">No hay reportes.</p>
        )}

        {state === "ok" && reports.length > 0 && (
          <div className="admin-list">
            {reports.map((r) => (
              <div key={r._id} className={`admin-report ${r.status}`}>
                <div className="admin-report-info">
                  <Link to={`/home/${r.productId?._id}`} className="admin-report-title">
                    {r.productId?.title || "Producto eliminado"}
                  </Link>
                  <p className="admin-report-reason">{r.reason}</p>
                  <span className="admin-report-meta">
                    por {r.byUser?.name || "—"} · {r.status === "open" ? "Abierto" : "Resuelto"}
                  </span>
                </div>
                <div className="admin-report-actions">
                  {r.productId?._id && (
                    <button className="admin-delete" onClick={() => deletePublication(r)}>
                      Eliminar publicación
                    </button>
                  )}
                  {r.status === "open" && (
                    <button className="admin-resolve" onClick={() => resolve(r._id)}>
                      Marcar resuelto
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};
