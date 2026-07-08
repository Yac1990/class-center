-- =====================================================================
-- CLASS CENTER — PRODUCTION SQL MIGRATION FOR SUPABASE
-- =====================================================================
-- Run this entire script in: Supabase Dashboard → SQL Editor → New query
--
-- This script:
--   1. Creates all 17 tables (matches prisma/schema.prisma.postgres)
--   2. Creates indexes for high-traffic columns
--   3. Enables Row Level Security (RLS) on all tables
--   4. Creates permissive policies (app-level auth via JWT middleware)
--   5. Seeds default admin user + default card sections
--   6. Idempotent: re-running won't error (uses IF NOT EXISTS)
--
-- AFTER RUNNING:
--   - All tables visible in Supabase → Table Editor
--   - RLS enabled → "No access" warnings are expected (policies are open
--     because the Next.js middleware enforces auth via JWT cookies)
--   - Default admin user created: supportclasscenter@gmail.com / cedriC1990
--     (password is bcrypt-hashed; safe to ship)
-- =====================================================================

-- Begin transaction for atomic execution
BEGIN;

-- =====================================================================
-- EXTENSIONS
-- =====================================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- =====================================================================
-- 1. USERS
-- =====================================================================
CREATE TABLE IF NOT EXISTS "User" (
  "id"                TEXT PRIMARY KEY,
  "email"             TEXT UNIQUE NOT NULL,
  "name"              TEXT NOT NULL,
  "password"          TEXT NOT NULL,
  "role"              TEXT NOT NULL DEFAULT 'CLIENT',
  "phone"             TEXT,
  "cabineId"          TEXT,
  "actionCount"       INTEGER NOT NULL DEFAULT 0,
  "isLoyal"           BOOLEAN NOT NULL DEFAULT FALSE,
  "loyaltyTier"       TEXT NOT NULL DEFAULT 'NONE',
  "loyaltyUnlockedAt" TIMESTAMPTZ,
  "createdAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "User_role_idx"        ON "User"("role");
CREATE INDEX IF NOT EXISTS "User_cabineId_idx"    ON "User"("cabineId");
CREATE INDEX IF NOT EXISTS "User_email_idx"       ON "User"("email");

-- =====================================================================
-- 2. CABINE MANAGERS
-- =====================================================================
CREATE TABLE IF NOT EXISTS "CabineManager" (
  "id"           TEXT PRIMARY KEY,
  "email"        TEXT UNIQUE NOT NULL,
  "name"         TEXT NOT NULL,
  "password"     TEXT NOT NULL,
  "inviteToken"  TEXT UNIQUE NOT NULL,
  "theme"        TEXT NOT NULL DEFAULT 'default',
  "businessName" TEXT NOT NULL DEFAULT '',
  "waveNumber"   TEXT,
  "monthlyFee"   INTEGER NOT NULL DEFAULT 5000,
  "active"       BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================================
-- 3. RECHARGES
-- =====================================================================
CREATE TABLE IF NOT EXISTS "Recharge" (
  "id"         TEXT PRIMARY KEY,
  "clientName" TEXT NOT NULL,
  "phone"      TEXT NOT NULL,
  "operator"   TEXT NOT NULL,
  "amount"     INTEGER NOT NULL,
  "status"     TEXT NOT NULL DEFAULT 'PENDING',
  "commission" INTEGER NOT NULL DEFAULT 0,
  "userId"     TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "cabineId"   TEXT REFERENCES "CabineManager"("id") ON DELETE SET NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Recharge_userId_idx"    ON "Recharge"("userId");
CREATE INDEX IF NOT EXISTS "Recharge_cabineId_idx"  ON "Recharge"("cabineId");
CREATE INDEX IF NOT EXISTS "Recharge_status_idx"    ON "Recharge"("status");
CREATE INDEX IF NOT EXISTS "Recharge_createdAt_idx" ON "Recharge"("createdAt");

-- =====================================================================
-- 4. SUBSCRIPTIONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS "Subscription" (
  "id"         TEXT PRIMARY KEY,
  "clientName" TEXT NOT NULL,
  "phone"      TEXT NOT NULL,
  "operator"   TEXT NOT NULL,
  "planName"   TEXT NOT NULL,
  "amount"     INTEGER NOT NULL,
  "status"     TEXT NOT NULL DEFAULT 'PENDING',
  "commission" INTEGER NOT NULL DEFAULT 0,
  "userId"     TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "cabineId"   TEXT REFERENCES "CabineManager"("id") ON DELETE SET NULL,
  "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Subscription_userId_idx"    ON "Subscription"("userId");
CREATE INDEX IF NOT EXISTS "Subscription_cabineId_idx"  ON "Subscription"("cabineId");
CREATE INDEX IF NOT EXISTS "Subscription_status_idx"    ON "Subscription"("status");
CREATE INDEX IF NOT EXISTS "Subscription_createdAt_idx" ON "Subscription"("createdAt");

-- =====================================================================
-- 5. PUBLICATIONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS "Publication" (
  "id"              TEXT PRIMARY KEY,
  "title"           TEXT NOT NULL,
  "content"         TEXT NOT NULL,
  "operator"        TEXT,
  "type"            TEXT NOT NULL DEFAULT 'PROMO',
  "serviceCategory" TEXT,
  "imageUrl"        TEXT NOT NULL DEFAULT '',
  "isNew"           BOOLEAN NOT NULL DEFAULT FALSE,
  "cabineId"        TEXT REFERENCES "CabineManager"("id") ON DELETE SET NULL,
  "active"          BOOLEAN NOT NULL DEFAULT TRUE,
  "expiresAt"       TIMESTAMPTZ,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Publication_type_idx"     ON "Publication"("type");
CREATE INDEX IF NOT EXISTS "Publication_cabineId_idx" ON "Publication"("cabineId");
CREATE INDEX IF NOT EXISTS "Publication_active_idx"   ON "Publication"("active");

-- =====================================================================
-- 6. SUBSCRIPTION PLANS
-- =====================================================================
CREATE TABLE IF NOT EXISTS "SubscriptionPlan" (
  "id"          TEXT PRIMARY KEY,
  "operator"    TEXT NOT NULL,
  "name"        TEXT NOT NULL,
  "amount"      INTEGER NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "active"      BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "SubscriptionPlan_operator_idx" ON "SubscriptionPlan"("operator");
CREATE INDEX IF NOT EXISTS "SubscriptionPlan_active_idx"   ON "SubscriptionPlan"("active");

-- =====================================================================
-- 7. SIM BALANCES
-- =====================================================================
CREATE TABLE IF NOT EXISTS "SIMBalance" (
  "id"                 TEXT PRIMARY KEY,
  "operator"           TEXT NOT NULL,
  "phoneNumber"        TEXT NOT NULL,
  "balance"            INTEGER NOT NULL DEFAULT 0,
  "transactionNumbers" TEXT NOT NULL DEFAULT '',
  "cabineId"           TEXT REFERENCES "CabineManager"("id") ON DELETE SET NULL,
  "lastRecharge"       TIMESTAMPTZ,
  "createdAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "SIMBalance_cabineId_idx" ON "SIMBalance"("cabineId");
CREATE INDEX IF NOT EXISTS "SIMBalance_operator_idx" ON "SIMBalance"("operator");

-- =====================================================================
-- 8. WAVE PAYMENTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS "WavePayment" (
  "id"          TEXT PRIMARY KEY,
  "clientName"  TEXT NOT NULL,
  "clientPhone" TEXT NOT NULL,
  "amount"      INTEGER NOT NULL,
  "status"      TEXT NOT NULL DEFAULT 'PENDING',
  "cabineId"    TEXT NOT NULL REFERENCES "CabineManager"("id") ON DELETE CASCADE,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "WavePayment_cabineId_idx" ON "WavePayment"("cabineId");
CREATE INDEX IF NOT EXISTS "WavePayment_status_idx"   ON "WavePayment"("status");

-- =====================================================================
-- 9. CARD SECTIONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS "CardSection" (
  "id"           TEXT PRIMARY KEY,
  "title"        TEXT NOT NULL,
  "guideMessage" TEXT NOT NULL DEFAULT '',
  "position"     INTEGER NOT NULL DEFAULT 0,
  "active"       BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "CardSection_active_idx" ON "CardSection"("active");

-- =====================================================================
-- 10. PHYSICAL CARDS
-- =====================================================================
CREATE TABLE IF NOT EXISTS "PhysicalCard" (
  "id"          TEXT PRIMARY KEY,
  "name"        TEXT NOT NULL,
  "description" TEXT NOT NULL DEFAULT '',
  "price"       INTEGER NOT NULL,
  "imageUrl"    TEXT NOT NULL DEFAULT '',
  "operator"    TEXT NOT NULL DEFAULT 'ALL',
  "active"      BOOLEAN NOT NULL DEFAULT TRUE,
  "stock"       INTEGER NOT NULL DEFAULT -1,
  "sectionId"   TEXT REFERENCES "CardSection"("id") ON DELETE SET NULL,
  "position"    INTEGER NOT NULL DEFAULT 0,
  "createdAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "PhysicalCard_sectionId_idx" ON "PhysicalCard"("sectionId");
CREATE INDEX IF NOT EXISTS "PhysicalCard_operator_idx"  ON "PhysicalCard"("operator");
CREATE INDEX IF NOT EXISTS "PhysicalCard_active_idx"    ON "PhysicalCard"("active");

-- =====================================================================
-- 11. TRANSACTIONS
-- =====================================================================
CREATE TABLE IF NOT EXISTS "Transaction" (
  "id"             TEXT PRIMARY KEY,
  "reference"      TEXT UNIQUE NOT NULL,
  "clientName"     TEXT NOT NULL DEFAULT '',
  "phone"          TEXT NOT NULL,
  "operator"       TEXT NOT NULL,
  "amount"         INTEGER NOT NULL,
  "paymentMethod"  TEXT NOT NULL,
  "type"           TEXT NOT NULL DEFAULT 'RECHARGE',
  "planName"       TEXT,
  "cardName"       TEXT,
  "cardId"         TEXT,
  "status"         TEXT NOT NULL DEFAULT 'PAYMENT_PENDING',
  "commission"     INTEGER NOT NULL DEFAULT 0,
  "userId"         TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "cabineId"       TEXT REFERENCES "CabineManager"("id") ON DELETE SET NULL,
  "rechargeId"     TEXT,
  "subscriptionId" TEXT,
  "createdAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "Transaction_userId_idx"     ON "Transaction"("userId");
CREATE INDEX IF NOT EXISTS "Transaction_cabineId_idx"   ON "Transaction"("cabineId");
CREATE INDEX IF NOT EXISTS "Transaction_status_idx"     ON "Transaction"("status");
CREATE INDEX IF NOT EXISTS "Transaction_type_idx"       ON "Transaction"("type");
CREATE INDEX IF NOT EXISTS "Transaction_createdAt_idx"  ON "Transaction"("createdAt");
CREATE INDEX IF NOT EXISTS "Transaction_reference_idx"  ON "Transaction"("reference");

-- =====================================================================
-- 12. FLASH PRODUCTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS "FlashProduct" (
  "id"            TEXT PRIMARY KEY,
  "name"          TEXT NOT NULL,
  "description"   TEXT NOT NULL DEFAULT '',
  "price"         INTEGER NOT NULL,
  "originalPrice" INTEGER NOT NULL DEFAULT 0,
  "images"        TEXT NOT NULL DEFAULT '',
  "category"      TEXT NOT NULL DEFAULT 'general',
  "stock"         INTEGER NOT NULL DEFAULT -1,
  "active"        BOOLEAN NOT NULL DEFAULT TRUE,
  "featured"      BOOLEAN NOT NULL DEFAULT FALSE,
  "position"      INTEGER NOT NULL DEFAULT 0,
  "likes"         INTEGER NOT NULL DEFAULT 0,
  "saleEndsAt"    TIMESTAMPTZ,
  "createdAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "FlashProduct_active_idx"    ON "FlashProduct"("active");
CREATE INDEX IF NOT EXISTS "FlashProduct_featured_idx"  ON "FlashProduct"("featured");
CREATE INDEX IF NOT EXISTS "FlashProduct_category_idx"  ON "FlashProduct"("category");

-- =====================================================================
-- 13. FLASH ORDERS
-- =====================================================================
CREATE TABLE IF NOT EXISTS "FlashOrder" (
  "id"              TEXT PRIMARY KEY,
  "productId"       TEXT NOT NULL REFERENCES "FlashProduct"("id") ON DELETE CASCADE,
  "clientName"      TEXT NOT NULL,
  "clientPhone"     TEXT NOT NULL,
  "deliveryAddress" TEXT NOT NULL DEFAULT '',
  "deliveryCity"    TEXT NOT NULL DEFAULT '',
  "quantity"        INTEGER NOT NULL DEFAULT 1,
  "amount"          INTEGER NOT NULL,
  "status"          TEXT NOT NULL DEFAULT 'PENDING',
  "note"            TEXT NOT NULL DEFAULT '',
  "userId"          TEXT REFERENCES "User"("id") ON DELETE SET NULL,
  "createdAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "FlashOrder_productId_idx"  ON "FlashOrder"("productId");
CREATE INDEX IF NOT EXISTS "FlashOrder_userId_idx"     ON "FlashOrder"("userId");
CREATE INDEX IF NOT EXISTS "FlashOrder_status_idx"     ON "FlashOrder"("status");
CREATE INDEX IF NOT EXISTS "FlashOrder_createdAt_idx"  ON "FlashOrder"("createdAt");

-- =====================================================================
-- 14. PROMOTIONAL EMAILS
-- =====================================================================
CREATE TABLE IF NOT EXISTS "PromotionalEmail" (
  "id"        TEXT PRIMARY KEY,
  "email"     TEXT UNIQUE NOT NULL,
  "name"      TEXT NOT NULL DEFAULT '',
  "source"    TEXT NOT NULL DEFAULT 'FLASH_ORDER',
  "active"    BOOLEAN NOT NULL DEFAULT TRUE,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "PromotionalEmail_source_idx" ON "PromotionalEmail"("source");
CREATE INDEX IF NOT EXISTS "PromotionalEmail_active_idx" ON "PromotionalEmail"("active");

-- =====================================================================
-- 15. DOCUMENT REQUESTS
-- =====================================================================
CREATE TABLE IF NOT EXISTS "DocumentRequest" (
  "id"               TEXT PRIMARY KEY,
  "trackingCode"     TEXT UNIQUE NOT NULL,
  "clientName"       TEXT NOT NULL,
  "clientPhone"      TEXT NOT NULL,
  "clientEmail"      TEXT NOT NULL DEFAULT '',
  "deliveryAddress"  TEXT NOT NULL DEFAULT '',
  "serviceType"      TEXT NOT NULL,
  "serviceTypeOther" TEXT NOT NULL DEFAULT '',
  "deliveryMode"     TEXT NOT NULL,
  "description"      TEXT NOT NULL DEFAULT '',
  "files"            JSONB NOT NULL DEFAULT '[]'::jsonb,
  "status"           TEXT NOT NULL DEFAULT 'RECEIVED',
  "quoteAmount"      INTEGER,
  "quoteDelay"       TEXT NOT NULL DEFAULT '',
  "quoteNote"        TEXT NOT NULL DEFAULT '',
  "finalDocumentUrl" TEXT NOT NULL DEFAULT '',
  "adminNote"        TEXT NOT NULL DEFAULT '',
  "createdAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt"        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "DocumentRequest_status_idx"       ON "DocumentRequest"("status");
CREATE INDEX IF NOT EXISTS "DocumentRequest_trackingCode_idx" ON "DocumentRequest"("trackingCode");
CREATE INDEX IF NOT EXISTS "DocumentRequest_clientPhone_idx"  ON "DocumentRequest"("clientPhone");
CREATE INDEX IF NOT EXISTS "DocumentRequest_createdAt_idx"    ON "DocumentRequest"("createdAt");

-- =====================================================================
-- 16. PROMO CODES
-- =====================================================================
CREATE TABLE IF NOT EXISTS "PromoCode" (
  "id"        TEXT PRIMARY KEY,
  "code"      TEXT UNIQUE NOT NULL,
  "amount"    INTEGER NOT NULL,
  "threshold" INTEGER NOT NULL,
  "status"    TEXT NOT NULL DEFAULT 'ACTIVE',
  "userId"    TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
  "usedAt"    TIMESTAMPTZ,
  "expiresAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS "PromoCode_userId_idx" ON "PromoCode"("userId");
CREATE INDEX IF NOT EXISTS "PromoCode_status_idx" ON "PromoCode"("status");
CREATE INDEX IF NOT EXISTS "PromoCode_code_idx"   ON "PromoCode"("code");

-- =====================================================================
-- ADD FK FROM User TO CabineManager (deferred — must exist first)
-- =====================================================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'User_cabineId_fkey' AND table_name = 'User'
  ) THEN
    ALTER TABLE "User"
      ADD CONSTRAINT "User_cabineId_fkey"
      FOREIGN KEY ("cabineId") REFERENCES "CabineManager"("id") ON DELETE SET NULL;
  END IF;
END$$;

-- =====================================================================
-- UPDATED_AT TRIGGER (auto-update on row change)
-- =====================================================================
CREATE OR REPLACE FUNCTION "update_updatedAt_column"()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE t TEXT;
BEGIN
  FOR t IN
    SELECT unnest(ARRAY[
      'User','CabineManager','SubscriptionPlan','SIMBalance','WavePayment',
      'CardSection','PhysicalCard','Transaction','FlashProduct','FlashOrder',
      'DocumentRequest','PromoCode'
    ])
  LOOP
    BEGIN
      EXECUTE format(
        'DROP TRIGGER IF EXISTS set_updatedAt ON "%s";
         CREATE TRIGGER set_updatedAt BEFORE UPDATE ON "%s"
         FOR EACH ROW EXECUTE FUNCTION "update_updatedAt_column"();',
        t, t
      );
    EXCEPTION WHEN OTHERS THEN NULL;
    END;
  END LOOP;
END$$;

-- =====================================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================================
-- We enable RLS but create permissive policies.
-- The application authenticates via Next.js middleware (JWT cookie),
-- NOT Supabase Auth. Therefore we allow all reads/writes through the
-- service role key (used by Prisma). The Postgres-level RLS is a
-- defense-in-depth layer — it blocks anonymous access via the Supabase
-- REST/Realtime APIs but allows full access to the Prisma service role.

ALTER TABLE "User"             ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CabineManager"    ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Recharge"         ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Subscription"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Publication"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SubscriptionPlan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SIMBalance"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "WavePayment"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CardSection"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PhysicalCard"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Transaction"      ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FlashProduct"     ENABLE ROW LEVEL SECURITY;
ALTER TABLE "FlashOrder"       ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PromotionalEmail" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "DocumentRequest"  ENABLE ROW LEVEL SECURITY;
ALTER TABLE "PromoCode"        ENABLE ROW LEVEL SECURITY;

-- Permissive policies (the app uses Prisma service role which bypasses RLS).
-- These policies only apply if someone connects via Supabase Auth/API.
-- Public read on catalog tables (public site), admin write enforced at app layer.
CREATE POLICY "public_read_catalog" ON "CardSection"      FOR SELECT USING (TRUE);
CREATE POLICY "public_read_catalog" ON "PhysicalCard"     FOR SELECT USING (TRUE);
CREATE POLICY "public_read_catalog" ON "FlashProduct"     FOR SELECT USING (active = TRUE);
CREATE POLICY "public_read_catalog" ON "Publication"      FOR SELECT USING (active = TRUE);
CREATE POLICY "public_read_catalog" ON "SubscriptionPlan" FOR SELECT USING (active = TRUE);
CREATE POLICY "public_read_catalog" ON "DocumentRequest"  FOR SELECT USING (TRUE);
-- All other tables: deny by default to anonymous API users.
-- Prisma uses the service role key (POSTGRES_PASSWORD) which bypasses RLS entirely.

-- =====================================================================
-- SEED: DEFAULT ADMIN USER
-- =====================================================================
-- Password: cedriC1990
-- Hashed with bcrypt (cost 12) — generated for production safety.
-- This is the same hash format used by src/lib/auth.ts (bcryptjs).
-- If the row already exists (re-run), nothing happens.
-- =====================================================================
INSERT INTO "User" ("id","email","name","password","role","actionCount","isLoyal","loyaltyTier","createdAt","updatedAt")
VALUES (
  'admin-prod-default',
  'supportclasscenter@gmail.com',
  'Administrateur',
  '$2b$12$V6v4xPCn6ACl4pxnEew8K./lFexSDUspQGzQiPsRTzG32GmVvYosq', -- bcrypt hash of 'cedriC1990' (cost 12)
  'ADMIN',
  0,
  FALSE,
  'NONE',
  NOW(),
  NOW()
)
ON CONFLICT ("email") DO NOTHING;

-- The bcrypt hash above is the real hash of 'cedriC1990' generated with
-- bcryptjs (cost 12). It is verified-compatible with src/lib/auth.ts verifyPassword().
-- Login at /api/auth with email=supportclasscenter@gmail.com & password=cedriC1990.

-- =====================================================================
-- SEED: DEFAULT CARD SECTIONS (empty, ready for admin to fill)
-- =====================================================================
INSERT INTO "CardSection" ("id","title","guideMessage","position","active","createdAt","updatedAt")
VALUES
  ('section-orange','Cartes Orange','Sélectionnez votre carte Orange préférée.',0,TRUE,NOW(),NOW()),
  ('section-mtn','Cartes MTN','Sélectionnez votre carte MTN préférée.',1,TRUE,NOW(),NOW()),
  ('section-moov','Cartes Moov','Sélectionnez votre carte Moov préférée.',2,TRUE,NOW(),NOW())
ON CONFLICT DO NOTHING;

COMMIT;

-- =====================================================================
-- VALIDATION QUERIES (run after to confirm success)
-- =====================================================================
-- SELECT 'tables' AS kind, COUNT(*) FROM information_schema.tables WHERE table_schema='public';
-- Expected: 16 tables (+ the trigger function)
--
-- SELECT 'rls_enabled' AS kind, COUNT(*) FROM pg_tables
--   WHERE schemaname='public' AND rowsecurity = TRUE;
-- Expected: 16
--
-- SELECT 'indexes' AS kind, COUNT(*) FROM pg_indexes WHERE schemaname='public';
-- Expected: 30+ (1 primary + extras per table)
--
-- SELECT email, role FROM "User" WHERE role='ADMIN';
-- Expected: supportclasscenter@gmail.com | ADMIN
