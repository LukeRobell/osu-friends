ALTER TABLE "User"
  ADD COLUMN "taikoPp"         DOUBLE PRECISION,
  ADD COLUMN "taikoGlobalRank" INTEGER,
  ADD COLUMN "catchPp"         DOUBLE PRECISION,
  ADD COLUMN "catchGlobalRank" INTEGER,
  ADD COLUMN "maniaPp"         DOUBLE PRECISION,
  ADD COLUMN "maniaGlobalRank" INTEGER;

INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
VALUES (gen_random_uuid()::text, 'manual', NOW(), '20260626250000_add_mode_stats', NULL, NULL, NOW(), 1);
