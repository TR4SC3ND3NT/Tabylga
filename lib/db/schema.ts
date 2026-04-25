// Table DDL — consumed by migrations.ts, not executed directly.

export const CREATE_MIGRATIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS _migrations (
    version   INTEGER PRIMARY KEY,
    run_at    INTEGER NOT NULL
  )
`;

export const CREATE_USERS_TABLE = `
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT    PRIMARY KEY,
    phone       TEXT    UNIQUE NOT NULL,
    name        TEXT,
    language    TEXT    NOT NULL DEFAULT 'en',
    avatar_url  TEXT,
    created_at  INTEGER NOT NULL
  )
`;

export const CREATE_PLACES_TABLE = `
  CREATE TABLE IF NOT EXISTS places (
    id        TEXT    PRIMARY KEY,
    osm_id    INTEGER,
    name      TEXT    NOT NULL,
    name_en   TEXT,
    name_ky   TEXT,
    lat       REAL    NOT NULL,
    lon       REAL    NOT NULL,
    category  TEXT    NOT NULL,
    region    TEXT    NOT NULL,
    tags      TEXT,
    photo_url TEXT
  )
`;

export const CREATE_TRIPS_TABLE = `
  CREATE TABLE IF NOT EXISTS trips (
    id             TEXT    PRIMARY KEY,
    user_id        TEXT    NOT NULL,
    title          TEXT    NOT NULL,
    purpose        TEXT,
    days           INTEGER,
    budget_usd     INTEGER,
    companions     TEXT,
    status         TEXT    NOT NULL DEFAULT 'draft',
    created_at     INTEGER NOT NULL,
    itinerary_json TEXT
  )
`;

export const CREATE_TRANSACTIONS_TABLE = `
  CREATE TABLE IF NOT EXISTS transactions (
    id               TEXT    PRIMARY KEY,
    user_id          TEXT    NOT NULL,
    type             TEXT    NOT NULL,
    amount_usd       REAL    NOT NULL,
    amount_kgs       REAL    NOT NULL,
    merchant_name    TEXT,
    status           TEXT    NOT NULL DEFAULT 'completed',
    offline_pending  INTEGER NOT NULL DEFAULT 0,
    created_at       INTEGER NOT NULL,
    metadata_json    TEXT
  )
`;

export const CREATE_MERCHANTS_TABLE = `
  CREATE TABLE IF NOT EXISTS merchants (
    id             TEXT    PRIMARY KEY,
    user_id        TEXT    NOT NULL,
    business_name  TEXT    NOT NULL,
    category       TEXT,
    balance_kgs    REAL    NOT NULL DEFAULT 0,
    verified       INTEGER NOT NULL DEFAULT 0,
    created_at     INTEGER NOT NULL
  )
`;

export const CREATE_REVIEWS_TABLE = `
  CREATE TABLE IF NOT EXISTS reviews (
    id               TEXT    PRIMARY KEY,
    user_id          TEXT    NOT NULL,
    target_type      TEXT    NOT NULL,
    target_id        TEXT    NOT NULL,
    rating           INTEGER NOT NULL,
    sub_ratings_json TEXT,
    review_text      TEXT,
    created_at       INTEGER NOT NULL
  )
`;

export const CREATE_INDEXES = [
  `CREATE INDEX IF NOT EXISTS idx_places_category_region   ON places       (category, region)`,
  `CREATE INDEX IF NOT EXISTS idx_transactions_user_date   ON transactions  (user_id, created_at)`,
  `CREATE INDEX IF NOT EXISTS idx_trips_user_status        ON trips         (user_id, status)`,
];
