import { MyContext, MyConversation } from "../types";
import { prisma } from "../prisma";
import {
  getIncomeTypesKeyboard,
  getMainMenuForUser,
  getAddMoreKeyboard,
  getCancelKeyboard,
} from "../keyboards/main";
import { t, Lang, parseNum, fmtNum } from "../i18n";

export async function incomeConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  const lang = await conversation.external(async () => {
    const u = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from!.id) } });
    return (u?.language as Lang) || "uz";
  });

  let addMore = true;

  while (addMore) {
    const incomeTypesKb = await conversation.external(() => getIncomeTypesKeyboard());
    await ctx.reply(t("incomeSelectType", lang), { reply_markup: incomeTypesKb });

    const typeCtx = await conversation.waitForCallbackQuery(/^income_\d+$/);
    const typeId = parseInt(typeCtx.callbackQuery.data.split("_")[1]);
    await typeCtx.answerCallbackQuery();

    const incomeType = await conversation.external(async () => {
      const tp = await prisma.incomeType.findUnique({ where: { id: typeId } });
      return tp ? { id: tp.id, name: tp.name, unit: tp.unit } : null;
    });

    if (!incomeType) {
      await ctx.reply(t("typeNotFound", lang));
      return;
    }

    await typeCtx.editMessageText(t("incomeSelected", lang, { name: incomeType.name }));

    // Miqdor
    await ctx.reply(t("incomeEnterQty", lang, { unit: incomeType.unit }), {
      reply_markup: getCancelKeyboard(lang),
    });

    let quantity: number;
    while (true) {
      const qtyCtx = await conversation.waitFor("message:text");
      if (qtyCtx.message.text === t("cancel", lang)) {
        const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));
        await ctx.reply(t("cancelled", lang), { reply_markup: menu });
        return;
      }
      quantity = parseNum(qtyCtx.message.text);
      if (isNaN(quantity) || quantity <= 0) {
        await ctx.reply(t("invalidNumber", lang));
        continue;
      }
      break;
    }

    // Narx
    await ctx.reply(t("incomeEnterPrice", lang, { unit: incomeType.unit }));

    let pricePerUnit: number;
    while (true) {
      const priceCtx = await conversation.waitFor("message:text");
      if (priceCtx.message.text === t("cancel", lang)) {
        const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));
        await ctx.reply(t("cancelled", lang), { reply_markup: menu });
        return;
      }
      pricePerUnit = parseNum(priceCtx.message.text);
      if (isNaN(pricePerUnit) || pricePerUnit <= 0) {
        await ctx.reply(t("invalidNumber", lang));
        continue;
      }
      break;
    }

    const totalAmount = quantity * pricePerUnit;

    await ctx.reply(
      t("incomeSummary", lang, {
        type: incomeType.name,
        qty: quantity,
        unit: incomeType.unit,
        price: fmtNum(pricePerUnit),
        total: fmtNum(totalAmount),
      })
    );

    await conversation.external(async () => {
      await prisma.income.create({
        data: {
          typeId,
          quantity,
          pricePerUnit,
          totalAmount,
          incomeDate: new Date(new Date().toISOString().split("T")[0] + "T00:00:00Z"),
          createdBy: BigInt(ctx.from!.id),
        },
      });
    });

    await ctx.reply(t("incomeSaved", lang), { reply_markup: getAddMoreKeyboard(lang) });

    const moreCtx = await conversation.waitForCallbackQuery(/^more_(yes|no)$/);
    await moreCtx.answerCallbackQuery();

    if (moreCtx.callbackQuery.data === "more_no") {
      addMore = false;
      await moreCtx.editMessageText(t("incomeAllSaved", lang));
    } else {
      await moreCtx.editMessageText(t("incomeSavedNext", lang));
    }
  }

  const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));
  await ctx.reply(t("mainMenu", lang), { reply_markup: menu });
}
