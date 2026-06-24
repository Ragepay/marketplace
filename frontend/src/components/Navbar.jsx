import { useState, useEffect, useContext, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { CartContext } from "../context/CartContext";
import { useTheme } from "../context/ThemeContext";
import {
  FiHeart,
  FiUser,
  FiMenu,
  FiX,
  FiPlusCircle,
  FiLogOut,
  FiFileText,
  FiMessageCircle,
  FiSettings,
  FiSun,
  FiMoon,
} from "react-icons/fi";
import "./navbar.styles.css";

const NavBar = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [unread, setUnread] = useState(0);
  const { cartItems } = useContext(CartContext);
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const menuRef = useRef(null);

  const totalItems = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
    if (!token) return;

    const loadUnread = () => {
      fetch(`${import.meta.env.VITE_URL_BACKEND}/api/chats/unread`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : { count: 0 }))
        .then((data) => setUnread(data.count || 0))
        .catch(() => {});
    };

    // Solo polleamos cuando la pestaña está visible: una pestaña olvidada en
    // segundo plano deja de pegarle al backend y permite que Railway se duerma.
    let interval = null;
    const startPolling = () => {
      if (interval) return;
      loadUnread();
      interval = setInterval(loadUnread, 20000);
    };
    const stopPolling = () => {
      clearInterval(interval);
      interval = null;
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") startPolling();
      else stopPolling();
    };

    if (document.visibilityState === "visible") startPolling();
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("guest");
    localStorage.removeItem("userId");
    navigate("/");
  };

  const go = (path) => {
    navigate(path);
    setMenuOpen(false);
    setMobileOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="navbar-inner">
        <button className="navbar-logo" onClick={() => navigate("/home")}>
          Pop<span>Mart</span>
        </button>

        <div className="navbar-actions">
          {isAuthenticated && (
            <button className="navbar-btn-primary" onClick={() => go("/product/create")}>
              <FiPlusCircle />
              <span>Publicar</span>
            </button>
          )}

          {isAuthenticated && (
            <button className="navbar-icon-btn" onClick={() => go("/chats")} aria-label="Chats">
              <FiMessageCircle />
              {unread > 0 && <span className="navbar-badge navbar-badge-chat">{unread}</span>}
            </button>
          )}

          <button className="navbar-icon-btn" onClick={() => go("/cart")} aria-label="Favoritos">
            <FiHeart />
            {totalItems > 0 && <span className="navbar-badge">{totalItems}</span>}
          </button>

          <div className="navbar-user-menu" ref={menuRef}>
            <button className="navbar-icon-btn" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menú usuario">
              <FiUser />
            </button>
            {menuOpen && (
              <div className="navbar-dropdown">
                {isAuthenticated ? (
                  <>
                    <button onClick={() => go("/profile")}>
                      <FiSettings /> Mi Perfil
                    </button>
                    <button onClick={() => go("/post")}>
                      <FiFileText /> Mis Publicaciones
                    </button>
                    <button onClick={() => { toggleTheme(); }}>
                      {theme === "dark" ? <FiSun /> : <FiMoon />}{" "}
                      {theme === "dark" ? "Modo claro" : "Modo oscuro"}
                    </button>
                    <button className="logout" onClick={handleLogout}>
                      <FiLogOut /> Cerrar Sesión
                    </button>
                  </>
                ) : (
                  <button className="logout" onClick={handleLogout}>
                    <FiLogOut /> Salir
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        <button
          className="navbar-mobile-toggle"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menú"
        >
          {mobileOpen ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {mobileOpen && (
        <div className="navbar-mobile">
          {isAuthenticated && (
            <button onClick={() => go("/product/create")}>
              <FiPlusCircle /> Publicar
            </button>
          )}
          <button onClick={() => go("/cart")}>
            <FiHeart /> Favoritos {totalItems > 0 && `(${totalItems})`}
          </button>
          {isAuthenticated && (
            <>
              <button onClick={() => go("/profile")}>
                <FiSettings /> Mi Perfil
              </button>
              <button onClick={() => go("/post")}>
                <FiFileText /> Mis Publicaciones
              </button>
              <button onClick={() => go("/chats")}>
                <FiMessageCircle /> Mis Chats
              </button>
            </>
          )}
          <button onClick={toggleTheme}>
            {theme === "dark" ? <FiSun /> : <FiMoon />}{" "}
            {theme === "dark" ? "Modo claro" : "Modo oscuro"}
          </button>
          <button className="logout" onClick={handleLogout}>
            <FiLogOut /> Cerrar Sesión
          </button>
        </div>
      )}
    </nav>
  );
};

export default NavBar;
