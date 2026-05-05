import { MyContext, MyConversation } from "../types";
import { prisma } from "../prisma";
import {
  getExpenseCategoriesKeyboard,
  getMainMenuForUser,
  getAddMoreKeyboard,
  getCancelKeyboard,
} from "../keyboards/main";
import { t, Lang, parseNum, fmtNum } from "../i18n";

export async function expenseConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  const lang = await conversation.external(async () => {
    const u = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from!.id) } });
    return (u?.language as Lang) || "uz";
  });

  let addMore = true;

  while (addMore) {
    const cats = await conversation.external(() =>
      prisma.expenseCategory.findMany({ orderBy: { id: "asc" } })
    );
    if (cats.length === 0) {
      const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));
      await ctx.reply(
        "⚠️ Chiqim kategoriyalari hali qo'shilmagan. Admin paneldan qo'shing.",
        { reply_markup: menu }
      );
      return;
    }
    const expenseCatsKb = await conversation.external(() => getExpenseCategoriesKeyboard());
    await ctx.reply(t("expenseSelectCat", lang), { reply_markup: expenseCatsKb });

    const catCtx = await conversation.waitForCallbackQuery(/^expense_\d+$/);
    const categoryId = parseInt(catCtx.callbackQuery.data.split("_")[1]);
    await catCtx.answerCallbackQuery();

    const category = await conversation.external(async () => {
      const c = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });
      return c ? { id: c.id, name: c.name } : null;
    });

    if (!category) {
      await ctx.reply(t("catNotFound", lang));
      return;
    }

    await catCtx.editMessageText(t("incomeSelected", lang, { name: category.name }));

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

    await ctx.reply(
      t("expenseSummary", lang, {
        category: category.name,
        amount: fmtNum(amount),
        comment: comment || "—",
      })
    );

    await conversation.external(async () => {
      await prisma.expense.create({
        data: {
          categoryId,
          amount,
          comment,
          expenseDate: new Date(new Date().toISOString().split("T")[0] + "T00:00:00Z"),
          createdBy: BigInt(ctx.from!.id),
        },
      });
    });

    await ctx.reply(t("expenseSaved", lang), { reply_markup: getAddMoreKeyboard(lang) });

    const moreCtx = await conversation.waitForCallbackQuery(/^more_(yes|no)$/);
    await moreCtx.answerCallbackQuery();

    if (moreCtx.callbackQuery.data === "more_no") {
      addMore = false;
      await moreCtx.editMessageText(t("expenseAllSaved", lang));
    } else {
      await moreCtx.editMessageText(t("incomeSavedNext", lang));
    }
  }

  const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));
  await ctx.reply(t("mainMenu", lang), { reply_markup: menu });
}
