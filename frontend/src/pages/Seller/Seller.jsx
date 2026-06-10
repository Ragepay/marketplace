import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import toast from "react-hot-toast";
import NavBar from "../../components/Navbar";
import Footer from "../../components/Footer";
import Cards from "../../components/cards/cards";
import "./seller.styles.css";

// eslint-disable-next-line react/prop-types
const Stars = ({ value }) => {
  const full = Math.round(value);
  return (
    <span className="stars" aria-label={`${value} de 5`}>
      {"★".repeat(full)}
      {"☆".repeat(5 - full)}
    </span>
  );
};

export const Seller = () => {
  const { id } = useParams();
  const BACKEND = import.meta.env.VITE_URL_BACKEND;
  const myId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");

  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [avg, setAvg] = useState(0);
  const [count, setCount] = useState(0);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const loadReviews = () => {
    fetch(`${BACKEND}/api/reviews/user/${id}`)
      .then((res) => res.json())
      .then((data) => {
        setReviews(data.reviews || []);
        setAvg(data.avg || 0);
        setCount(data.count || 0);
      })
      .catch(() => {});
  };

  useEffect(() => {
    fetch(`${BACKEND}/api/users/${id}/public`)
      .then((res) => {
        if (!res.ok) throw new Error("No se pudo cargar el perfil del vendedor.");
        return res.json();
      })
      .then(setUser)
      .catch((err) => setError(err.message));
    loadReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const submitReview = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${BACKEND}/api/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toUser: id, rating, comment }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al enviar la reseña.");
      toast.success("¡Gracias por tu reseña!");
      setComment("");
      loadReviews();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const name = user ? `${user.name} ${user.lastname || ""}`.trim() : "";
  const avatar = user && (Array.isArray(user.image) ? user.image[0] : user.image);
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("es-AR", { year: "numeric", month: "long" })
    : null;
  const canReview = token && myId && myId !== id;

  return (
    <>
      <NavBar />
      <div className="seller-page">
        {error && <p className="seller-error">{error}</p>}
        {user && (
          <>
            <div className="seller-head">
              <img
                className="seller-avatar"
                src={avatar || `https://ui-avatars.com/api/?background=7C5DFA&color=fff&name=${encodeURIComponent(name)}`}
                alt={name}
              />
              <div>
                <h1 className="seller-name">{name}</h1>
                {memberSince && <p className="seller-since">Miembro desde {memberSince}</p>}
                <p className="seller-rating">
                  <Stars value={avg} /> {avg > 0 ? `${avg} (${count})` : "Sin reseñas"}
                </p>
                <p className="seller-count">{user.products?.length || 0} publicaciones activas</p>
              </div>
            </div>

            {canReview && (
              <form className="review-form" onSubmit={submitReview}>
                <h3>Dejá tu reseña</h3>
                <div className="review-row">
                  <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
                    {[5, 4, 3, 2, 1].map((n) => (
                      <option key={n} value={n}>{n} ★</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Contá tu experiencia (opcional)"
                    maxLength={500}
                  />
                  <button type="submit">Enviar</button>
                </div>
              </form>
            )}

            {reviews.length > 0 && (
              <div className="review-list">
                {reviews.map((r) => (
                  <div key={r._id} className="review-item">
                    <div className="review-item-head">
                      <strong>{r.fromUser?.name || "Usuario"}</strong>
                      <Stars value={r.rating} />
                    </div>
                    {r.comment && <p>{r.comment}</p>}
                  </div>
                ))}
              </div>
            )}

            <h2 className="seller-section-title">Publicaciones</h2>
            {user.products?.length > 0 ? (
              <Cards allProducts={user.products} />
            ) : (
              <p className="seller-empty">Este vendedor no tiene publicaciones activas.</p>
            )}
          </>
        )}
      </div>
      <Footer />
    </>
  );
};
