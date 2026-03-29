import { InputFile } from "grammy";
import { MyContext, MyConversation } from "../types";
import { getMainMenuForUser, cancelKeyboard } from "../keyboards/main";
import { generateReport } from "../utils/excel";
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
  const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));

  await ctx.reply("📅 Boshlanish sanasini kiriting (DD.MM.YYYY):", {
    reply_markup: cancelKeyboard,
  });

  let fromDate: Date;
  while (true) {
    const fromCtx = await conversation.waitFor("message:text");
    if (fromCtx.message.text === "❌ Bekor qilish") {
      await ctx.reply("❌ Bekor qilindi.", { reply_markup: menu });
      return;
    }
    const parsed = parseDate(fromCtx.message.text);
    if (!parsed) {
      await ctx.reply("⚠️ Noto'g'ri format. DD.MM.YYYY kiriting (masalan: 01.03.2026):");
      continue;
    }
    fromDate = parsed;
    break;
  }

  await ctx.reply("📅 Tugash sanasini kiriting (DD.MM.YYYY):");

  let toDate: Date;
  while (true) {
    const toCtx = await conversation.waitFor("message:text");
    if (toCtx.message.text === "❌ Bekor qilish") {
      await ctx.reply("❌ Bekor qilindi.", { reply_markup: menu });
      return;
    }
    const parsed = parseDate(toCtx.message.text);
    if (!parsed) {
      await ctx.reply("⚠️ Noto'g'ri format. DD.MM.YYYY kiriting (masalan: 31.03.2026):");
      continue;
    }
    if (parsed < fromDate) {
      await ctx.reply("⚠️ Tugash sanasi boshlanishdan keyin bo'lishi kerak:");
      continue;
    }
    parsed.setDate(parsed.getDate() + 1);
    toDate = parsed;
    break;
  }

  await ctx.reply("⏳ Excel tayyorlanmoqda...");

  try {
    const filePath = await conversation.external(() =>
      generateReport({ from: fromDate, to: toDate })
    );

    await ctx.replyWithDocument(
      new InputFile(filePath, `Hisobot_${fromDate.toLocaleDateString("uz-UZ")}.xlsx`)
    );

    conversation.external(() => fs.unlinkSync(filePath));
  } catch (err) {
    console.error("Excel xatosi:", err);
    await ctx.reply("❌ Excel yaratishda xatolik yuz berdi.");
  }

  await ctx.reply("🏠 Asosiy menyu:", { reply_markup: menu });
}
