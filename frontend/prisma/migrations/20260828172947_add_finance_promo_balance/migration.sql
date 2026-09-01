-- AlterTable
ALTER TABLE "FinancialAccount" ADD COLUMN "promoBalance" REAL;
ALTER TABLE "FinancialAccount" ADD COLUMN "promoEndsAt" DATETIME;
ALTER TABLE "FinancialAccount" ADD COLUMN "promoInterestRate" REAL;
