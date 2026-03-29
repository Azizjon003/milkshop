import { MyContext, MyConversation } from "../types";
import { prisma } from "../prisma";
import {
  getExpenseCategoriesKeyboard,
  getMainMenuForUser,
  addMoreKeyboard,
  cancelKeyboard,
} from "../keyboards/main";

export async function expenseConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  let addMore = true;

  while (addMore) {
    // 1. Kategoriya tanlash
    const expenseCatsKb = await conversation.external(() => getExpenseCategoriesKeyboard());
    await ctx.reply("📂 Chiqim kategoriyasini tanlang:", {
      reply_markup: expenseCatsKb,
    });

    const catCtx = await conversation.waitForCallbackQuery(/^expense_\d+$/);
    const categoryId = parseInt(catCtx.callbackQuery.data.split("_")[1]);
    await catCtx.answerCallbackQuery();

    const category = await conversation.external(async () => {
      const c = await prisma.expenseCategory.findUnique({ where: { id: categoryId } });
      return c ? { id: c.id, name: c.name } : null;
    });

    if (!category) {
      await ctx.reply("❌ Kategoriya topilmadi!");
      return;
    }

    await catCtx.editMessageText(`✅ Tanlandi: ${category.name}`);

    // 2. Summa
    await ctx.reply("💰 Summa kiriting:", {
      reply_markup: cancelKeyboard,
    });

    let amount: number;
    while (true) {
      const amountCtx = await conversation.waitFor("message:text");
      if (amountCtx.message.text === "❌ Bekor qilish") {
        const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));
        await ctx.reply("❌ Bekor qilindi.", { reply_markup: menu });
        return;
      }
      amount = parseFloat(amountCtx.message.text);
      if (isNaN(amount) || amount <= 0) {
        await ctx.reply("⚠️ Iltimos, to'g'ri summa kiriting:");
        continue;
      }
      break;
    }

    // 3. Izoh
    await ctx.reply("📝 Izoh kiriting (yoki - bosing):");

    const commentCtx = await conversation.waitFor("message:text");
    if (commentCtx.message.text === "❌ Bekor qilish") {
      const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));
      await ctx.reply("❌ Bekor qilindi.", { reply_markup: menu });
      return;
    }
    const comment =
      commentCtx.message.text === "-" ? null : commentCtx.message.text;

    const summary =
      `📋 Chiqim ma'lumotlari:\n\n` +
      `📂 Kategoriya: ${category.name}\n` +
      `💰 Summa: ${amount.toLocaleString()} so'm\n` +
      `📝 Izoh: ${comment || "—"}`;

    await ctx.reply(summary);

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

    await ctx.reply("✅ Chiqim saqlandi! Yana qo'shasizmi?", {
      reply_markup: addMoreKeyboard,
    });

    const moreCtx = await conversation.waitForCallbackQuery(/^more_(yes|no)$/);
    await moreCtx.answerCallbackQuery();

    if (moreCtx.callbackQuery.data === "more_no") {
      addMore = false;
      await moreCtx.editMessageText("✅ Chiqimlar saqlandi!");
    } else {
      await moreCtx.editMessageText("✅ Saqlandi. Keyingisi...");
    }
  }

  const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));
  await ctx.reply("🏠 Asosiy menyu:", { reply_markup: menu });
}
