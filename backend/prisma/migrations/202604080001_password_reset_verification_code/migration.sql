ALTER TABLE "password_reset_tokens"
ADD COLUMN "verification_code_hash" VARCHAR(128);

CREATE INDEX "idx_password_reset_tokens_code_expiry"
ON "password_reset_tokens"("verification_code_hash", "expires_at", "used_at");
