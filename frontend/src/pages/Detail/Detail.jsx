import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import "./Detail.styles.css";
import NavBar from "../../components/Navbar";
import Carousel from "../../components/Carousel/Carousel.jsx";
import { CartContext } from "../../context/CartContext";
import { useMeta } from "../../hooks/useMeta";
import toast from "react-hot-toast";

const PLACEHOLDER = "https://via.placeholder.com/150";

export const Detail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const [imgIndex, setImgIndex] = useState(0);

  const token = localStorage.getItem("token");
  const userId = localStorage.getItem("userId");
  const isGuest = !token;

  const { addItemToCart } = useContext(CartContext);

  useMeta({
    title: product?.title,
    description: product?.description,
    image: product?.productImage?.[0]?.secure_url,
  });

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const headers = { "Content-Type": "application/json" };
        if (token) headers.Authorization = `Bearer ${token}`;

        const response = await fetch(
          `${import.meta.env.VITE_URL_BACKEND}/api/products/${id}`,
          { method: "GET", headers }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Error al obtener el producto");
        }
        const data = await response.json();
        setProduct({ ...data, sellerId: data.ownerId });
      } catch (err) {
        setError(err.message);
      }
    };
    fetchProduct();
  }, [id, token]);

  const handleAddToCart = () => {
    if (isGuest) {
      toast.error("Debés registrarte para agregar a favoritos.");
      navigate("/register");
      return;
    }
    if (!product) return;

    const safeIndex = Math.min(imgIndex, (product.productImage?.length || 1) - 1);
    const image = product.productImage?.[safeIndex]?.secure_url || PLACEHOLDER;

    addItemToCart({ ...product, image });
    toast.success("Producto agregado a favoritos");
  };

  const handleChat = async () => {
    if (isGuest) {
      toast.error("Debés iniciar sesión para chatear.");
      navigate("/");
      return;
    }
    if (!product?.ownerId) {
      toast.error("El vendedor no está disponible.");
      return;
    }

    // Si ya existe el chatId, navegar directamente
    if (product.chatId) {
      navigate(`/chat/${product.chatId}`);
      return;
    }

    // Crear chat nuevo
    try {
      const response = await fetch(
        `${import.meta.env.VITE_URL_BACKEND}/api/chats`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ ownerId: product.ownerId }),
        }
      );
      const data = await response.json();
      if (response.ok) {
        navigate(`/chat/${data.chat._id}`);
      } else {
        toast.error(data.error || "Error al iniciar el chat.");
      }
    } catch {
      toast.error("Error al iniciar el chat.");
    }
  };

  const handleReport = async () => {
    if (isGuest) {
      toast.error("Iniciá sesión para reportar.");
      return;
    }
    const reason = window.prompt("¿Por qué querés reportar esta publicación?");
    if (!reason?.trim()) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_URL_BACKEND}/api/reports`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ productId: id, reason }),
      });
      if (!res.ok) throw new Error("No se pudo enviar el reporte.");
      toast.success("Reporte enviado. ¡Gracias!");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const isOwner = userId && product?.ownerId?.toString() === userId;

  if (error) {
    return (
      <>
        <NavBar />
        <div className="state-message error-message">
          <p>Error al cargar el producto: {error}</p>
          <Link to="/home"><button className="return-button">Volver al inicio</button></Link>
        </div>
      </>
    );
  }

  if (!product) {
    return (
      <>
        <NavBar />
        <div className="state-message">Cargando...</div>
      </>
    );
  }

  return (
    <>
      <NavBar />
      <div className="detail-container">
        <h1 className="detail-title">{product.title}</h1>
        {product.status && product.status !== "available" && (
          <span className={`detail-status detail-status-${product.status}`}>
            {product.status === "sold" ? "Vendido" : "Reservado"}
          </span>
        )}
        <p className="detail-price">Precio: ${product.price?.toFixed(2)}</p>
        <p className="detail-description">Descripción: {product.description}</p>

        <Carousel imgIndex={imgIndex} setImgIndex={setImgIndex}>
          {product.productImage?.length > 0 ? (
            product.productImage.map((image, index) => (
              <div className="detail-image-container" key={index}>
                <img className="detail-image" src={image.secure_url} alt={product.title} />
              </div>
            ))
          ) : (
            <div className="detail-image-container">
              <img className="detail-image" src={PLACEHOLDER} alt="Sin imagen" />
            </div>
          )}
        </Carousel>

        <p className="detail-category">Categoría: {product.category}</p>
        {product.location?.province && (
          <p className="detail-category">
            📍 {product.location.city ? `${product.location.city}, ` : ""}
            {product.location.province}
          </p>
        )}

        {product.ownerId && !isOwner && (
          <Link to={`/seller/${product.ownerId}`} className="detail-seller-link">
            Ver más publicaciones del vendedor
          </Link>
        )}
        {!isOwner && (
          <button className="detail-report" onClick={handleReport}>
            Reportar publicación
          </button>
        )}

        <div className="detail-actions">
          <Link to="/home/">
            <button className="return-button">Volver</button>
          </Link>

          {isOwner ? (
            <>
              <span className="owner-tag">Esta es tu publicación</span>
              <button className="chat-button" onClick={() => navigate(`/edit/${id}`)}>
                Editar
              </button>
            </>
          ) : product.status === "sold" ? (
            <span className="owner-tag">Este producto ya fue vendido</span>
          ) : (
            <>
              <button className="chat-button" onClick={handleChat}>
                Chatear con el Vendedor
              </button>
              <button className="add-to-cart-button" onClick={handleAddToCart}>
                Agregar a Favoritos
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};
