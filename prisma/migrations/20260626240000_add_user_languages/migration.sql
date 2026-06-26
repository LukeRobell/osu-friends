ALTER TABLE "User" ADD COLUMN "languages" TEXT[] NOT NULL DEFAULT '{}';

INSERT INTO "_prisma_migrations" ("id", "checksum", "finished_at", "migration_name", "logs", "rolled_back_at", "started_at", "applied_steps_count")
VALUES (gen_random_uuid()::text, 'manual', NOW(), '20260626240000_add_user_languages', NULL, NULL, NOW(), 1);
