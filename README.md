# BrewNest Coffee & Tea Platform

Your single-file React app, split into a **frontend** (React + TypeScript + Vite + Tailwind) and a **backend** (Node.js + Express REST API).

```
brewnest-platform/
├── backend/
│   ├── server.js            API: products, offers, auth, orders, prize draw
│   ├── data/products.json   56 products (moved out of the React file)
│   ├── data/offers.json     VIP loyalty offers
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── index.html
    ├── package.json, vite.config.ts, tsconfig.json, tailwind.config.js, postcss.config.js
    └── src/
        ├── main.tsx
        ├── App.tsx                      Your original UI, now calling the API
        ├── api.ts                       Fetch helper (adds the login token)
        ├── index.css                    Tailwind
        ├── components/BrewNestLogo.tsx
        └── data/avatars.ts
```

## Run it (two terminals)
Requires Node.js 18+.

```bash
# Terminal 1: backend on http://localhost:5000
cd backend
npm install
npm start

# Terminal 2: frontend on http://localhost:5173
cd frontend
npm install
npm run dev
```
Open http://localhost:5173. The dev server forwards `/api` calls to the backend.

## What moved to the backend
| Was in the React file | Now |
|---|---|
| `INITIAL_PRODUCTS` array | `GET /api/products` (`?category=` and `?q=` filters), `GET /api/products/:id` |
| `RETURNING_OFFERS` array | `GET /api/offers` |
| Fake OTP `824916` | `POST /api/auth/send-otp` (random code, 5-minute expiry) |
| Accept-any-password login | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` (hashed passwords, signed token) |
| Order built in the browser | `POST /api/orders`, `GET /api/orders` (the server recalculates prices, coupon discount, and shipping) |
| `Math.random()` prize wheel | `POST /api/draw/spin` (server picks the prize) |

Still in the frontend: cart, wishlist, search and filters, avatar choice, and the New/Returning customer demo switch.

## Behaviour changes to know about
- **Login now needs a real account.** Register first (OTP step), then log in. New vs returning customer is decided by the user's order count.
- **Placing an order requires login**, and the totals shown after checkout come from the server.
- **Dev OTP:** no SMS provider is connected, so the code is returned in the API response and auto-filled in the form. In production (`NODE_ENV=production`) it is not returned; connect an SMS service in `send-otp` first.
- **Admin role:** emails listed in `ADMIN_EMAILS` get it on registration.

## Configuration
Copy `backend/.env.example` to `.env` (or set the variables in your host): `PORT`, `TOKEN_SECRET` (set a long random value), `ADMIN_EMAILS`, `CORS_ORIGIN`. For a separately hosted frontend, set `VITE_API_URL` to the backend URL, such as `https://api.example.com/api`.

## Production notes
- Data is stored in `backend/data/db.json` (created on first signup). Replace it with a real database before real customers.
- Payments are not integrated; the card and UPI options only record the chosen method.
- Build the frontend with `npm run build` (output in `frontend/dist`).
