# Prisma migrations

## Order of application

Migrations apply in timestamp order. Two June 2026 migrations are **not duplicates**:

1. `20260621000000_order_type_enum_and_indexes` — converts `Order.orderType` and `Guest.sentVia` to PostgreSQL enums; adds composite indexes on `Order`.
2. `20260621080906_order_type_enum_and_indexes` — replaces unique `(invitationId, phone)` on `Guest` with a non-unique index (allows duplicate phone numbers per invitation when phone is empty or reused).

Both are required on a fresh database. Do not delete either without squashing into a new baseline migration.

## WishReaction migration order

1. `20260703000000_wish_reactions` — renames `WishLike` → `WishReaction`, adds `emoji` column.
2. `20260704000000_wish_reaction_constraints` — renames legacy constraint/index names and drops `Guest_invitationId_phone_idx`.

The auto-generated `20260701174705_` folder was removed (it ran before the table rename and broke fresh deploys).

## Integrity rules

- Never edit historical migration folders that are already committed.
- Any schema fix must be a new timestamped migration directory.
- CI validates a clean PostgreSQL database with `prisma migrate deploy`.
- If a migration fails on clean DB, fix by adding a new migration, not by rewriting old SQL.
