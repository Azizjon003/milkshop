import { MyContext, MyConversation } from "../types";
import { prisma } from "../prisma";
import {
  getIncomeTypesKeyboard,
  getMainMenuForUser,
  addMoreKeyboard,
  cancelKeyboard,
} from "../keyboards/main";

export async function incomeConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  let addMore = true;

  while (addMore) {
    // 1. Kirim turini tanlash
    const incomeTypesKb = await conversation.external(() => getIncomeTypesKeyboard());
    await ctx.reply("📦 Kirim turini tanlang:", {
      reply_markup: incomeTypesKb,
    });

    const typeCtx = await conversation.waitForCallbackQuery(/^income_\d+$/);
    const typeId = parseInt(typeCtx.callbackQuery.data.split("_")[1]);
    await typeCtx.answerCallbackQuery();

    const incomeType = await conversation.external(async () => {
      const t = await prisma.incomeType.findUnique({ where: { id: typeId } });
      return t ? { id: t.id, name: t.name, unit: t.unit } : null;
    });

    if (!incomeType) {
      await ctx.reply("❌ Tur topilmadi!");
      return;
    }

    await typeCtx.editMessageText(`✅ Tanlandi: ${incomeType.name}`);

    // 2. Miqdor
    await ctx.reply(`📊 Miqdor kiriting (${incomeType.unit}):`, {
      reply_markup: cancelKeyboard,
    });

    let quantity: number;
    while (true) {
      const qtyCtx = await conversation.waitFor("message:text");
      if (qtyCtx.message.text === "❌ Bekor qilish") {
        const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));
        await ctx.reply("❌ Bekor qilindi.", { reply_markup: menu });
        return;
      }
      quantity = parseFloat(qtyCtx.message.text);
      if (isNaN(quantity) || quantity <= 0) {
        await ctx.reply("⚠️ Iltimos, to'g'ri son kiriting:");
        continue;
      }
      break;
    }

    // 3. Summa
    await ctx.reply("💰 Summa kiriting:");

    let totalAmount: number;
    while (true) {
      const amountCtx = await conversation.waitFor("message:text");
      if (amountCtx.message.text === "❌ Bekor qilish") {
        const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));
        await ctx.reply("❌ Bekor qilindi.", { reply_markup: menu });
        return;
      }
      totalAmount = parseFloat(amountCtx.message.text);
      if (isNaN(totalAmount) || totalAmount <= 0) {
        await ctx.reply("⚠️ Iltimos, to'g'ri summa kiriting:");
        continue;
      }
      break;
    }

    const pricePerUnit = totalAmount / quantity;

    const summary =
      `📋 Kirim ma'lumotlari:\n\n` +
      `📦 Turi: ${incomeType.name}\n` +
      `📊 Miqdor: ${quantity} ${incomeType.unit}\n` +
      `💰 Summa: ${totalAmount.toLocaleString()} so'm\n` +
      `💵 Narx (1 ${incomeType.unit}): ${Math.round(pricePerUnit).toLocaleString()} so'm`;

    await ctx.reply(summary);

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

    await ctx.reply("✅ Kirim saqlandi! Yana qo'shasizmi?", {
      reply_markup: addMoreKeyboard,
    });

    const moreCtx = await conversation.waitForCallbackQuery(/^more_(yes|no)$/);
    await moreCtx.answerCallbackQuery();

    if (moreCtx.callbackQuery.data === "more_no") {
      addMore = false;
      await moreCtx.editMessageText("✅ Kirimlar saqlandi!");
    } else {
      await moreCtx.editMessageText("✅ Saqlandi. Keyingisi...");
    }
  }

  const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));
  await ctx.reply("🏠 Asosiy menyu:", { reply_markup: menu });
}
