import { MyContext, MyConversation } from "../types";
import { prisma } from "../prisma";
import {
  getFirmsKeyboard,
  getMainMenuForUser,
  getDebtTypeKeyboard,
  getAddMoreKeyboard,
  getCancelKeyboard,
} from "../keyboards/main";
import { t, Lang, parseNum, fmtNum } from "../i18n";

async function getFirmBalance(firmId: number): Promise<number> {
  const result = await prisma.debtTransaction.groupBy({
    by: ["type"],
    where: { firmId },
    _sum: { amount: true },
  });
  let debts = 0;
  let payments = 0;
  for (const r of result) {
    const sum = Number(r._sum.amount) || 0;
    if (r.type === "DEBT") debts = sum;
    if (r.type === "PAYMENT") payments = sum;
  }
  return debts - payments;
}

export async function debtConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  const lang = await conversation.external(async () => {
    const u = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from!.id) } });
    return (u?.language as Lang) || "uz";
  });

  let addMore = true;

  while (addMore) {
    const firmsKb = await conversation.external(() => getFirmsKeyboard());
    await ctx.reply(t("debtSelectFirm", lang), { reply_markup: firmsKb });

    const firmCtx = await conversation.waitForCallbackQuery(/^firm_\d+$/);
    const firmId = parseInt(firmCtx.callbackQuery.data.split("_")[1]);
    await firmCtx.answerCallbackQuery();

    const firm = await conversation.external(async () => {
      const f = await prisma.firm.findUnique({ where: { id: firmId } });
      return f ? { id: f.id, name: f.name } : null;
    });

    if (!firm) {
      await ctx.reply(t("firmNotFound", lang));
      return;
    }

    const balance = await conversation.external(() => getFirmBalance(firmId));
    await firmCtx.editMessageText(
      t("debtBalance", lang, { name: firm.name, balance: fmtNum(balance) })
    );

    await ctx.reply(t("debtChooseAction", lang), { reply_markup: getDebtTypeKeyboard(lang) });

    const typeCtx = await conversation.waitForCallbackQuery(/^debt_(add|pay)$/);
    const debtType = typeCtx.callbackQuery.data === "debt_add" ? "DEBT" : "PAYMENT";
    const debtLabel = debtType === "DEBT" ? t("debtAdd", lang) : t("debtPay", lang);
    await typeCtx.answerCallbackQuery();
    await typeCtx.editMessageText(`✅ ${debtLabel}`);

    // Summa
    await ctx.reply(t("expenseEnterAmount", lang), { reply_markup: getCancelKeyboard(lang) });

    let amount: number;
    while (true) {
      const amountCtx = await conversation.waitFor("message:text");
      if (amountCtx.message.text === t("cancel", lang)) {
        const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));
        await ctx.reply(t("cancelled", lang), { reply_markup: menu });
        return;
      }
      amount = parseNum(amountCtx.message.text);
      if (isNaN(amount) || amount <= 0) {
        await ctx.reply(t("invalidNumber", lang));
        continue;
      }
      break;
    }

    // Izoh
    await ctx.reply(t("expenseEnterComment", lang));

    const commentCtx = await conversation.waitFor("message:text");
    if (commentCtx.message.text === t("cancel", lang)) {
      const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));
      await ctx.reply(t("cancelled", lang), { reply_markup: menu });
      return;
    }
    const comment = commentCtx.message.text === "-" ? null : commentCtx.message.text;

    await conversation.external(async () => {
      await prisma.debtTransaction.create({
        data: {
          firmId,
          type: debtType as any,
          amount,
          comment,
          transactionDate: new Date(new Date().toISOString().split("T")[0] + "T00:00:00Z"),
          createdBy: BigInt(ctx.from!.id),
        },
      });
    });

    const newBalance = await conversation.external(() => getFirmBalance(firmId));

    await ctx.reply(
      t("debtSummary", lang, {
        firm: firm.name,
        type: debtLabel,
        amount: fmtNum(amount),
        comment: comment || "—",
        balance: fmtNum(newBalance),
      })
    );

    await ctx.reply(t("debtAddMore", lang), { reply_markup: getAddMoreKeyboard(lang) });

    const moreCtx = await conversation.waitForCallbackQuery(/^more_(yes|no)$/);
    await moreCtx.answerCallbackQuery();

    if (moreCtx.callbackQuery.data === "more_no") {
      addMore = false;
      await moreCtx.editMessageText(t("saved", lang));
    } else {
      await moreCtx.editMessageText(t("incomeSavedNext", lang));
    }
  }

  const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));
  await ctx.reply(t("mainMenu", lang), { reply_markup: menu });
}
