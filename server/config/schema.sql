-- Planora PostgreSQL Database Schema
-- Phase 2 — Relational Data Setup

-- 1. Create Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index on email for fast lookups during authentication
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

-- 2. Create Subjects Table
CREATE TABLE IF NOT EXISTS subjects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_subjects_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Index on user_id for fast relational queries and joins
CREATE INDEX IF NOT EXISTS idx_subjects_user_id ON subjects(user_id);
