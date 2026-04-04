# Project Context — Personal Finance + Business Management App

## Project summary

This project is a mobile application built with React Native and Expo.

Its main purpose is to help people manage:

* personal finances
* budgets
* savings goals
* one or many small businesses

The product is **offline-first**.
The mobile app must work correctly without internet connection.
Local persistence is a critical part of the architecture, not an optional enhancement.

The backend will exist to support:

* sync
* backups
* multi-device support
* advanced reports
* future ecosystem features

The backend is **not** the primary source of truth during local operation.
The device stores data locally first and syncs later.

---

## Product vision

This is not only a personal finance app.

It is a modular platform that starts with:

* incomes
* expenses
* wallets
* budgets
* goals

Then scales into:

* businesses
* sales
* purchases
* products
* services
* stock
* reports

And later into:

* gamification
* loyalty between businesses
* cross-business rewards
* merchant network features

---

## Architecture principles

### 1. Offline-first

All important actions must be able to work offline.

### 2. Local-first data flow

The app writes locally first, then syncs.

### 3. Clear domain separation

Do not mix:

* financial transactions
* business operations
* inventory movement

### 4. Reusable data model

Avoid duplicated models for personal and business contexts.

### 5. Modular growth

The project must be organized by domain so MVP 1, MVP 2 and MVP 3 can evolve without large rewrites.

---

## Main product domains

* auth
* user
* personal-finance
* businesses
* sales
* purchases
* inventory
* reports
* sync
* settings
* gamification (future)
* loyalty (future)

---

## MVP definition

### MVP 1

Personal finance:

* user
* personal profile
* wallets
* categories
* transactions
* budgets
* budget categories
* goals
* goal contributions
* app settings
* sync queue

### MVP 2

Business management:

* businesses
* customers
* suppliers
* products
* services
* sales
* sale items
* purchases
* purchase items

### MVP 3

Inventory:

* inventory items
* stock movements

---

## Data model rules

### Shared sync columns

Most local entities use:

* local_id
* server_id
* sync_status
* version
* created_at
* updated_at
* deleted_at

### owner model

Many entities belong to:

* personal
* business

This is represented using:

* owner_type
* owner_local_id

### Important modeling decisions

* use a single `transactions` table for both personal and business financial movements
* keep `sales` separate from `transactions`
* keep `products` and `services` separate
* use `inventory_items` as stock snapshot
* use `stock_movements` as stock history
* historical rows must keep snapshots like `item_name_snapshot`

---

## Technical stack

### Mobile app

* React Native
* Expo SDK 54
* TypeScript
* Expo Router
* SQLite for local database
* SecureStore for sensitive local data
* Zustand for local UI/app state
* TanStack Query for server sync/query state

### Backend

* Node.js
* NestJS
* MongoDB Atlas

---

## Coding rules

### General

* prefer small, focused modules
* prefer explicit types
* avoid premature abstractions
* avoid hidden magic
* prioritize readability

### Data access

* centralize database access helpers
* use repositories/services per domain
* do not scatter raw SQL everywhere

### UI

* keep screens simple
* forms should be reusable
* avoid coupling screens directly to database implementation details

### Sync

* design with sync in mind even if sync is not implemented yet
* never omit sync metadata from persistent models

---

## Folder organization preference

The codebase should be organized by domain and infrastructure.

Suggested top-level structure:

* app
* src

  * features
  * components
  * database
  * lib
  * hooks
  * store
  * types
  * constants

Inside `features`, organize by domain:

* auth
* personal-finance
* businesses
* inventory
* sync
* settings

Each feature should grow with:

* types
* repository
* services
* hooks
* components

---

## What Codex should avoid

* do not generate backend code yet unless explicitly requested
* do not couple everything to remote APIs
* do not skip SQLite structure
* do not invent new data model rules without aligning with the defined schema
* do not optimize for web first
* do not introduce large state libraries unless requested

---

## Current goal

Right now the focus is:

1. define local project structure
2. implement SQLite setup
3. create local schema runner
4. create database helpers
5. create first repositories for MVP 1
6. only then start building screens

---

## Expected development order

1. database foundation
2. shared types
3. repositories
4. seed/basic setup
5. first screens
6. sync layer later

---
