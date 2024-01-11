-- CreateTable
CREATE TABLE "authorizer_authenticators" (
    "key" TEXT,
    "id" CHAR(36) NOT NULL,
    "user_id" CHAR(36),
    "method" TEXT,
    "secret" TEXT,
    "recovery_codes" TEXT,
    "verified_at" BIGINT,
    "created_at" BIGINT,
    "updated_at" BIGINT,

    CONSTRAINT "authorizer_authenticators_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorizer_email_templates" (
    "key" TEXT,
    "id" CHAR(36) NOT NULL,
    "event_name" TEXT,
    "subject" TEXT,
    "template" TEXT,
    "design" TEXT,
    "created_at" BIGINT,
    "updated_at" BIGINT,

    CONSTRAINT "authorizer_email_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorizer_envs" (
    "key" TEXT,
    "id" CHAR(36) NOT NULL,
    "env_data" TEXT,
    "hash" TEXT,
    "encryption_key" TEXT,
    "updated_at" BIGINT,
    "created_at" BIGINT,

    CONSTRAINT "authorizer_envs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorizer_otps" (
    "key" TEXT,
    "id" CHAR(36) NOT NULL,
    "email" TEXT,
    "phone_number" TEXT,
    "otp" TEXT,
    "expires_at" BIGINT,
    "created_at" BIGINT,
    "updated_at" BIGINT,

    CONSTRAINT "authorizer_otps_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorizer_sessions" (
    "key" TEXT,
    "id" CHAR(36) NOT NULL,
    "user_id" CHAR(36),
    "user_agent" TEXT,
    "ip" TEXT,
    "created_at" BIGINT,
    "updated_at" BIGINT,

    CONSTRAINT "authorizer_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorizer_users" (
    "key" TEXT,
    "id" CHAR(36) NOT NULL,
    "email" TEXT,
    "email_verified_at" BIGINT,
    "password" TEXT,
    "signup_methods" TEXT,
    "given_name" TEXT,
    "family_name" TEXT,
    "middle_name" TEXT,
    "nickname" TEXT,
    "gender" TEXT,
    "birthdate" TEXT,
    "phone_number" TEXT,
    "phone_number_verified_at" BIGINT,
    "picture" TEXT,
    "roles" TEXT,
    "revoked_timestamp" BIGINT,
    "is_multi_factor_auth_enabled" BOOLEAN,
    "updated_at" BIGINT,
    "created_at" BIGINT,
    "app_data" TEXT,

    CONSTRAINT "authorizer_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorizer_verification_requests" (
    "key" TEXT,
    "id" CHAR(36) NOT NULL,
    "token" TEXT,
    "identifier" VARCHAR(64),
    "expires_at" BIGINT,
    "email" VARCHAR(256),
    "nonce" TEXT,
    "redirect_uri" TEXT,
    "created_at" BIGINT,
    "updated_at" BIGINT,

    CONSTRAINT "authorizer_verification_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorizer_webhook_logs" (
    "key" TEXT,
    "id" CHAR(36) NOT NULL,
    "http_status" BIGINT,
    "response" TEXT,
    "request" TEXT,
    "webhook_id" CHAR(36),
    "created_at" BIGINT,
    "updated_at" BIGINT,

    CONSTRAINT "authorizer_webhook_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "authorizer_webhooks" (
    "key" TEXT,
    "id" CHAR(36) NOT NULL,
    "event_name" TEXT,
    "event_description" TEXT,
    "end_point" TEXT,
    "headers" TEXT,
    "enabled" BOOLEAN,
    "created_at" BIGINT,
    "updated_at" BIGINT,

    CONSTRAINT "authorizer_webhooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_splits" (
    "id" TEXT NOT NULL,
    "money_total" DOUBLE PRECISION NOT NULL,
    "money_share" INTEGER NOT NULL,
    "expensesId" TEXT NOT NULL,
    "authorizer_usersId" CHAR(36) NOT NULL,

    CONSTRAINT "expense_splits_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "group_users" (
    "id" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "authorizer_usersId" CHAR(36) NOT NULL,
    "groupsId" TEXT,

    CONSTRAINT "group_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "money_total" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "groups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "groups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "authorizer_email_templates_event_name_key" ON "authorizer_email_templates"("event_name");

-- CreateIndex
CREATE UNIQUE INDEX "authorizer_otps_email_key" ON "authorizer_otps"("email");

-- CreateIndex
CREATE UNIQUE INDEX "idx_authorizer_otps_phone_number" ON "authorizer_otps"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "authorizer_users_email_key" ON "authorizer_users"("email");

-- CreateIndex
CREATE INDEX "idx_authorizer_users_phone_number" ON "authorizer_users"("phone_number");

-- CreateIndex
CREATE UNIQUE INDEX "idx_email_identifier" ON "authorizer_verification_requests"("identifier", "email");

-- CreateIndex
CREATE UNIQUE INDEX "authorizer_webhooks_event_name_key" ON "authorizer_webhooks"("event_name");

-- AddForeignKey
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_expensesId_fkey" FOREIGN KEY ("expensesId") REFERENCES "expenses"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_splits" ADD CONSTRAINT "expense_splits_authorizer_usersId_fkey" FOREIGN KEY ("authorizer_usersId") REFERENCES "authorizer_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_users" ADD CONSTRAINT "group_users_authorizer_usersId_fkey" FOREIGN KEY ("authorizer_usersId") REFERENCES "authorizer_users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "group_users" ADD CONSTRAINT "group_users_groupsId_fkey" FOREIGN KEY ("groupsId") REFERENCES "groups"("id") ON DELETE SET NULL ON UPDATE CASCADE;
