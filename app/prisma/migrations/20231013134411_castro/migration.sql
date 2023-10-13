-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "code2FA" TEXT NOT NULL,
    "auth2FA" BOOLEAN NOT NULL DEFAULT false,
    "nickname" TEXT NOT NULL,
    "login_42" TEXT NOT NULL,
    "email_42" TEXT NOT NULL,
    "img_str" TEXT NOT NULL DEFAULT 'default_user',

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "User_login_42_key" ON "User"("login_42");
