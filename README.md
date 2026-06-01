# ⚡ ReAmped

**Every deal. One search.**

ReAmped is a cross-platform used music gear search and deal aggregator. It searches Reverb, eBay, Guitar Center Used, and more — simultaneously — then scores every listing with an intelligent value algorithm so musicians always find the best deal.

---

## Features

- **Cross-platform search** — Reverb, eBay (Phase 1), Guitar Center Used, Sweetwater Used (Phase 2)
- - **Value Score** — Proprietary 0–100 deal score using price competitiveness, condition, seller trust, and freshness
  - - **Price Alerts** — Pro users set alerts for specific gear and get notified when deals appear
    - - **Affiliate monetization** — Revenue generated from click-throughs, enabling a free tier
      - - **Free + Pro tiers** — Core search free forever; Pro unlocks alerts, watchlists, price history
       
        - ---

        ## Tech Stack

        | Layer | Technology |
        |---|---|
        | Frontend | React 18, React Query, React Router |
        | Mobile | React Native (iOS + Android) — Phase 2 |
        | Backend API | Node.js, Express |
        | Database | PostgreSQL 16 |
        | Cache | Redis 7 |
        | Payments | Stripe |
        | Workers | node-cron scheduled aggregation |

        ---

        ## Project Structure

        ```
        reamped/
        ├── backend/
        │   ├── src/
        │   │   ├── server.js          # Express app + worker scheduling
        │   │   ├── routes/
        │   │   │   ├── search.js      # GET /api/search — core search endpoint
        │   │   │   ├── auth.js        # Authentication routes
        │   │   │   ├── alerts.js      # Price alert CRUD
        │   │   │   └── subscriptions.js # Stripe subscription handling
        │   │   ├── workers/
        │   │   │   ├── reverbFetcher.js  # Reverb API aggregation worker
        │   │   │   └── ebayFetcher.js    # eBay Browse API worker
        │   │   ├── services/
        │   │   │   └── scorer.js      # Value score algorithm
        │   │   ├── db/
        │   │   │   └── schema.sql     # Full PostgreSQL schema
        │   │   └── utils/
        │   │       ├── normalizers.js # Condition/category normalization
        │   │       └── logger.js      # Winston logger
        │   ├── .env.example           # Environment variable template
        │   └── package.json
        ├── frontend/
        │   ├── src/
        │   │   ├── App.js             # Root app + router
        │   │   ├── pages/
        │   │   │   ├── SearchPage.js  # Main search UI
        │   │   │   ├── ListingPage.js # Listing detail view
        │   │   │   └── PricingPage.js # Pro subscription page
        │   │   └── components/
        │   │       ├── Header.js      # Navigation header
        │   │       ├── ListingCard.js # Gear listing card with value badge
        │   │       ├── FilterPanel.js # Search filters
        │   │       └── SearchHero.js  # Landing hero
        │   └── package.json
        └── docker-compose.yml         # Full local dev stack
        ```

        ---

        ## Getting Started

        ### Prerequisites
        - Node.js 18+
        - - Docker + Docker Compose (recommended)
          - - Reverb API token (apply at reverb.com/page/api)
            - - eBay Developer account
             
              - ### Quick Start with Docker
             
              - ```bash
                git clone https://github.com/glenthomas73-arch/reamped.git
                cd reamped

                # Set up environment
                cp backend/.env.example backend/.env
                # Edit backend/.env with your API keys

                # Start all services
                docker-compose up

                # App runs at:
                # Frontend: http://localhost:3000
                # Backend API: http://localhost:3001
                # Health check: http://localhost:3001/health
                ```

                ### Manual Setup

                ```bash
                # Backend
                cd backend
                npm install
                cp .env.example .env
                # Edit .env with your API keys and DB credentials
                node src/db/migrate.js   # Run schema migrations
                npm run dev

                # Frontend (new terminal)
                cd frontend
                npm install
                npm start
                ```

                ---

                ## Value Score Algorithm

                Every listing receives a score from 0–100 calculated at ingestion time:

                | Factor | Weight | Description |
                |---|---|---|
                | Price competitiveness | 40% | Percentile rank vs. comparable listings (same brand/model/condition) from 90 days |
                | Condition | 25% | Mint=100, Excellent=82, Good=62, Fair=38, Poor=18 |
                | Seller trust | 20% | Rating × confidence (adjusted for review count) |
                | Freshness | 10% | Listings under 1h score 100, declining over time |
                | Shipping | 5% | Free shipping = 100, >$50 = 20 |

                ---

                ## Revenue Model

                1. **Affiliate links** — All outbound clicks are tagged. Reverb (~3-5%), eBay Partner Network (1-4%), Amazon (3-6% on instruments).
                2. 2. **Pro subscriptions** — $6.99/month or $59.99/year (via Stripe). Unlocks price alerts, watchlists, price history charts.
                   3. 3. **Featured placements** — Phase 2: local dealers pay for visibility in "new gear" comparisons.
                     
                      4. ---
                     
                      5. ## Roadmap
                     
                      6. - [x] Phase 1: Reverb + eBay aggregation, value scoring, web app
                         - [ ] - [ ] Phase 2: Guitar Center Used, Sweetwater Used, Pro subscriptions, price alerts
                         - [ ] - [ ] Phase 3: Facebook Marketplace, React Native mobile apps, international platforms (GumTree UK)
                         - [ ] - [ ] Phase 4: New gear comparison, manufacturer partnerships, B2B data API
                        
                         - [ ] ---
                        
                         - [ ] ## License
                        
                         - [ ] MIT — see [LICENSE](LICENSE)
                        
                         - [ ] ---
                        
                         - [ ] *Built for musicians, by people who've spent too long searching for deals.*
