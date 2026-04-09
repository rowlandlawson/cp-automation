-- AlterTable
ALTER TABLE "users"
ADD COLUMN "password_changed_at" TIMESTAMP(6);

-- Backfill existing users so pre-migration sessions remain valid unless the password changes later.
UPDATE "users"
SET "password_changed_at" = COALESCE("updated_at", "created_at")
WHERE "password_hash" IS NOT NULL
  AND "password_changed_at" IS NULL;

-- CreateTable
CREATE TABLE "password_reset_tokens" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "token_hash" VARCHAR(128) NOT NULL,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "used_at" TIMESTAMP(6),
    "requested_by_ip" VARCHAR(64),
    "requested_user_agent" VARCHAR(255),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "password_reset_tokens_token_hash_key" ON "password_reset_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "idx_password_reset_tokens_user_created" ON "password_reset_tokens"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "idx_password_reset_tokens_expiry" ON "password_reset_tokens"("expires_at", "used_at");

-- AddForeignKey
ALTER TABLE "password_reset_tokens"
ADD CONSTRAINT "password_reset_tokens_user_id_fkey"
FOREIGN KEY ("user_id") REFERENCES "users"("id")
ON DELETE CASCADE ON UPDATE CASCADE;
