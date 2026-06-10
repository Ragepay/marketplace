# PopMart — Marketplace 🏬

<img src="https://github.com/user-attachments/assets/4457d2d8-ca4d-40c8-b106-6c819569255e" width="160">

Marketplace de la comunidad estilo Facebook Marketplace: cualquiera publica lo que quiere vender y quien le interesa se contacta por chat. Pensado para comprar, vender y coordinar entre personas.

> **Stack:** React + Vite (frontend) · Node + Express + MongoDB (backend) · Cloudinary (imágenes) · Socket.IO (chat en tiempo real)

---

## ✨ Características

- **Catálogo** con búsqueda, filtros por precio/categoría/provincia y orden, todo resuelto en el servidor.
- **Scroll infinito** (carga progresiva hasta 60) + paginación por bloques.
- **Publicaciones** con múltiples imágenes, categoría, ubicación y estado (Disponible / Reservado / Vendido).
- **Chat en tiempo real** (WebSockets) entre comprador y vendedor, con contador de mensajes no leídos.
- **Favoritos** persistidos en la cuenta (sincronizados entre dispositivos).
- **Cuentas**: registro, login, invitado, recuperación de contraseña, verificación de email.
- **Perfil**: editar datos, cambiar contraseña; **perfil público** del vendedor con reseñas y reputación ⭐.
- **Moderación**: reportar publicaciones + panel de administración.
- **Tema claro / oscuro** y diseño responsive.

---

## 🧱 Stack y arquitectura

```
backend/   Node + Express + Mongoose (MongoDB Atlas)
  src/
    app.js            # Express, CORS, helmet, rate-limit, socket.io
    socket.js         # WebSockets (chat en tiempo real)
    controllers/      # user, product, chat, review, report
    models/           # user, product, chat, review, report
    routes/           # users, products, chats, reviews, reports
    middlewares/      # auth (JWT), cloudinary
    scripts/          # mantenimiento de datos (orphans, status, admin)

frontend/  React 18 + Vite + CSS custom
  src/
    pages/            # Landing, Register, Home, Detail, Cart, Chat(s),
                      # Profile, Seller, Product, Recover, Verify, Admin
    components/       # Navbar, Footer, card, cards, Carousel
    context/          # CartContext (favoritos), ThemeContext
    hooks/useMeta.js  # SEO / Open Graph por vista
```

- **Auth:** JWT (24h) + bcrypt. Header `Authorization: Bearer <token>`.
- **Imágenes:** Cloudinary vía `express-fileupload`.
- **Tiempo real:** Socket.IO con auth JWT en el handshake y salas por chat.

---

## 🚀 Desarrollo local

Requisitos: Node 20+, una base MongoDB y cuenta de Cloudinary.

```bash
# Backend
cd backend
npm install
npm run dev        # http://localhost:5000

# Frontend (en otra terminal)
cd frontend
npm install
npm run dev        # http://localhost:5173 (proxy /api → :5000)
```

### Variables de entorno

**backend/.env**
```
PORT=5000
API_USER=...                 # usuario de MongoDB Atlas
API_PASSWORD=...             # password de MongoDB Atlas
JWT_SECRET=...
EMAIL=...                    # cuenta Gmail para notificaciones
MAIL_APP_PASSWORD=...        # app password de Gmail
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
FRONTEND_URL=https://tu-frontend.vercel.app
```

**frontend/.env**
```
VITE_URL_BACKEND=http://localhost:5000   # en prod: URL pública del backend
```

> ⚠️ Nunca commitees `.env` (está en `.gitignore`). Si alguna credencial se subió alguna vez, rotala.

---

## 🧪 Tests

```bash
cd frontend && npm test   # Vitest + Testing Library
cd backend  && npm test   # Vitest + supertest
```

El CI (GitHub Actions, `.github/workflows/ci.yml`) corre lint + tests + build en cada push/PR a `main` y `develop`.

---

## ☁️ Deploy

- **Backend → Railway** (mantiene conexiones WebSocket). Configurar las env del backend; Railway expone el puerto vía `PORT`.
- **Frontend → Vercel.** Setear `VITE_URL_BACKEND` con la URL pública de Railway.
- Agregar el dominio de Vercel a `FRONTEND_URL` (se usa para CORS y sockets).

---

## 🔌 API (resumen)

| Recurso | Base | Notas |
|---------|------|-------|
| Usuarios | `/api/users` | login/register/recover/reset/verify públicos; resto con auth |
| Productos | `/api/products` | GET público; escritura con auth (dueño) |
| Chats | `/api/chats` | todos con auth; tiempo real por Socket.IO |
| Reseñas | `/api/reviews` | GET público; crear con auth |
| Reportes | `/api/reports` | crear con auth; listar/resolver solo admin |

---

## 🛠️ Scripts de mantenimiento (`backend/scripts/`)

```bash
node scripts/report-orphans.mjs            # reporta productos sin dueño
node scripts/delete-orphans.mjs --apply    # elimina productos huérfanos
node scripts/set-default-status.mjs        # status=available a productos viejos
node scripts/make-admin.mjs email@dom.com  # promueve un usuario a admin
```

---

## 🗺️ Roadmap

El detalle de fases y mejoras pendientes (incluidos pagos) está en [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## 👥 Colaboradores

<a href="https://www.linkedin.com/in/nicolasadelramos/" target="_blank">
<img src="https://img.shields.io/badge/-Nicolás%20Ramos-0A66C2?logo=linkedin"></a>

## Tecnologías

<img src="https://img.shields.io/badge/-NodeJS-339933?logo=nodedotjs&logoColor=white">
<img src="https://img.shields.io/badge/-Express-000000?logo=express">
<img src="https://img.shields.io/badge/-MongoDB-47A248?logo=mongodb&logoColor=white">
<img src="https://img.shields.io/badge/-React-61DAFB?logo=react&logoColor=black">
<img src="https://img.shields.io/badge/-Vite-646CFF?logo=vite&logoColor=white">
<img src="https://img.shields.io/badge/-Socket.IO-010101?logo=socketdotio&logoColor=white">
<img src="https://img.shields.io/badge/-Cloudinary-3448C5?logo=cloudinary&logoColor=white">
<img src="https://img.shields.io/badge/-JavaScript-F7DF1E?logo=javascript&logoColor=black">
