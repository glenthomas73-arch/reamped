# ⚡ ReAmped

> **Every deal. One search.**

ReAmped is a full-stack SaaS application that aggregates used music gear listings across multiple marketplaces — Reverb, eBay, Guitar Center Used, Sweetwater Used, Facebook Marketplace, and Gumtree UK — then scores every listing with an intelligent value algorithm so musicians always find the best deal.

[![Live Demo](https://img.shields.io/badge/demo-reamped--delta.vercel.app-6366f1?style=flat-square)](https://reamped-delta.vercel.app)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

---

## ✨ Features

| Feature | Free | Pro |
|---|:---:|:---:|
| Cross-platform search (Reverb + eBay) | ✅ | ✅ |
| Guitar Center Used + Sweetwater Used | ✅ | ✅ |
| Facebook Marketplace + Gumtree UK | — | ✅ |
| Value Score™ (0–100 deal rating) | ✅ | ✅ |
| Value Grade (A–F) | ✅ | ✅ |
| Saved watchlist | — | ✅ |
| Price alerts | — | ✅ |
| Price history charts | — | ✅ |
| iOS + Android mobile app | ✅ | ✅ |

---

## 🏗 Architecture

```
reamped/
├── backend/          # Node.js / Express API + cron workers
│   └── src/
│       ├── db/       # schema.sql, migrate.js
│       ├── middleware/  # auth (JWT), rate limiting
│       ├── routes/   # auth, search, watchlist, alerts, payments
│       ├── services/ # scorer, stripe
│       ├── utils/    # normalizers, helpers
│       └── workers/  # reverb, ebay, guitarcenter, sweetwater, facebook, gumtree, priceAlert
├── frontend/         # React SPA (Create React App)
│   └── src/
│       ├── components/  # Header, ListingCard, FilterPanel, LoadingSkeleton
│       ├── pages/       # SearchPage, ListingPage, PricingPage, AccountPage, Login/Register
│       └── AuthContext.js
├── mobile/           # React Native (Expo) app
│   └── src/
│       ├── api/      # Axios client
│       ├── context/  # AuthContext (SecureStore JWT)
│       └── screens/  # Search, Listing, Watchlist, Account
└── docker-compose.yml
```

**Tech stack:**

- **Backend:** Node.js 18, Express 4, PostgreSQL 15, node-cron, Stripe, JWT
- **Frontend:** React 18, React Router 6, Axios
- **Mobile:** React Native (Expo SDK 50), React Navigation 6, Expo SecureStore
- **Infrastructure:** Docker Compose (local), Vercel (frontend), Railway/Render (backend + DB)

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 15+ (or Docker)
- Yarn or npm

### 1. Clone & install

```bash
git clone https://github.com/glenthomas73-arch/reamped.git
cd reamped
```

### 2. Environment setup

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env — add your DB URL, JWT secret, Stripe keys

# Mobile
cp mobile/.env.example mobile/.env
# Edit mobile/.env — set EXPO_PUBLIC_API_URL
```

### 3. Database

```bash
# Start Postgres with Docker
docker compose up -d postgres

# Run migrations
cd backend && node src/db/migrate.js
```

### 4. Start services

```bash
# Terminal 1 — Backend API
cd backend && npm run dev

# Terminal 2 — Frontend
cd frontend && npm start

# Terminal 3 — Mobile (Expo)
cd mobile && npx expo start
```

The frontend runs at **http://localhost:3000**, the API at **http://localhost:3001**.

### 5. Docker Compose (full stack)

```bash
docker compose up --build
```

---

## 🔑 Environment Variables

### Backend (`backend/.env`)

| Variable | Description | Required |
|---|---|:---:|
| `DATABASE_URL` | PostgreSQL connection string | ✅ |
| `JWT_SECRET` | Secret for signing JWTs | ✅ |
| `STRIPE_SECRET_KEY` | Stripe secret key | ✅ |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret | ✅ |
| `STRIPE_PRO_PRICE_ID` | Stripe Price ID for Pro plan | ✅ |
| `REVERB_API_KEY` | Reverb API key | ✅ |
| `EBAY_APP_ID` | eBay Finding API app ID | ✅ |
| `PORT` | API port (default: 3001) | — |
| `FRONTEND_URL` | Frontend URL for CORS | — |

### Mobile (`mobile/.env`)

See `mobile/.env.example` for the full list.

---

## 📡 API Reference

All endpoints are prefixed with `/api`.

### Auth

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Register a new user |
| POST | `/auth/login` | — | Log in, receive JWT |
| GET  | `/auth/me` | Bearer | Get current user profile |

### Search

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/search?q=...&platforms=...&condition=...&max_price=...&sort=...&page=...` | Optional | Search all platforms |
| GET | `/search/:platform/:id` | Optional | Get single listing detail |

**Query params for search:**
- `q` — search query (required)
- `platforms` — comma-separated: `reverb,ebay,guitarcenter,sweetwater,facebook,gumtree`
- `condition` — `mint|excellent|good|fair|poor|new`
- `max_price` — number
- `sort` — `value_score|price_asc|price_desc|listed_at`
- `page` — page number (default: 1)

**Pro gating:** `facebook` and `gumtree` platforms are automatically excluded for non-Pro users.

### Watchlist

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET    | `/watchlist` | Bearer | Get saved listings |
| POST   | `/watchlist` | Bearer | Add listing to watchlist |
| DELETE | `/watchlist/:id` | Bearer | Remove from watchlist |

### Payments

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/payments/create-checkout` | Bearer | Create Stripe checkout session |
| POST | `/payments/cancel-subscription` | Bearer | Cancel Pro subscription |
| POST | `/payments/webhook` | — | Stripe webhook handler |

---

## 🤖 Workers (Cron Jobs)

Workers run on configurable schedules and upsert listings into the database:

| Worker | Schedule | Platform | Tier |
|---|---|---|---|
| `reverbWorker` | Every 30 min | Reverb | Free |
| `ebayWorker` | Every 45 min | eBay | Free |
| `guitarCenterWorker` | Every 60 min | Guitar Center | Free |
| `sweetwaterWorker` | Every 90 min | Sweetwater | Free |
| `facebookWorker` | Every 90 min | Facebook Marketplace | Pro |
| `gumtreeWorker` | Every 2 hrs | Gumtree UK | Pro |
| `priceAlertWorker` | Every 15 min | — | Pro |

Run a worker manually:
```bash
cd backend && npm run worker:reverb
```

---

## 📱 Mobile App

The React Native app is built with Expo and supports iOS and Android.

### Development

```bash
cd mobile
npx expo start
```

Scan the QR code with the Expo Go app, or press `i` for iOS simulator / `a` for Android emulator.

### Building for production

```bash
# Install EAS CLI
npm install -g eas-cli

# Login to your Expo account
eas login

# Build for internal testing
eas build --profile preview --platform all

# Submit to stores
eas submit --profile production --platform all
```

---

## 💳 Stripe Integration

1. Create a Product + Price in the Stripe Dashboard (recurring monthly)
2. Set `STRIPE_PRO_PRICE_ID` in your backend `.env`
3. Configure the webhook endpoint: `https://your-api.com/api/payments/webhook`
4. Listen for: `checkout.session.completed`, `customer.subscription.deleted`

---

## 🗄 Database Schema

Key tables:

- `users` — accounts, tier (`free`/`pro`), Stripe IDs
- `listings` — all scraped gear with platform, price, condition, scores, grades
- `watchlist` — user ↔ listing saved pairs
- `price_alerts` — Pro user alert rules
- `searches` — search analytics
- `affiliate_clicks` — click tracking for revenue attribution

Run `backend/src/db/schema.sql` against a fresh Postgres instance to set up the schema. The file also includes idempotent `ALTER TABLE` statements for safe migrations on existing deployments.

---

## 🧪 Development Notes

- **Value Scoring** is computed inline on search results: condition score + price delta % vs market average + seller trust score → final 0–100 value score and A–F grade
- **Pro gating** is enforced server-side in `/api/search` — the platform filter excludes `facebook` and `gumtree` for non-Pro JWTs
- **Rate limiting** — Facebook worker uses 5s delays between requests + 90-min cadence; Gumtree uses 4–10s jitter + 2-hour cadence

---

## 📄 License

MIT © glenthomas73-arch
