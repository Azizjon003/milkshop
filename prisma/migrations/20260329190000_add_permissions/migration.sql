-- AlterTable: role o'rniga permission ustunlar
ALTER TABLE "users" ADD COLUMN "is_super_admin" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "can_income" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "can_expense" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "can_debt" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "users" ADD COLUMN "can_report" BOOLEAN NOT NULL DEFAULT false;

-- Eski role ustunini o'chirish
ALTER TABLE "users" DROP COLUMN "role";

-- Role enum o'chirish
DROP TYPE "Role";
