-- CreateEnum
CREATE TYPE "role" AS ENUM ('admin', 'user');

-- CreateEnum
CREATE TYPE "token_type" AS ENUM ('refresh_token', 'access_token', 'email_verification_token');

-- CreateTable
CREATE TABLE "users" (
    "id" VARCHAR(32) NOT NULL,
    "username" VARCHAR(100),
    "email" VARCHAR(100),
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_wallet_logins" (
    "public_address" VARCHAR(255) NOT NULL,
    "user_id" VARCHAR(32) NOT NULL,
    "nonce" VARCHAR(255) NOT NULL,
    "last_logged_in_at" TIMESTAMP,
    "log_in_attempts" INTEGER NOT NULL,
    "is_locked_out" BOOLEAN NOT NULL,
    "lockout_expiry_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_wallet_logins_pkey" PRIMARY KEY ("public_address")
);

-- CreateTable
CREATE TABLE "user_roles" (
    "user_id" VARCHAR(32) NOT NULL,
    "role_id" INTEGER NOT NULL,

    CONSTRAINT "user_roles_pkey" PRIMARY KEY ("user_id","role_id")
);

-- CreateTable
CREATE TABLE "roles" (
    "id" SERIAL NOT NULL,
    "role" "role" NOT NULL,

    CONSTRAINT "roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_tokens" (
    "user_id" VARCHAR(32) NOT NULL,
    "token" VARCHAR(255) NOT NULL,
    "token_type" "token_type" NOT NULL,
    "expires_at" TIMESTAMP,
    "revoked_at" TIMESTAMP,
    "created_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_tokens_pkey" PRIMARY KEY ("user_id","token")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "user_wallet_logins_user_id_key" ON "user_wallet_logins"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_tokens_token_key" ON "user_tokens"("token");

-- AddForeignKey
ALTER TABLE "user_wallet_logins" ADD CONSTRAINT "user_wallet_logins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_roles" ADD CONSTRAINT "user_roles_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_tokens" ADD CONSTRAINT "user_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
