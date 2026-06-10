# PopMart — Roadmap de evolución a marketplace real

> Plan técnico de mejoras. Ordenado por **dependencias y riesgo**, no por deseo.
> Cada épica define: objetivo, cambios de datos, backend, frontend, criterios de aceptación (DoD),
> esfuerzo (S < 1d / M 1-3d / L 3-5d) y riesgos.

## Principios (cómo encaramos esto)

1. **El backend es la fuente de verdad.** Hoy hay lógica que vive solo en el cliente (filtros, favoritos). Migrar al server donde corresponda.
2. **Cambios de schema con migración.** Todo campo nuevo en un modelo viene con script de migración idempotente (ya tenemos el patrón en `backend/scripts/`).
3. **Nada rompe lo existente.** Cada épica es mergeable sola; feature flags si hace falta.
4. **Seguridad por defecto.** Ownership checks, validación de input, rate limiting (ya existe en login/register).
5. **Definición de Done compartida:** funciona en mobile, maneja loading/error, sin warnings de consola, y con al menos un test del happy-path.

---

## Estado actual (baseline)

| Área | Tenemos | Falta |
|------|---------|-------|
| Auth | JWT 24h, bcrypt, register/login/guest | Verificación email, reset password funcional |
| Productos | CRUD, paginación, Cloudinary, ownership | Estado (vendido), multi-imagen en alta, filtros server-side |
| Chat | Async (polling 5s), crear/listar/borrar | No-leídos, websockets, "leído" |
| Perfil | Editar datos, cambiar password | Foto editable, perfil público |
| Favoritos | localStorage | Persistencia en server |
| Calidad | — | Tests, CI, manejo de imágenes en cleanup |

---

## FASE 0 — Cerrar flujos a medias (1 semana)

Objetivo: que **nada quede roto a la vista**. Es lo que un usuario nota primero.

### 0.1 — Reset de contraseña funcional · **M**
- **Contexto:** el link "¿Olvidaste tu contraseña?" en `Landing.jsx` no hace nada; el backend ya tiene `POST /api/users/recover` que manda un token por mail.
- **Backend:** agregar `POST /api/users/reset-password` que reciba `{ token, newPassword }`, verifique el JWT de recuperación (ya se firma con `expiresIn: 1h`), hashee y guarde.
- **Frontend:** página `/recover` (pedir email) y `/reset-password?token=...` (nueva contraseña). Reusar estilos de auth.
- **DoD:** flujo completo email → link → nueva contraseña → login OK. Token expirado da error claro.
- **Riesgo:** bajo. Ojo con rate-limit en `/recover` para no permitir enumeración/spam.

### 0.2 — Estado del producto (Disponible / Reservado / Vendido) · **M**
- **Schema (`product.model.js`):** `status: { type: String, enum: ["available","reserved","sold"], default: "available" }`.
- **Backend:** endpoint `PATCH /api/products/:id/status` (solo dueño). Filtrar por status en `getAllProducts` (default: solo `available` en el Home).
- **Frontend:** badge en `card.jsx` y `Detail.jsx`; selector de estado en "Mis Publicaciones". Ocultar/atenuar vendidos en Home.
- **Migración:** `scripts/set-default-status.mjs` → setear `available` a los que no tengan.
- **DoD:** marcar vendido lo saca del catálogo; el dueño lo sigue viendo en sus publicaciones.

### 0.3 — Editar publicación pulido + botón Editar en Detail · **M**
- **Contexto:** existe `EdithPost.jsx` (typo intencional) y `PUT /api/products/:id`.
- **Frontend:** botón "Editar" en `Detail.jsx` cuando `isOwner`; precargar form; permitir cambiar datos e imágenes.
- **DoD:** editar sin perder imágenes existentes; validaciones iguales a crear.

**Salida de Fase 0:** los 3 flujos core (recuperar cuenta, vender de verdad, editar) quedan completos.

---

## FASE 1 — Confianza y datos en el server (1-2 semanas)

Objetivo: que la plataforma sea **confiable y multi-dispositivo**.

### 1.1 — Búsqueda y filtros server-side · **L**
- **Contexto:** hoy `Home.jsx` filtra precio/categoría/orden sobre la página cargada → resultados incompletos.
- **Backend (`getAllProducts`):** aceptar `minPrice`, `maxPrice`, `category`, `sort` (recent/price-asc/price-desc/title) en el querystring y construir el filtro Mongo + `sort`. Mantener `mongoose-paginate-v2`.
- **Frontend:** mover el estado de filtros a la query; mantener el scroll infinito por bloques de 60.
- **DoD:** filtrar por precio devuelve resultados de TODO el catálogo, no solo lo visible.
- **Riesgo:** índices. Agregar índices en `price`, `category`, `status`, `createdAt`.

### 1.2 — Favoritos persistidos en el server · **M**
- **Contexto:** `CartContext` usa `localStorage`. Se pierden entre dispositivos.
- **Schema:** `favorites: [{ ref: "Product" }]` en `user.model.js`.
- **Backend:** `GET/POST/DELETE /api/users/me/favorites`.
- **Frontend:** `CartContext` sincroniza con el server si hay token; fallback a localStorage para invitados (merge al loguear).
- **DoD:** agrego favorito en un dispositivo, aparece en otro tras login.

### 1.3 — Verificación de email · **M**
- **Schema:** `emailVerified: { type: Boolean, default: false }`.
- **Backend:** al registrar, mandar link con token; `GET /api/users/verify?token=`. Opcional: bloquear publicar hasta verificar.
- **DoD:** cuenta nueva arranca no verificada; el link la activa.

