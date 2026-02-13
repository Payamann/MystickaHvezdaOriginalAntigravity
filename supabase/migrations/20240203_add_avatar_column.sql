-- Add avatar column to users table for profile picture (stores emoji or identifier)
alter table users add column if not exists avatar text;
