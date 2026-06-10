import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { io } from "socket.io-client";
import NavBar from "../../components/Navbar";
import { FiArrowLeft, FiSend } from "react-icons/fi";
import "./Chat.styles.css";

export const Chat = () => {
  const userId = localStorage.getItem("userId");
  const token = localStorage.getItem("token");
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [partner, setPartner] = useState(null);
  const { chatId } = useParams();
  const navigate = useNavigate();
  const endRef = useRef(null);
  const socketRef = useRef(null);

  // Carga inicial del historial + datos del otro usuario
  useEffect(() => {
    if (!chatId) return;
    fetch(`${import.meta.env.VITE_URL_BACKEND}/api/chats/${chatId}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        if (!res.ok) throw new Error("Error al cargar los mensajes del chat");
        return res.json();
      })
      .then((chatData) => {
        setMessages(chatData.chat.messages || []);
        const other = chatData.chat.users?.find((u) => u._id?.toString() !== userId);
        if (other) setPartner(other);
      })
      .catch((err) => console.error(err));
  }, [chatId, token, userId]);

  // Conexión en tiempo real (WebSocket)
  useEffect(() => {
    if (!chatId || !token) return;
    const socket = io(import.meta.env.VITE_URL_BACKEND, { auth: { token } });
    socketRef.current = socket;
    socket.emit("join-chat", chatId);

    socket.on("new-message", ({ chatId: cid, message }) => {
      if (cid !== chatId) return;
      setMessages((prev) =>
        prev.some((m) => m._id === message._id) ? prev : [...prev, message]
      );
    });

    return () => {
      socket.emit("leave-chat", chatId);
      socket.disconnect();
    };
  }, [chatId, token]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_URL_BACKEND}/api/chats/${chatId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ contenido: newMessage }),
        }
      );
      if (!response.ok) throw new Error("Error al enviar el mensaje");
      // El mensaje se agrega vía socket (new-message). Solo limpiamos el input.
      setNewMessage("");
    } catch (error) {
      console.error("Error enviando mensaje:", error);
    }
  };

  const partnerName = partner
    ? `${partner.name} ${partner.lastname || ""}`.trim()
    : "Vendedor";

  return (
    <>
      <NavBar />
      <div className="chat-container">
        <div className="chat-window">
          <div className="chat-bar">
            <button className="chat-back" onClick={() => navigate("/chats")} aria-label="Volver">
              <FiArrowLeft />
            </button>
            <span className="chat-bar-name">{partnerName}</span>
          </div>

          <div className="chat-messages">
            {messages.length === 0 && (
              <p className="chat-empty-msg">Escribí el primer mensaje 👋</p>
            )}
            {messages.map((msg) => {
              const mine = msg.emisor?.toString() === userId;
              return (
                <div
                  key={msg._id}
                  className={`chat-bubble ${mine ? "mine" : "theirs"}`}
                >
                  {msg.contenido}
                </div>
              );
            })}
            <div ref={endRef} />
          </div>

          <form className="chat-input" onSubmit={handleSendMessage}>
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Escribe un mensaje..."
              className="input-message"
            />
            <button type="submit" className="send-button" aria-label="Enviar">
              <FiSend />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};
