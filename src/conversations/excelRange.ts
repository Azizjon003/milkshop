import { InputFile } from "grammy";
import { MyContext, MyConversation } from "../types";
import { getMainMenuForUser, getCancelKeyboard } from "../keyboards/main";
import { generateReport } from "../utils/excel";
import { t, Lang } from "../i18n";
import { prisma } from "../prisma";
import fs from "fs";

function parseDate(text: string): Date | null {
  const match = text.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
  if (!match) return null;
  const [, day, month, year] = match;
  const d = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  if (isNaN(d.getTime())) return null;
  return d;
}

export async function excelRangeConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  const lang = await conversation.external(async () => {
    const u = await prisma.user.findUnique({ where: { telegramId: BigInt(ctx.from!.id) } });
    return (u?.language as Lang) || "uz";
  });

  const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));

  await ctx.reply(t("enterFromDate", lang), { reply_markup: getCancelKeyboard(lang) });

  let fromDate: Date;
  while (true) {
    const fromCtx = await conversation.waitFor("message:text");
    if (fromCtx.message.text === t("cancel", lang)) {
      await ctx.reply(t("cancelled", lang), { reply_markup: menu });
      return;
    }
    const parsed = parseDate(fromCtx.message.text);
    if (!parsed) {
      await ctx.reply(t("invalidDate", lang));
      continue;
    }
    fromDate = parsed;
    break;
  }

  await ctx.reply(t("enterToDate", lang));

  let toDate: Date;
  while (true) {
    const toCtx = await conversation.waitFor("message:text");
    if (toCtx.message.text === t("cancel", lang)) {
      await ctx.reply(t("cancelled", lang), { reply_markup: menu });
      return;
    }
    const parsed = parseDate(toCtx.message.text);
    if (!parsed) {
      await ctx.reply(t("invalidDate", lang));
      continue;
    }
    if (parsed < fromDate) {
      await ctx.reply(t("dateMustBeAfter", lang));
      continue;
    }
    parsed.setDate(parsed.getDate() + 1);
    toDate = parsed;
    break;
  }

  await ctx.reply(t("excelPreparing", lang, { label: "Excel" }));

  try {
    const filePath = await conversation.external(() =>
      generateReport({ from: fromDate, to: toDate })
    );
    await ctx.replyWithDocument(new InputFile(filePath, `Hisobot.xlsx`));
    conversation.external(() => fs.unlinkSync(filePath));
  } catch (err) {
    console.error("Excel xatosi:", err);
    await ctx.reply(t("excelError", lang));
  }

  await ctx.reply(t("mainMenu", lang), { reply_markup: menu });
}
