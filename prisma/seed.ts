import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  // Kirim turlari
  const incomeTypes = [
    { name: "Sut", unit: "litr" },
    { name: "Qaymoq 100gr", unit: "dona" },
    { name: "Qaymoq 150gr", unit: "dona" },
    { name: "Kefir stakan", unit: "dona" },
    { name: "Suzma", unit: "kg" },
    { name: "Go'ng sotish", unit: "dona" },
    { name: "Investitsiya kirimi", unit: "dona" },
  ];

  for (const type of incomeTypes) {
    await prisma.incomeType.upsert({
      where: { id: incomeTypes.indexOf(type) + 1 },
      update: {},
      create: type,
    });
  }

  // Chiqim kategoriyalari
  const expenseCategories = [
    "Oylik maosh",
    "Sigir yemi",
    "Transport xarajati",
    "Ijara",
    "Moddiy xarajat",
    "Sigir dorisi",
    "Veterinar ko'rigi",
    "Boshqa xarajatlar",
  ];

  for (const name of expenseCategories) {
    await prisma.expenseCategory.upsert({
      where: { id: expenseCategories.indexOf(name) + 1 },
      update: {},
      create: { name },
    });
  }

  // Firmalar
  const firms = [
    "Rizq do'koni",
    "Investor Oybek",
    "Investor Lutfullo",
    "Investor Mansurjon",
    "Investor Jahongir",
    "Investor Jurabek",
    "Yetkazib berish 4242",
    "Boshqa qarzlar",
  ];

  for (const name of firms) {
    await prisma.firm.upsert({
      where: { id: firms.indexOf(name) + 1 },
      update: {},
      create: { name },
    });
  }

  // Super adminlar
  const superAdmins = [
    { telegramId: BigInt(992823235), fullName: "Admin 1" },
    { telegramId: BigInt(335458972), fullName: "Admin 2" },
    { telegramId: BigInt(6322528596), fullName: "Admin 3" },
  ];

  for (const admin of superAdmins) {
    await prisma.user.upsert({
      where: { telegramId: admin.telegramId },
      update: {
        isSuperAdmin: true,
        canIncome: true,
        canExpense: true,
        canDebt: true,
        canReport: true,
        isActive: true,
      },
      create: {
        telegramId: admin.telegramId,
        fullName: admin.fullName,
        isSuperAdmin: true,
        canIncome: true,
        canExpense: true,
        canDebt: true,
        canReport: true,
        isActive: true,
      },
    });
  }

  console.log("Seed data created successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
