import { Composer } from "grammy";
import { MyContext } from "../types";
import { prisma } from "../prisma";
import { getMainMenuForUser } from "../keyboards/main";

const composer = new Composer<MyContext>();

composer.hears("📊 Balans", async (ctx) => {
  // Jami kirim
  const totalIncome = await prisma.income.aggregate({
    _sum: { totalAmount: true },
  });

  // Jami chiqim
  const totalExpense = await prisma.expense.aggregate({
    _sum: { amount: true },
  });

  const income = Number(totalIncome._sum.totalAmount) || 0;
  const expense = Number(totalExpense._sum.amount) || 0;
  const balance = income - expense;

  // Jami qarzlar
  const debtResult = await prisma.debtTransaction.groupBy({
    by: ["type"],
    _sum: { amount: true },
  });

  let totalDebt = 0;
  let totalPayment = 0;
  for (const r of debtResult) {
    const sum = Number(r._sum.amount) || 0;
    if (r.type === "DEBT") totalDebt = sum;
    if (r.type === "PAYMENT") totalPayment = sum;
  }
  const debtBalance = totalDebt - totalPayment;

  const text =
    `📊 Umumiy balans:\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💰 Jami kirim: ${income.toLocaleString()} so'm\n` +
    `📤 Jami chiqim: ${expense.toLocaleString()} so'm\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💵 Balans: ${balance.toLocaleString()} so'm\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `📋 Jami qarz qoldig'i: ${debtBalance.toLocaleString()} so'm`;

  const menu = await getMainMenuForUser(ctx.from!.id);
  await ctx.reply(text, { reply_markup: menu });
});

export default composer;
