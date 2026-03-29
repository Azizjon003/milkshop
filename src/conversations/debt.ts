import { MyContext, MyConversation } from "../types";
import { prisma } from "../prisma";
import {
  getFirmsKeyboard,
  getMainMenuForUser,
  debtTypeKeyboard,
  addMoreKeyboard,
  cancelKeyboard,
} from "../keyboards/main";

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
  let addMore = true;

  while (addMore) {
    // 1. Firma tanlash
    const firmsKb = await conversation.external(() => getFirmsKeyboard());
    await ctx.reply("🏢 Firmani tanlang:", {
      reply_markup: firmsKb,
    });

    const firmCtx = await conversation.waitForCallbackQuery(/^firm_\d+$/);
    const firmId = parseInt(firmCtx.callbackQuery.data.split("_")[1]);
    await firmCtx.answerCallbackQuery();

    const firm = await conversation.external(async () => {
      const f = await prisma.firm.findUnique({ where: { id: firmId } });
      return f ? { id: f.id, name: f.name } : null;
    });

    if (!firm) {
      await ctx.reply("❌ Firma topilmadi!");
      return;
    }

    const balance = await conversation.external(() => getFirmBalance(firmId));

    await firmCtx.editMessageText(
      `🏢 ${firm.name}\n💰 Qarz qoldig'i: ${balance.toLocaleString()} so'm`
    );

    // 2. Qarz turi
    await ctx.reply("Nima qilasiz?", {
      reply_markup: debtTypeKeyboard,
    });

    const typeCtx = await conversation.waitForCallbackQuery(
      /^debt_(add|pay)$/
    );
    const debtType = typeCtx.callbackQuery.data === "debt_add" ? "DEBT" : "PAYMENT";
    const debtLabel =
      debtType === "DEBT" ? "➕ Qarz qo'shish" : "➖ Qarz to'lash";
    await typeCtx.answerCallbackQuery();
    await typeCtx.editMessageText(`✅ ${debtLabel}`);

    // 3. Summa
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

    // 4. Izoh
    await ctx.reply("📝 Izoh kiriting (yoki - bosing):");

    const commentCtx = await conversation.waitFor("message:text");
    if (commentCtx.message.text === "❌ Bekor qilish") {
      const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));
      await ctx.reply("❌ Bekor qilindi.", { reply_markup: menu });
      return;
    }
    const comment =
      commentCtx.message.text === "-" ? null : commentCtx.message.text;

    // Saqlash
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

    const summary =
      `📋 Qarz ma'lumotlari:\n\n` +
      `🏢 Firma: ${firm.name}\n` +
      `📌 Turi: ${debtLabel}\n` +
      `💰 Summa: ${amount.toLocaleString()} so'm\n` +
      `📝 Izoh: ${comment || "—"}\n` +
      `━━━━━━━━━━━━━━━━━━\n` +
      `💰 Yangi qoldiq: ${newBalance.toLocaleString()} so'm`;

    await ctx.reply(summary);

    await ctx.reply("Yana qo'shasizmi?", {
      reply_markup: addMoreKeyboard,
    });

    const moreCtx = await conversation.waitForCallbackQuery(/^more_(yes|no)$/);
    await moreCtx.answerCallbackQuery();

    if (moreCtx.callbackQuery.data === "more_no") {
      addMore = false;
      await moreCtx.editMessageText("✅ Saqlandi!");
    } else {
      await moreCtx.editMessageText("✅ Saqlandi. Keyingisi...");
    }
  }

  const menu = await conversation.external(() => getMainMenuForUser(ctx.from!.id));
  await ctx.reply("🏠 Asosiy menyu:", { reply_markup: menu });
}
