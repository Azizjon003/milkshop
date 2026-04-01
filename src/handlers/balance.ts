import { Composer } from "grammy";
import { MyContext } from "../types";
import { prisma } from "../prisma";
import { getMainMenuForUser } from "../keyboards/main";
import { t, getUserLang, fmtNum } from "../i18n";

const composer = new Composer<MyContext>();

composer.hears(/^📊 /, async (ctx) => {
  const lang = await getUserLang(ctx.from!.id);

  const totalIncome = await prisma.income.aggregate({ _sum: { totalAmount: true } });
  const totalExpense = await prisma.expense.aggregate({ _sum: { amount: true } });

  const income = Number(totalIncome._sum.totalAmount) || 0;
  const expense = Number(totalExpense._sum.amount) || 0;
  const balance = income - expense;

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

  const text = t("balanceTitle", lang, {
    income: fmtNum(income),
    expense: fmtNum(expense),
    balance: fmtNum(balance),
    debt: fmtNum(debtBalance),
  });

  const menu = await getMainMenuForUser(ctx.from!.id);
  await ctx.reply(text, { reply_markup: menu });
});

export default composer;
