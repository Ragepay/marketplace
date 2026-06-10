# PopMart — Marketplace de figuras coleccionables

## Stack
- **Backend**: Node + Express + MongoDB Atlas (Mongoose) — Vercel
- **Frontend**: React 18 + Vite + CSS custom — Vercel
- **Auth**: JWT 24h + bcrypt | **Images**: Cloudinary (express-fileupload)

## Estructura clave
```
backend/src/
  app.js              # Express, CORS, helmet, rate-limit
  controllers/        # user, product, chat
  middlewares/auth.js # JWT verify
  models/             # user (password select:false), product (paginate), chat
  routes/             # users, products, chats

frontend/src/
  index.css           # Design system (vars CSS: --bg-*, --primary, --text-*)
  components/Navbar.jsx + navbar.styles.css  # Custom sin MUI
  components/card/, cards/, Carousel/
  pages/Landing, Register, Home, Detail, Cart, Chat, Post, Product/CreateProduct
  context/CartContext.jsx  # Favoritos localStorage
  routes/routes.jsx        # ProtectedRoute
```

## Dev local
```bash
cd backend && npm run dev     # :5000
cd frontend && npm run dev    # :5173 (proxy /api → 5000)
```

## Auth
1. `POST /api/users/login` → `{ _id, token }`
2. Frontend guarda en `localStorage`: `token`, `userId`
3. Header: `Authorization: Bearer <token>`
4. 401 → redirect a `/`

## Patrones importantes
- `password` tiene `select:false` → usar `.select("+password")` en login
- Ownership: `product.ownerId === req.user.userId` (403 si no)
- Chat membership: `chat.users.includes(req.user.userId)`
- Rate limit: 20 req/15min en login y register
- CORS origins en `app.js` → agregar nuevos dominios ahí
- File upload: `express-fileupload`, NO multer

## API resumen
| Recurso | Ruta base | Auth write |
|---------|-----------|------------|
| Users | `/api/users` | ✓ (excepto login/register/recover) |
| Products | `/api/products` | ✓ (GET público) |
| Chats | `/api/chats` | ✓ todos |

## Env Backend
`PORT, API_USER, API_PASSWORD, JWT_SECRET, EMAIL, MAIL_APP_PASSWORD, CLOUDINARY_*, PATH_TEMP_IMAGES, PATH_CLOUDINARY_PRODUCT_IMAGES, FRONTEND_URL`

## Deuda técnica
- Chat pollea c/5s (no WebSocket)
- Cart solo en localStorage (no server)
- Sin tests (vitest FE, jest BE)
- Typo intencional: `EdithPost.jsx`
- `getAllProducts` máx 50/req

## Design System (frontend)
Variables CSS en `index.css`: `--bg-base`, `--bg-card`, `--primary` (#7C5DFA), `--secondary` (#FF4F9A), `--accent` (#00D4A1), `--text-primary/secondary/muted`, `--border`, `--radius-*`, `--shadow-*`
