-- Access control migration: adds OWNER/ADMIN/MEMBER roles and profile active flag

ALTER TABLE "profiles"
  ADD COLUMN IF NOT EXISTS "ativo" BOOLEAN NOT NULL DEFAULT true;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'Role' AND e.enumlabel = 'VIEWER'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'Role' AND e.enumlabel = 'MEMBER'
  ) THEN
    ALTER TYPE "Role" RENAME VALUE 'VIEWER' TO 'MEMBER';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'Role' AND e.enumlabel = 'ADMIN'
  ) AND NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'Role' AND e.enumlabel = 'OWNER'
  ) THEN
    ALTER TYPE "Role" RENAME VALUE 'ADMIN' TO 'OWNER';
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON e.enumtypid = t.oid
    WHERE t.typname = 'Role' AND e.enumlabel = 'ADMIN'
  ) THEN
    ALTER TYPE "Role" ADD VALUE 'ADMIN';
  END IF;
END $$;