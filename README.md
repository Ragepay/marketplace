<div align="center">

<img src="https://github.com/user-attachments/assets/4457d2d8-ca4d-40c8-b106-6c819569255e" width="120">

# PopMart — Marketplace 🏬

**Marketplace de la comunidad estilo Facebook Marketplace.**
Publicá lo que querés vender, quien le interesa te escribe por chat, y cierran el trato.

<img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black">
<img src="https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white">
<img src="https://img.shields.io/badge/Node-20-339933?logo=nodedotjs&logoColor=white">
<img src="https://img.shields.io/badge/Express-4-000000?logo=express">
<img src="https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white">
<img src="https://img.shields.io/badge/Socket.IO-realtime-010101?logo=socketdotio&logoColor=white">
<img src="https://img.shields.io/badge/Cloudinary-images-3448C5?logo=cloudinary&logoColor=white">

</div>

---

## 📑 Índice

- [Características](#-características)
- [Demo](#-demo)
- [Arquitectura](#-arquitectura)
- [Desarrollo local](#-desarrollo-local)
- [Variables de entorno](#variables-de-entorno)
- [Tests & CI](#-tests--ci)
- [Deploy](#-deploy)
- [API](#-api-resumen)
- [Scripts npm](#-scripts-npm)
- [Scripts de mantenimiento](#-scripts-de-mantenimiento)
- [Roadmap](#-roadmap)
- [Equipo](#-equipo)

---

## ✨ Características

| | |
|---|---|
| 🛒 **Catálogo** | Búsqueda + filtros (precio / categoría / provincia) y orden, resueltos en el servidor |
| ♾️ **Scroll infinito** | Carga progresiva hasta 60 ítems + paginación por bloques |
| 📦 **Publicaciones** | Múltiples imágenes, categoría, ubicación y estado (Disponible / Reservado / Vendido) |
| 💬 **Chat en tiempo real** | WebSockets entre comprador y vendedor + contador de no leídos por chat |
| ❤️ **Favoritos** | Persistidos en la cuenta, sincronizados entre dispositivos |
| 👤 **Cuentas & perfil** | Registro, login, invitado, recuperar/verificar email, editar perfil y contraseña |
| ⭐ **Reputación** | Perfil público del vendedor con reseñas y promedio |
| 🛡️ **Moderación** | Reportar publicaciones + panel de administración (rol admin) |
| 🌓 **UX** | Tema claro / oscuro, responsive, SEO/Open Graph por vista |

---

## 🌐 Demo

| Entorno | URL |
|---------|-----|
| Frontend (Vercel) | _agregar URL_ |
| Backend (Railway) | _agregar URL_ |

> _Tip: reemplazá estas URLs cuando deployees y agregá un par de capturas acá abajo._

---

## 🧱 Arquitectura

```
c20-21-m-node-react/
├── backend/                Node + Express + Mongoose (MongoDB Atlas)
│   └── src/
│       ├── app.js          Express · CORS · helmet · rate-limit · socket.io
│       ├── socket.js       WebSockets (chat en tiempo real)
│       ├── controllers/    user · product · chat · review · report
│       ├── models/         user · product · chat · review · report
│       ├── routes/         users · products · chats · reviews · reports
│       ├── middlewares/    auth (JWT) · cloudinary
│       └── scripts/        mantenimiento de datos
└── frontend/               React 18 + Vite + CSS custom
    └── src/
        ├── pages/          Landing · Home · Detail · Cart · Chat(s) · Profile
        │                   Seller · Product · Recover · Verify · Admin
        ├── components/     Navbar · Footer · card · cards · Carousel
        ├── context/        CartContext (favoritos) · ThemeContext
        └── hooks/useMeta   SEO / Open Graph por vista
```

- **Auth:** JWT (24h) + bcrypt — header `Authorization: Bearer <token>`.
- **Imágenes:** Cloudinary vía `express-fileupload`.
- **Tiempo real:** Socket.IO con auth JWT en el handshake y salas por chat.

---

## 🚀 Desarrollo local

> Requisitos: **Node 20+**, una base **MongoDB** y cuenta de **Cloudinary**.

```bash
# Backend  → http://localhost:5000
cd backend && npm install && npm run dev

# Frontend → http://localhost:5173  (proxy /api → :5000)
cd frontend && npm install && npm run dev
```

### Variables de entorno

<details>
<summary><b>backend/.env</b></summary>

```env
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
</details>

<details>
<summary><b>frontend/.env</b></summary>

```env
VITE_URL_BACKEND=http://localhost:5000   # en prod: URL pública del backend
```
</details>

> ⚠️ Nunca commitees `.env` (está en `.gitignore`). Si alguna credencial se subió alguna vez, **rotala**.

---

## 🧪 Tests & CI

```bash
cd frontend && npm test   # Vitest + Testing Library
cd backend  && npm test   # Vitest + supertest
```

El **CI** (GitHub Actions, [`.github/workflows/ci.yml`](.github/workflows/ci.yml)) corre lint + tests + build en cada push/PR a `main` y `develop`.

---

## ☁️ Deploy

| Servicio | Plataforma | Notas |
|----------|-----------|-------|
| Backend | **Railway** | Soporta WebSockets. Expone el puerto vía `PORT`. Setear todas las env del backend. |
| Frontend | **Vercel** | `VITE_URL_BACKEND` = URL pública de Railway. |

> Agregá el dominio de Vercel a `FRONTEND_URL` del backend (se usa para CORS y sockets).

---

## 🔌 API (resumen)

| Recurso | Base | Acceso |
|---------|------|--------|
| Usuarios | `/api/users` | `login` · `register` · `recover` · `reset` · `verify` públicos; resto con auth |
| Productos | `/api/products` | GET público; escritura solo dueño |
| Chats | `/api/chats` | todos con auth; tiempo real por Socket.IO |
| Reseñas | `/api/reviews` | GET público; crear con auth |
| Reportes | `/api/reports` | crear con auth; listar/resolver solo admin |

---

## 📜 Scripts npm

**Backend**
| Script | Acción |
|--------|--------|
| `npm run dev` | Servidor con recarga (`--watch`) |
| `npm start` | Servidor en producción |
| `npm test` | Tests (Vitest + supertest) |
| `npm run push --m="msg"` | `add -A` + commit con tu mensaje + push de la rama actual |

**Frontend**
| Script | Acción |
|--------|--------|
| `npm run dev` | Vite en desarrollo |
| `npm run build` | Build de producción |
| `npm test` | Tests (Vitest) |
| `npm run lint` | ESLint |

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

Fases implementadas y pendientes (incluidos pagos con Mercado Pago) en [`docs/ROADMAP.md`](docs/ROADMAP.md).

---

## 👤 Autor

**Benjamin Peyraga** — [@Ragepay](https://github.com/Ragepay)

<a href="https://github.com/Ragepay" target="_blank">
<img src="https://img.shields.io/badge/-Ragepay-181717?logo=github&logoColor=white"></a>
