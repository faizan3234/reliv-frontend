-- Reliv Ads V1 Schema Migration
-- Persistent relational storage for air-gapped Raspberry Pi kiosk DOOH advertising

-- 1. Common Campaign Creative & Financial Metadata
CREATE TABLE IF NOT EXISTS ad_campaigns (
    campaign_id TEXT PRIMARY KEY,
    brand_name TEXT,
    media_type TEXT NOT NULL,             -- 'image' | 'video'
    aspect_ratio TEXT NOT NULL,           -- '16:9' | 'portrait' | 'square'
    is_true_16x9 INTEGER NOT NULL DEFAULT 0,
    has_audio INTEGER NOT NULL DEFAULT 0,
    original_path TEXT,
    prepared_path TEXT,                   -- path to prepared 1920x1080 normalized asset
    media_sha256 TEXT,                    -- SHA-256 of prepared asset (bound to payment)
    price_paise INTEGER NOT NULL,         -- Price in paise (e.g. 11700 for Rs.117)
    pricing_version INTEGER DEFAULT 1,
    confirmation_code_hmac TEXT,          -- HMAC-SHA256 of the 4-digit activation code
    attempt_count INTEGER DEFAULT 0,      -- Failed verification attempts
    locked_until INTEGER DEFAULT 0,       -- Timestamp in ms until lockout expires
    status TEXT NOT NULL DEFAULT 'DRAFT', -- DRAFT, PROCESSING, PENDING_PAYMENT, ACTIVE, SCHEDULED, EXPIRED, CANCELLED
    created_at TEXT NOT NULL,
    paid_at TEXT,
    activated_at TEXT,
    expired_at TEXT
);

-- 2. Multi-Venue Scheduling Assignments
CREATE TABLE IF NOT EXISTS ad_campaign_venues (
    campaign_id TEXT NOT NULL,
    venue_id TEXT NOT NULL,               -- 'gurukul' | 'dps-megacity' | 'beeu-resorts'
    status TEXT NOT NULL DEFAULT 'SCHEDULED', -- 'ACTIVE' | 'SCHEDULED' | 'PENDING_APPROVAL' | 'EXPIRED'
    start_date TEXT NOT NULL,             -- 'YYYY-MM-DD'
    end_date TEXT NOT NULL,               -- 'YYYY-MM-DD'
    is_all_day INTEGER NOT NULL DEFAULT 1,
    daily_start_hour INTEGER DEFAULT 0,   -- 0-23
    daily_end_hour INTEGER DEFAULT 24,    -- 1-24
    PRIMARY KEY (campaign_id, venue_id),
    FOREIGN KEY (campaign_id) REFERENCES ad_campaigns(campaign_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ad_venues_schedule ON ad_campaign_venues (
    venue_id, status, start_date, end_date, daily_start_hour, daily_end_hour
);

-- 3. Resilient 4MB Chunked File Upload Storage
CREATE TABLE IF NOT EXISTS ad_upload_chunks (
    upload_id TEXT NOT NULL,
    chunk_index INTEGER NOT NULL,
    total_chunks INTEGER NOT NULL,
    chunk_sha256 TEXT,
    chunk_path TEXT NOT NULL,
    received_at INTEGER NOT NULL,
    PRIMARY KEY (upload_id, chunk_index)
);

-- 4. Lightweight Playback Tracking
CREATE TABLE IF NOT EXISTS ad_play_events (
    event_id INTEGER PRIMARY KEY AUTOINCREMENT,
    campaign_id TEXT NOT NULL,
    venue_id TEXT NOT NULL,
    started_at TEXT NOT NULL,
    completed INTEGER NOT NULL DEFAULT 0,          -- 1 if played full impression, 0 if interrupted
    interrupted_by_user INTEGER NOT NULL DEFAULT 0, -- 1 if touch exited early
    FOREIGN KEY (campaign_id) REFERENCES ad_campaigns(campaign_id)
);
