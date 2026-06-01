-- ReAmped Database Schema
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               TEXT UNIQUE NOT NULL,
    display_name        TEXT,
    password_hash       TEXT,
    tier                TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free','pro')),
    stripe_customer_id  TEXT UNIQUE,
    stripe_subscription_id TEXT,
    subscription_ends_at TIMESTAMPTZ,
    email_verified      BOOLEAN DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

CREATE TABLE IF NOT EXISTS listings (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    external_id       TEXT NOT NULL,
    platform          TEXT NOT NULL CHECK (platform IN ('reverb','ebay','guitarcenter','sweetwater')),
    title             TEXT NOT NULL,
    description       TEXT,
    price             NUMERIC(10,2) NOT NULL,
    currency          CHAR(3) NOT NULL DEFAULT 'USD',
    condition         TEXT CHECK (condition IN ('mint','excellent','good','fair','poor','new')),
    category          TEXT,
    brand             TEXT,
    model             TEXT,
    location_city     TEXT,
    location_country  TEXT DEFAULT 'US',
    shipping_available BOOLEAN DEFAULT TRUE,
    shipping_cost     NUMERIC(8,2),
    listing_url       TEXT NOT NULL,
    affiliate_url     TEXT,
    image_urls        TEXT[] DEFAULT '{}',
    seller_name       TEXT,
    seller_rating     NUMERIC(3,2),
    seller_reviews    INTEGER DEFAULT 0,
    value_score       NUMERIC(5,2),
    price_score       NUMERIC(5,2),
    condition_score   NUMERIC(5,2),
    trust_score       NUMERIC(5,2),
    is_active         BOOLEAN DEFAULT TRUE,
    listed_at         TIMESTAMPTZ,
    fetched_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(platform, external_id)
  );

CREATE INDEX IF NOT EXISTS idx_listings_platform ON listings(platform);
CREATE INDEX IF NOT EXISTS idx_listings_category ON listings(category);
CREATE INDEX IF NOT EXISTS idx_listings_brand_model ON listings(brand, model);
CREATE INDEX IF NOT EXISTS idx_listings_price ON listings(price);
CREATE INDEX IF NOT EXISTS idx_listings_value_score ON listings(value_score DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_listings_active ON listings(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_listings_search ON listings USING GIN(
    to_tsvector('english', title || ' ' || COALESCE(brand,'') || ' ' || COALESCE(model,''))
  );

CREATE TABLE IF NOT EXISTS price_alerts (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    search_query  TEXT,
    brand         TEXT,
    model         TEXT,
    max_price     NUMERIC(10,2),
    condition_min TEXT,
    platforms     TEXT[] DEFAULT '{reverb,ebay}',
    is_active     BOOLEAN DEFAULT TRUE,
    last_triggered TIMESTAMPTZ,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

CREATE TABLE IF NOT EXISTS affiliate_clicks (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id           UUID REFERENCES users(id) ON DELETE SET NULL,
    listing_id        UUID REFERENCES listings(id) ON DELETE SET NULL,
    platform          TEXT NOT NULL,
    session_id        TEXT,
    clicked_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    converted         BOOLEAN DEFAULT FALSE,
    commission_earned NUMERIC(8,2)
  );

CREATE TABLE IF NOT EXISTS watchlist (
    id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    listing_id UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
    added_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, listing_id)
  );
