"""
SQLite schema definitions as SQL strings.
"""

CREATE_BETS_TABLE = """
CREATE TABLE IF NOT EXISTS bets (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
    date                TEXT NOT NULL,
    sport               TEXT NOT NULL,
    league              TEXT NOT NULL,
    game                TEXT NOT NULL,
    market              TEXT NOT NULL,
    selection           TEXT NOT NULL,
    odds                REAL NOT NULL,
    opening_odds        REAL,
    closing_odds        REAL,
    model_probability   REAL NOT NULL,
    market_probability  REAL NOT NULL,
    expected_value      REAL NOT NULL,
    edge                REAL NOT NULL,
    risk_score          REAL NOT NULL,
    confidence_score    REAL NOT NULL,
    stake_pct           REAL NOT NULL,
    classification      TEXT NOT NULL,
    result              TEXT,
    profit_loss         REAL,
    roi                 REAL,
    closing_line_value  REAL,
    created_at          TEXT NOT NULL DEFAULT (datetime('now')),
    session_id          TEXT NOT NULL
);
"""

CREATE_PERFORMANCE_TABLE = """
CREATE TABLE IF NOT EXISTS performance (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    session_date    TEXT NOT NULL,
    sport           TEXT NOT NULL,
    market_type     TEXT NOT NULL,
    total_bets      INTEGER NOT NULL DEFAULT 0,
    wins            INTEGER NOT NULL DEFAULT 0,
    losses          INTEGER NOT NULL DEFAULT 0,
    pushes          INTEGER NOT NULL DEFAULT 0,
    total_staked    REAL NOT NULL DEFAULT 0.0,
    total_profit    REAL NOT NULL DEFAULT 0.0,
    roi             REAL NOT NULL DEFAULT 0.0,
    avg_clv         REAL,
    avg_ev          REAL,
    avg_confidence  REAL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);
"""

CREATE_MODEL_WEIGHTS_TABLE = """
CREATE TABLE IF NOT EXISTS model_weights (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    updated_at      TEXT NOT NULL DEFAULT (datetime('now')),
    ev_weight       REAL NOT NULL DEFAULT 0.40,
    win_prob_weight REAL NOT NULL DEFAULT 0.30,
    confidence_weight REAL NOT NULL DEFAULT 0.20,
    clv_weight      REAL NOT NULL DEFAULT 0.10,
    sport_modifiers TEXT NOT NULL DEFAULT '{}',
    sample_size     INTEGER NOT NULL DEFAULT 0,
    notes           TEXT
);
"""

CREATE_ELO_RATINGS_TABLE = """
CREATE TABLE IF NOT EXISTS elo_ratings (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    sport       TEXT NOT NULL,
    team        TEXT NOT NULL,
    rating      REAL NOT NULL DEFAULT 1500.0,
    games       INTEGER NOT NULL DEFAULT 0,
    updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(sport, team)
);
"""

ALL_TABLES = [
    CREATE_BETS_TABLE,
    CREATE_PERFORMANCE_TABLE,
    CREATE_MODEL_WEIGHTS_TABLE,
    CREATE_ELO_RATINGS_TABLE,
]
