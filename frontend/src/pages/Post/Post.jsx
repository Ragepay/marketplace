import { useEffect, useState } from "react";
import NavBar from "../../components/Navbar";
import "./post.styles.css";
import { FaEye, FaPen, FaTimes } from "react-icons/fa";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";

const PLACEHOLDER = "https://via.placeholder.com/80";

export const Post = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      setLoading(false);
      return;
    }

    fetch(import.meta.env.VITE_URL_BACKEND + "/api/products/posts", {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })
      .then((res) => {
        if (!res.ok) throw new Error(`Error ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (data.status === "success") setProducts(data.payload);
        else throw new Error(data.error || "Error al cargar productos");
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (productId) => {
    if (!window.confirm("¿Estás seguro de que querés eliminar este producto?")) return;

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(
        `${import.meta.env.VITE_URL_BACKEND}/api/products/${productId}`,
        {
          method: "DELETE",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) throw new Error(`Error al eliminar: ${response.status}`);

      setProducts((prev) => prev.filter((p) => p._id !== productId));
      toast.success("Producto eliminado.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const handleStatusChange = async (productId, status) => {
    const token = localStorage.getItem("token");
    try {
      const res = await fetch(
        `${import.meta.env.VITE_URL_BACKEND}/api/products/${productId}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ status }),
        }
      );
      if (!res.ok) throw new Error("No se pudo cambiar el estado.");
      setProducts((prev) =>
        prev.map((p) => (p._id === productId ? { ...p, status } : p))
      );
      toast.success("Estado actualizado.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const formatDate = (dateString) => {
    const d = new Date(dateString);
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}/${pad(d.getMonth() + 1)}/${pad(d.getDate())} - ${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  const token = localStorage.getItem("token");

  return (
    <div>
      <NavBar />
      <div className="main-container">
        <div className="cards-container">
          {loading && <p>Cargando publicaciones...</p>}

          {error && <p className="post-error">Error: {error}</p>}

          {!loading && !error && !token && (
            <p>Debés iniciar sesión para ver tus publicaciones.</p>
          )}

          {!loading && !error && token && products.length === 0 && (
            <p>Todavía no tenés productos publicados.</p>
          )}

          {products.map((product) => (
            <div key={product._id} className="post-card">
              <div className="post-image-container">
                <img
                  src={product.productImage?.[0]?.secure_url || PLACEHOLDER}
                  alt={product.title}
                />
              </div>
              <div className="title-container">
                <Link to={`/home/${product._id}`}>
                  <p className="post-title">{product.title}</p>
                </Link>
                <label>{product.createdAt ? formatDate(product.createdAt) : ""}</label>
              </div>
              <div className="icons-container">
                <select
                  className="post-status"
                  value={product.status || "available"}
                  onChange={(e) => handleStatusChange(product._id, e.target.value)}
                >
                  <option value="available">Disponible</option>
                  <option value="reserved">Reservado</option>
                  <option value="sold">Vendido</option>
                </select>
                <Link to={`/home/${product._id}`}>
                  <FaEye className="icon" />
                </Link>
                <Link to={`/edit/${product._id}`}>
                  <FaPen className="icon" />
                </Link>
                <FaTimes className="icon delete" onClick={() => handleDelete(product._id)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
