-- CreateTable
CREATE TABLE "login_throttles" (
    "id" UUID NOT NULL,
    "key_hash" TEXT NOT NULL,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "window_start" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "locked_until" TIMESTAMPTZ(6),
    "updated_at" TIMESTAMPTZ(6) NOT NULL,

    CONSTRAINT "login_throttles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "login_throttles_key_hash_key" ON "login_throttles"("key_hash");

-- CreateIndex
CREATE INDEX "login_throttles_locked_until_idx" ON "login_throttles"("locked_until");
