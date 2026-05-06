-- Force drop/recreate local dev database.
-- Requires connecting to a different database (e.g. "postgres").
SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'billguard'
  AND pid <> pg_backend_pid();

DROP DATABASE IF EXISTS billguard;
CREATE DATABASE billguard;

