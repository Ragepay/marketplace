import { useNavigate } from "react-router-dom";
import { FiPlusCircle, FiHeart, FiMessageCircle, FiUser } from "react-icons/fi";
import "./footer.styles.css";

const Footer = () => {
  const navigate = useNavigate();
  const isAuth = !!localStorage.getItem("token");
  const year = new Date().getFullYear();

  return (
    <footer className="footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <span className="footer-logo">
            Pop<span>Mart</span>
          </span>
          <p>
            El marketplace de la comunidad. Publicá lo que quieras vender y
            conectá con quien le interese.
          </p>
        </div>

        <div className="footer-col">
          <h4>Explorar</h4>
          <button onClick={() => navigate("/home")}>Inicio</button>
          {isAuth && (
            <button onClick={() => navigate("/product/create")}>
              <FiPlusCircle /> Publicar
            </button>
          )}
          <button onClick={() => navigate("/cart")}>
            <FiHeart /> Favoritos
          </button>
        </div>

        <div className="footer-col">
          <h4>Cuenta</h4>
          {isAuth ? (
            <>
              <button onClick={() => navigate("/profile")}>
                <FiUser /> Mi Perfil
              </button>
              <button onClick={() => navigate("/chats")}>
                <FiMessageCircle /> Mis Chats
              </button>
              <button onClick={() => navigate("/post")}>Mis Publicaciones</button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("/")}>Iniciar sesión</button>
              <button onClick={() => navigate("/register")}>Crear cuenta</button>
            </>
          )}
        </div>
      </div>

      <div className="footer-bottom">
        <span>© {year} PopMart. Hecho por la comunidad.</span>
      </div>
    </footer>
  );
};

export default Footer;
