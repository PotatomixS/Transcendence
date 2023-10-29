-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "code2FA" TEXT NOT NULL,
    "auth2FA" BOOLEAN NOT NULL DEFAULT false,
    "socketId" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "login_42" TEXT NOT NULL,
    "email_42" TEXT NOT NULL,
    "img_str" TEXT NOT NULL DEFAULT 'default_user.png',
    "elo" INTEGER NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Friends" (
    "id" SERIAL NOT NULL,
    "idUser1" TEXT NOT NULL,
    "idUser2" TEXT NOT NULL,

    CONSTRAINT "Friends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "JoinedChannels" (
    "id" SERIAL NOT NULL,
    "idUser" TEXT NOT NULL,
    "idChannel" TEXT NOT NULL,

    CONSTRAINT "JoinedChannels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Channel" (
    "id" SERIAL NOT NULL,
    "Name" TEXT NOT NULL,
    "Password" TEXT NOT NULL,

    CONSTRAINT "Channel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedChannel" (
    "id" SERIAL NOT NULL,
    "idUser" TEXT NOT NULL,
    "idChannel" TEXT NOT NULL,

    CONSTRAINT "BlockedChannel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BlockedUsers" (
    "id" SERIAL NOT NULL,
    "userBlocker" TEXT NOT NULL,
    "userBlocked" TEXT NOT NULL,

    CONSTRAINT "BlockedUsers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gameRooms" (
    "id" SERIAL NOT NULL,
    "playerLeft" TEXT NOT NULL,
    "playerRight" TEXT NOT NULL,

    CONSTRAINT "gameRooms_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "viewers" (
    "id" SERIAL NOT NULL,
    "idUserWatching" TEXT NOT NULL,
    "idGameRoom" INTEGER NOT NULL,

    CONSTRAINT "viewers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "matches" (
    "id" SERIAL NOT NULL,
    "idUsuarioVictoria" INTEGER NOT NULL,
    "idUsuarioDerrota" INTEGER NOT NULL,

    CONSTRAINT "matches_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_nickname_key" ON "User"("nickname");

-- CreateIndex
CREATE UNIQUE INDEX "User_login_42_key" ON "User"("login_42");

-- CreateIndex
CREATE UNIQUE INDEX "JoinedChannels_idUser_key" ON "JoinedChannels"("idUser");

-- CreateIndex
CREATE UNIQUE INDEX "Channel_Name_key" ON "Channel"("Name");
