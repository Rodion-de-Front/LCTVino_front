export const schemaSql = `
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password_hash TEXT,
  avatar TEXT NOT NULL,
  bio TEXT NOT NULL DEFAULT '',
  location TEXT NOT NULL DEFAULT '',
  onboarded BOOLEAN NOT NULL DEFAULT FALSE,
  preferences JSONB,
  posts_count INTEGER NOT NULL DEFAULT 0,
  reviews_count INTEGER NOT NULL DEFAULT 0,
  followers_count INTEGER NOT NULL DEFAULT 0,
  following_count INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wines (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  producer TEXT NOT NULL,
  country TEXT NOT NULL,
  region TEXT NOT NULL,
  color TEXT NOT NULL,
  category TEXT NOT NULL,
  sweetness TEXT NOT NULL,
  grapes TEXT[] NOT NULL,
  year INTEGER NOT NULL,
  abv DOUBLE PRECISION NOT NULL,
  price INTEGER NOT NULL,
  rating DOUBLE PRECISION NOT NULL,
  ratings_count INTEGER NOT NULL,
  image TEXT NOT NULL,
  description TEXT NOT NULL,
  pairing TEXT[] NOT NULL,
  awards TEXT[] NOT NULL,
  taste JSONB NOT NULL,
  similar_ids TEXT[] NOT NULL
);

CREATE TABLE IF NOT EXISTS posts (
  id TEXT PRIMARY KEY,
  author_id TEXT NOT NULL REFERENCES users(id),
  wine_id TEXT NOT NULL REFERENCES wines(id),
  wine_name TEXT NOT NULL,
  image TEXT NOT NULL,
  text TEXT NOT NULL,
  rating DOUBLE PRECISION NOT NULL,
  tags TEXT[] NOT NULL DEFAULT '{}',
  likes_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS post_likes (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS post_saves (
  post_id TEXT NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (post_id, user_id)
);

CREATE TABLE IF NOT EXISTS reviews (
  id TEXT PRIMARY KEY,
  wine_id TEXT NOT NULL REFERENCES wines(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  rating INTEGER NOT NULL,
  text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS cellar (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  wine_id TEXT NOT NULL REFERENCES wines(id),
  favorite BOOLEAN NOT NULL DEFAULT FALSE,
  scanned BOOLEAN NOT NULL DEFAULT FALSE,
  rating INTEGER,
  note TEXT NOT NULL DEFAULT '',
  added_at TIMESTAMPTZ NOT NULL,
  UNIQUE (user_id, wine_id)
);

CREATE TABLE IF NOT EXISTS follows (
  follower_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  following_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE IF NOT EXISTS id_seq (
  id INTEGER PRIMARY KEY,
  value INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS posts_created_at_idx ON posts (created_at DESC);
CREATE INDEX IF NOT EXISTS comments_post_idx ON comments (post_id);
CREATE INDEX IF NOT EXISTS reviews_wine_idx ON reviews (wine_id);
CREATE INDEX IF NOT EXISTS cellar_user_idx ON cellar (user_id);

ALTER TABLE cellar ADD COLUMN IF NOT EXISTS scanned BOOLEAN NOT NULL DEFAULT FALSE;
`
