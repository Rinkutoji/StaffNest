-- =========================================================
-- Migration: adds phone + profile_image to the users table.
-- Run this in phpMyAdmin's SQL tab on your EXISTING database
-- if you don't want to re-import the whole schema from scratch.
-- Safe to run once; if the columns already exist, MySQL will
-- show a harmless "Duplicate column name" error you can ignore.
-- =========================================================

ALTER TABLE users
  ADD COLUMN phone VARCHAR(30) DEFAULT NULL AFTER password,
  ADD COLUMN profile_image VARCHAR(255) DEFAULT NULL AFTER phone;
