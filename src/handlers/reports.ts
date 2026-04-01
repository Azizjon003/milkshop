import { Composer, InlineKeyboard, InputFile } from "grammy";
import { MyContext } from "../types";
import { prisma } from "../prisma";
import { getMainMenuForUser } from "../keyboards/main";
import { generateReport } from "../utils/excel";
import { t, getUserLang, fmtNum } from "../i18n";
import fs from "fs";

const composer = new Composer<MyContext>();

function todayUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
}
function tomorrowUTC(): Date {
  const d = todayUTC();
  d.setUTCDate(d.getUTCDate() + 1);
  return d;
}
function startOfMonthUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth(), 1));
}
function startOfNextMonthUTC(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getFullYear(), now.getMonth() + 1, 1));
}

composer.hears(/^📈 /, async (ctx) => {
  const lang = await getUserLang(ctx.from!.id);
  const kb = new InlineKeyboard()
    .text(t("reportToday", lang), "report_today")
    .text(t("reportMonthly", lang), "report_monthly")
    .row()
    .text(t("reportByIncome", lang), "report_income")
    .row()
    .text(t("reportByExpense", lang), "report_expense")
    .row()
    .text(t("reportDebtStatus", lang), "report_debt")
    .row()
    .text(t("excelMonthly", lang), "excel_monthly")
    .text(t("excelAll", lang), "excel_all")
    .row()
    .text(t("excelRange", lang), "excel_range");

  await ctx.reply(t("reportsTitle", lang), { reply_markup: kb });
});

// Bugungi
composer.callbackQuery("report_today", async (ctx) => {
  await ctx.answerCallbackQuery();
  const lang = await getUserLang(ctx.from!.id);
  const today = todayUTC();
  const tomorrow = tomorrowUTC();

  const incomes = await prisma.income.findMany({
    where: { incomeDate: { gte: today, lt: tomorrow } },
    include: { type: true },
  });
  const expenses = await prisma.expense.findMany({
    where: { expenseDate: { gte: today, lt: tomorrow } },
    include: { category: true },
  });

  let incomeTotal = 0;
  let incomeText = "";
  for (const i of incomes) {
    const amt = Number(i.totalAmount);
    incomeTotal += amt;
    incomeText += `  ${i.type.name}: ${Number(i.quantity)} ${i.type.unit} — ${fmtNum(amt)}\n`;
  }

  let expenseTotal = 0;
  let expenseText = "";
  for (const e of expenses) {
    const amt = Number(e.amount);
    expenseTotal += amt;
    expenseText += `  ${e.category.name}: ${fmtNum(amt)}\n`;
  }

  const text =
    `${t("reportToday", lang)}:\n━━━━━━━━━━━━━━━━━━\n` +
    `💰:\n${incomeText || t("noData", lang) + "\n"}` +
    `${t("total", lang)}: ${fmtNum(incomeTotal)}\n\n` +
    `📤:\n${expenseText || t("noData", lang) + "\n"}` +
    `${t("total", lang)}: ${fmtNum(expenseTotal)}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `${t("profit", lang)}: ${fmtNum(incomeTotal - expenseTotal)}`;

  await ctx.reply(text, { reply_markup: await getMainMenuForUser(ctx.from!.id) });
});

// Oylik
composer.callbackQuery("report_monthly", async (ctx) => {
  await ctx.answerCallbackQuery();
  const lang = await getUserLang(ctx.from!.id);
  const from = startOfMonthUTC();
  const to = startOfNextMonthUTC();

  const incomeAgg = await prisma.income.aggregate({
    where: { incomeDate: { gte: from, lt: to } },
    _sum: { totalAmount: true },
  });
  const expenseAgg = await prisma.expense.aggregate({
    where: { expenseDate: { gte: from, lt: to } },
    _sum: { amount: true },
  });

  const income = Number(incomeAgg._sum.totalAmount) || 0;
  const expense = Number(expenseAgg._sum.amount) || 0;

  const monthNames = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
  ];
  const now = new Date();

  const text =
    `📆 ${monthNames[now.getMonth()]} ${now.getFullYear()}:\n━━━━━━━━━━━━━━━━━━\n` +
    `💰 ${t("total", lang)}: ${fmtNum(income)}\n` +
    `📤 ${t("total", lang)}: ${fmtNum(expense)}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `${t("profit", lang)}: ${fmtNum(income - expense)}`;

  await ctx.reply(text, { reply_markup: await getMainMenuForUser(ctx.from!.id) });
});

