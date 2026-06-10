import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "../../components/Navbar";
import { FiMessageCircle, FiChevronRight, FiTrash2 } from "react-icons/fi";
import toast from "react-hot-toast";
import "./chats.styles.css";

export const Chats = () => {
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  useEffect(() => {
    const loadChats = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_URL_BACKEND}/api/chats`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error("Error al cargar los chats");
        const data = await res.json();
        setChats(data.chats || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadChats();
  }, [token]);

  const handleDelete = async (e, chatId) => {
    e.stopPropagation();
    if (!window.confirm("¿Eliminar este chat? No se puede deshacer.")) return;
    try {
      const res = await fetch(`${import.meta.env.VITE_URL_BACKEND}/api/chats/${chatId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error("No se pudo eliminar el chat.");
      setChats((prev) => prev.filter((c) => c._id !== chatId));
      toast.success("Chat eliminado.");
    } catch (err) {
      toast.error(err.message);
    }
  };

  const partnerOf = (chat) =>
    chat.users?.find((u) => u._id?.toString() !== userId) || {};

  const lastMessage = (chat) =>
    chat.messages?.length ? chat.messages[chat.messages.length - 1].contenido : "Sin mensajes aún";

  return (
    <>
      <NavBar />
      <div className="chats-page">
        <h1 className="chats-title">
          <FiMessageCircle /> Mis Chats
        </h1>

        {loading ? (
          <p className="chats-empty">Cargando...</p>
        ) : chats.length === 0 ? (
          <div className="chats-empty">
            <p>No tenés chats todavía.</p>
            <span>Entrá a un producto y tocá &quot;Chatear con el Vendedor&quot;.</span>
          </div>
        ) : (
          <div className="chats-list">
            {chats.map((chat) => {
              const partner = partnerOf(chat);
              const name = partner.name
                ? `${partner.name} ${partner.lastname || ""}`.trim()
                : "Usuario";
              const avatar = Array.isArray(partner.image)
                ? partner.image[0]
                : partner.image;
              return (
                <div
                  key={chat._id}
                  className="chat-item"
                  role="button"
                  tabIndex={0}
                  onClick={() => navigate(`/chat/${chat._id}`)}
                  onKeyDown={(e) => e.key === "Enter" && navigate(`/chat/${chat._id}`)}
                >
                  <img
                    className="chat-item-avatar"
                    src={
                      avatar ||
                      `https://ui-avatars.com/api/?background=7C5DFA&color=fff&name=${encodeURIComponent(name)}`
                    }
                    alt={name}
                  />
                  <div className="chat-item-info">
                    <span className="chat-item-name">{name}</span>
                    <span className="chat-item-last">{lastMessage(chat)}</span>
                  </div>
                  <button
                    className="chat-item-delete"
                    onClick={(e) => handleDelete(e, chat._id)}
                    aria-label="Eliminar chat"
                    title="Eliminar chat"
                  >
                    <FiTrash2 />
                  </button>
                  <FiChevronRight className="chat-item-arrow" />
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};
