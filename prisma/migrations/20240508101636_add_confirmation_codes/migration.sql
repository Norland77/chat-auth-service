-- CreateTable
CREATE TABLE "ConfirmationCodes" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "code" TEXT NOT NULL,

    CONSTRAINT "ConfirmationCodes_pkey" PRIMARY KEY ("id")
);