// Kirim turi bo'yicha
composer.callbackQuery("report_income", async (ctx) => {
  await ctx.answerCallbackQuery();
  const lang = await getUserLang(ctx.from!.id);

  const results = await prisma.income.groupBy({
    by: ["typeId"],
    _sum: { totalAmount: true, quantity: true },
  });
  const types = await prisma.incomeType.findMany();
  const typeMap = new Map(types.map((tp) => [tp.id, tp]));

  let text = `${t("reportByIncome", lang)}:\n━━━━━━━━━━━━━━━━━━\n`;
  let total = 0;

  for (const r of results) {
    const tp = typeMap.get(r.typeId);
    const sum = Number(r._sum.totalAmount) || 0;
    const qty = Number(r._sum.quantity) || 0;
    total += sum;
    text += `${tp?.name}: ${qty} ${tp?.unit} — ${fmtNum(sum)}\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━\n${t("total", lang)}: ${fmtNum(total)}`;
  await ctx.reply(text, { reply_markup: await getMainMenuForUser(ctx.from!.id) });
});

// Chiqim kategoriya bo'yicha
composer.callbackQuery("report_expense", async (ctx) => {
  await ctx.answerCallbackQuery();
  const lang = await getUserLang(ctx.from!.id);

  const results = await prisma.expense.groupBy({
    by: ["categoryId"],
    _sum: { amount: true },
  });
  const categories = await prisma.expenseCategory.findMany();
  const catMap = new Map(categories.map((c) => [c.id, c]));

  let text = `${t("reportByExpense", lang)}:\n━━━━━━━━━━━━━━━━━━\n`;
  let total = 0;

  for (const r of results) {
    const cat = catMap.get(r.categoryId);
    const sum = Number(r._sum.amount) || 0;
    total += sum;
    text += `${cat?.name}: ${fmtNum(sum)}\n`;
  }

  text += `━━━━━━━━━━━━━━━━━━\n${t("total", lang)}: ${fmtNum(total)}`;
  await ctx.reply(text, { reply_markup: await getMainMenuForUser(ctx.from!.id) });
});

// Qarz holati
composer.callbackQuery("report_debt", async (ctx) => {
  await ctx.answerCallbackQuery();
  const lang = await getUserLang(ctx.from!.id);

  const firms = await prisma.firm.findMany();
  let text = `${t("reportDebtStatus", lang)}:\n━━━━━━━━━━━━━━━━━━\n`;
  let grandTotal = 0;

  for (const firm of firms) {
    const result = await prisma.debtTransaction.groupBy({
      by: ["type"],
      where: { firmId: firm.id },
      _sum: { amount: true },
    });
    let debts = 0;
    let payments = 0;
    for (const r of result) {
      const sum = Number(r._sum.amount) || 0;
      if (r.type === "DEBT") debts = sum;
      if (r.type === "PAYMENT") payments = sum;
    }
    const balance = debts - payments;
    grandTotal += balance;
    if (balance !== 0) {
      text += `${firm.name}: ${fmtNum(balance)}\n`;
    }
  }

  if (grandTotal === 0) text += t("noDebt", lang) + "\n";
  text += `━━━━━━━━━━━━━━━━━━\n${t("totalDebt", lang)}: ${fmtNum(grandTotal)}`;

  await ctx.reply(text, { reply_markup: await getMainMenuForUser(ctx.from!.id) });
});

// Excel
async function sendExcel(ctx: MyContext, filter: { from?: Date; to?: Date }, label: string) {
  const lang = await getUserLang(ctx.from!.id);
  await ctx.reply(t("excelPreparing", lang, { label }));
  try {
    const filePath = await generateReport(filter);
    await ctx.replyWithDocument(new InputFile(filePath, `${label}.xlsx`));
    fs.unlinkSync(filePath);
  } catch (err) {
    console.error("Excel xatosi:", err);
    await ctx.reply(t("excelError", lang));
  }
  await ctx.reply(t("mainMenu", lang), { reply_markup: await getMainMenuForUser(ctx.from!.id) });
}

composer.callbackQuery("excel_monthly", async (ctx) => {
  await ctx.answerCallbackQuery();
  const from = startOfMonthUTC();
  const to = startOfNextMonthUTC();
  const monthNames = [
    "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
    "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr",
  ];
  const now = new Date();
  await sendExcel(ctx, { from, to }, `${monthNames[now.getMonth()]}_${now.getFullYear()}`);
});

composer.callbackQuery("excel_all", async (ctx) => {
  await ctx.answerCallbackQuery();
  await sendExcel(ctx, {}, "Umumiy_hisobot");
});

composer.callbackQuery("excel_range", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.conversation.enter("excelRangeConversation");
});

export default composer;