### 1.4 — Perfil público del vendedor · **M**
- **Backend:** `GET /api/users/:id/public` → datos no sensibles + productos `available` + reputación (cuando exista 2.1).
- **Frontend:** página `/seller/:id`; link desde `Detail.jsx` ("Ver publicaciones del vendedor").
- **DoD:** entrar al perfil muestra solo info pública y sus productos activos.

---

## FASE 2 — Calidad de marketplace (2 semanas)

### 2.1 — Reseñas y reputación · **L**
- **Schema nuevo:** `Review { fromUser, toUser, productId, rating 1-5, comment, createdAt }`. Índice único `(fromUser, productId)`.
- **Backend:** CRUD de reviews; calcular promedio del vendedor (agregación) y cachearlo en `user.ratingAvg`/`ratingCount`.
- **Frontend:** estrellas en card del vendedor, perfil público y Detail. Dejar review tras contacto/operación.
- **Riesgo:** definir cuándo se habilita reseñar (post-chat / post-venta) para evitar abuso.

### 2.2 — Ubicación + filtro por zona · **M**
- **Schema:** `location: { province, city }` (empezar simple; GeoJSON si después hace falta radio).
- **Frontend:** select de provincia en alta y filtro en Home.
- **DoD:** filtrar "Córdoba" muestra solo productos de esa zona.

### 2.3 — Reportar publicación + moderación básica · **M**
- **Schema:** `Report { productId, byUser, reason, status }`.
- **Backend:** crear reporte; endpoint admin para listar/resolver. Rol `isAdmin` en user.
- **Frontend:** botón "Reportar" en Detail; vista `/admin/reports` protegida por rol.

### 2.4 — Multi-imagen real en alta + gestión · **M**
- **Contexto:** modelo soporta `productImage[]`, Carousel ya las muestra, pero el alta sube 1.
- **Frontend:** input múltiple, previews, reordenar, borrar antes de subir.
- **Backend:** ya acepta array en `createProduct`; ajustar límites (máx N imágenes, tamaño).

---

## FASE 3 — Chat en serio (1-2 semanas)

### 3.1 — Mensajes no leídos · **M**
- **Schema (`chat.model.js`):** por mensaje `readBy: [userId]` o por chat `lastReadAt` por usuario.
- **Backend:** `GET /api/chats/unread-count`; marcar leído al abrir.
- **Frontend:** badge en el ícono 💬 del navbar (patrón ya usado para favoritos).

### 3.2 — WebSockets (reemplazar polling) · **L**
- **Contexto:** deuda técnica anotada — hoy `Chat.jsx` pollea cada 5s.
- **Backend:** `socket.io`, rooms por `chatId`, auth por JWT en el handshake.
- **Frontend:** suscribir al room; quitar el `setInterval`.
- **DoD:** mensaje llega <1s sin recargar; sin polling.
- **Riesgo:** Vercel serverless no mantiene websockets bien → evaluar host con conexión persistente o usar Pusher/Ably como atajo.

### 3.3 — UX de chat · **S**
- Hora por mensaje, "leído", compartir el producto dentro del chat, bloquear usuario.

---

## FASE 4 — Plataforma y escala (continuo)

### 4.1 — Testing + CI · **L**
- **Back:** Jest + supertest sobre controllers críticos (auth, products ownership, chat membership).
- **Front:** Vitest + Testing Library sobre flujos (login, crear producto, chat).
- **CI:** GitHub Actions corriendo lint + tests en cada PR.

### 4.2 — Higiene de imágenes · **S**
- Borrar de Cloudinary al eliminar producto (el controller `deleteProductById` ya lo hace; faltó en los scripts de limpieza). Tarea de mantenimiento para huérfanos en Cloudinary.

### 4.3 — SEO / Open Graph · **M**
- Meta tags por producto, sitemap, títulos dinámicos. Evaluar SSR/prerender si importa el SEO.

### 4.4 — Observabilidad · **M**
- Logging estructurado, captura de errores (Sentry), métricas básicas.

### 4.5 — (Opcional / "marketplace serio") Pagos y órdenes · **XL**
- Checkout con Mercado Pago/Stripe, modelo `Order`, estados de operación, comisión, coordinación de envío. Es un proyecto en sí mismo; encararlo solo si el negocio lo pide.

---

## Cross-cutting (aplica a todo)

- **Índices Mongo** antes de escalar consultas (price, category, status, createdAt, ownerId).
- **Validación de input** centralizada (considerar `zod`/`express-validator`).
- **Rate limiting** extendido a endpoints sensibles nuevos (reset, reportes).
- **Paginación consistente** (mismo contrato que `getAllProducts`).
- **Accesibilidad y estados de carga** (skeletons) en cada vista nueva.

---

## Secuencia recomendada (sprints de ~1 semana)

| Sprint | Contenido | Por qué |
|--------|-----------|---------|
| 1 | 0.1, 0.2, 0.3 | Cierra flujos rotos visibles |
| 2 | 1.1, 1.2 | Server como fuente de verdad |
| 3 | 1.3, 1.4, 2.4 | Confianza + multi-imagen |
| 4 | 2.1, 2.2, 2.3 | Reputación y calidad |
| 5 | 3.1, 3.3 + 4.1 | Chat usable + red de seguridad de tests |
| 6 | 3.2 | WebSockets (depende de decisión de hosting) |
| 7+ | 4.3, 4.4, 4.5 | Escala / negocio |

> **Quick wins** para mostrar avance rápido: 0.2 (estado vendido), 3.1 (badge no-leídos), 4.2 (higiene imágenes).
> **Mayor riesgo técnico:** 3.2 (websockets en serverless) y 4.5 (pagos). Spike antes de comprometer fecha.
