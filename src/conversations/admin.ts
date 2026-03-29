import { InlineKeyboard, Keyboard } from "grammy";
import { MyContext, MyConversation } from "../types";
import { prisma } from "../prisma";
import { getMainMenuForUser, cancelKeyboard } from "../keyboards/main";

const adminMenuKeyboard = new InlineKeyboard()
  .text("📦 Kirim turlari", "admin_income")
  .row()
  .text("📂 Chiqim kategoriyalari", "admin_expense")
  .row()
  .text("🏢 Firmalar", "admin_firm")
  .row()
  .text("👥 Foydalanuvchilar", "admin_users");

function actionKeyboard(prefix: string) {
  return new InlineKeyboard()
    .text("➕ Qo'shish", `${prefix}_add`)
    .text("🗑 O'chirish", `${prefix}_del`);
}

async function getMenu(conversation: MyConversation, ctx: MyContext): Promise<Keyboard> {
  return await conversation.external(() => getMainMenuForUser(ctx.from!.id));
}

export async function adminConversation(
  conversation: MyConversation,
  ctx: MyContext
) {
  // Super admin tekshirish
  const user = await conversation.external(async () => {
    const u = await prisma.user.findUnique({
      where: { telegramId: BigInt(ctx.from!.id) },
    });
    return u ? { isSuperAdmin: u.isSuperAdmin } : null;
  });

  if (!user?.isSuperAdmin) {
    await ctx.reply("⛔ Bu funksiya faqat super admin uchun!");
    return;
  }

  await ctx.reply("⚙️ Admin panel — bo'limni tanlang:", {
    reply_markup: adminMenuKeyboard,
  });

  const sectionCtx = await conversation.waitForCallbackQuery(
    /^admin_(income|expense|firm|users)$/
  );
  const section = sectionCtx.callbackQuery.data.split("_")[1];
  await sectionCtx.answerCallbackQuery();

  // Foydalanuvchilar bo'limi
  if (section === "users") {
    await sectionCtx.editMessageText("👥 Foydalanuvchilar");
    await handleUsers(conversation, ctx);
    return;
  }

  // Kategoriyalar bo'limi
  const sectionLabel =
    section === "income"
      ? "📦 Kirim turlari"
      : section === "expense"
      ? "📂 Chiqim kategoriyalari"
      : "🏢 Firmalar";

  await sectionCtx.editMessageText(sectionLabel);

  const list = await conversation.external(async () => {
    if (section === "income") {
      const items = await prisma.incomeType.findMany({ orderBy: { id: "asc" } });
      return items.map((i) => ({ id: i.id, name: `${i.name} (${i.unit})` }));
    } else if (section === "expense") {
      const items = await prisma.expenseCategory.findMany({ orderBy: { id: "asc" } });
      return items.map((i) => ({ id: i.id, name: i.name }));
    } else {
      const items = await prisma.firm.findMany({ orderBy: { id: "asc" } });
      return items.map((i) => ({ id: i.id, name: i.name }));
    }
  });

  let listText = `${sectionLabel} ro'yxati:\n━━━━━━━━━━━━━━━━━━\n`;
  list.forEach((item, i) => {
    listText += `${i + 1}. ${item.name}\n`;
  });

  await ctx.reply(listText);
  await ctx.reply("Nima qilasiz?", {
    reply_markup: actionKeyboard(section),
  });

  const actionCtx = await conversation.waitForCallbackQuery(
    /^(income|expense|firm)_(add|del)$/
  );
  const action = actionCtx.callbackQuery.data.split("_")[1];
  await actionCtx.answerCallbackQuery();

  const menu = await getMenu(conversation, ctx);

  if (action === "add") {
    await actionCtx.editMessageText("➕ Qo'shish");

    if (section === "income") {
      await ctx.reply("📦 Yangi kirim turi nomini kiriting:", {
        reply_markup: cancelKeyboard,
      });

      const nameCtx = await conversation.waitFor("message:text");
      if (nameCtx.message.text === "❌ Bekor qilish") {
        await ctx.reply("❌ Bekor qilindi.", { reply_markup: menu });
        return;
      }
      const name = nameCtx.message.text;

      const unitKeyboard = new InlineKeyboard()
        .text("📦 dona", "unit_dona")
        .text("⚖️ kg", "unit_kg")
        .row()
        .text("⚖️ gr", "unit_gr")
        .text("🥛 litr", "unit_litr");

      await ctx.reply("📏 O'lchov birligini tanlang:", {
        reply_markup: unitKeyboard,
      });

      const unitCtx = await conversation.waitForCallbackQuery(/^unit_.+$/);
      await unitCtx.answerCallbackQuery();
      const unit = unitCtx.callbackQuery.data.split("_")[1];
      await unitCtx.editMessageText(`✅ O'lchov: ${unit}`);

      await conversation.external(async () => {
        await prisma.incomeType.create({ data: { name, unit } });
      });

      await ctx.reply(`✅ Kirim turi qo'shildi: ${name} (${unit})`, {
        reply_markup: menu,
      });
    } else if (section === "expense") {
      await ctx.reply("📂 Yangi chiqim kategoriyasi nomini kiriting:", {
        reply_markup: cancelKeyboard,
      });

      const nameCtx = await conversation.waitFor("message:text");
      if (nameCtx.message.text === "❌ Bekor qilish") {
        await ctx.reply("❌ Bekor qilindi.", { reply_markup: menu });
        return;
      }

      await conversation.external(async () => {
        await prisma.expenseCategory.create({ data: { name: nameCtx.message.text } });
      });

      await ctx.reply(`✅ Kategoriya qo'shildi: ${nameCtx.message.text}`, {
        reply_markup: menu,
      });
    } else {
      await ctx.reply("🏢 Yangi firma nomini kiriting:", {
        reply_markup: cancelKeyboard,
      });

      const nameCtx = await conversation.waitFor("message:text");
      if (nameCtx.message.text === "❌ Bekor qilish") {
        await ctx.reply("❌ Bekor qilindi.", { reply_markup: menu });
        return;
      }

      await conversation.external(async () => {
        await prisma.firm.create({ data: { name: nameCtx.message.text } });
      });

      await ctx.reply(`✅ Firma qo'shildi: ${nameCtx.message.text}`, {
        reply_markup: menu,
      });
    }
  } else {
    await actionCtx.editMessageText("🗑 O'chirish");

    const delKb = new InlineKeyboard();
    list.forEach((item, i) => {
      delKb.text(`${item.name}`, `del_${item.id}`);
      if (i % 2 === 1) delKb.row();
    });

    await ctx.reply("🗑 O'chirish uchun tanlang:", {
      reply_markup: delKb,
    });

    const delCtx = await conversation.waitForCallbackQuery(/^del_\d+$/);
    const delId = parseInt(delCtx.callbackQuery.data.split("_")[1]);
    await delCtx.answerCallbackQuery();

    const deleted = await conversation.external(async () => {
      try {
        if (section === "income") {
          const d = await prisma.incomeType.delete({ where: { id: delId } });
          return { success: true, name: d.name };
        } else if (section === "expense") {
          const d = await prisma.expenseCategory.delete({ where: { id: delId } });
          return { success: true, name: d.name };
        } else {
          const d = await prisma.firm.delete({ where: { id: delId } });
          return { success: true, name: d.name };
        }
      } catch {
        return { success: false, name: "" };
      }
    });

    if (deleted.success) {
      await ctx.reply(`✅ O'chirildi: ${deleted.name}`, { reply_markup: menu });
    } else {
      await ctx.reply(
        "❌ O'chirib bo'lmadi. Bu kategoriyaga bog'langan ma'lumotlar bor.",
        { reply_markup: menu }
      );
    }
  }
}

// ==========================================
// Foydalanuvchilarni boshqarish
// ==========================================

interface UserData {
  id: number;
  telegramId: string;
  fullName: string;
  isSuperAdmin: boolean;
  canIncome: boolean;
  canExpense: boolean;
  canDebt: boolean;
  canReport: boolean;
  isActive: boolean;
}

function buildPermKeyboard(u: UserData): InlineKeyboard {
  return new InlineKeyboard()
    .text(`💰 Kirim: ${u.canIncome ? "✅" : "❌"}`, "perm_canIncome")
    .text(`📤 Chiqim: ${u.canExpense ? "✅" : "❌"}`, "perm_canExpense")
    .row()
    .text(`📋 Qarz: ${u.canDebt ? "✅" : "❌"}`, "perm_canDebt")
    .text(`📈 Hisobot: ${u.canReport ? "✅" : "❌"}`, "perm_canReport")
    .row()
    .text(`${u.isActive ? "🟢 Faol" : "🔴 Bloklangan"}`, "perm_isActive")
    .text("✅ Tayyor", "perm_done");
}

function userInfoText(u: UserData): string {
  return (
    `👤 ${u.fullName}\n` +
    `📱 ID: ${u.telegramId}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `💰 Kirim: ${u.canIncome ? "✅" : "❌"}  📤 Chiqim: ${u.canExpense ? "✅" : "❌"}\n` +
    `📋 Qarz: ${u.canDebt ? "✅" : "❌"}  📈 Hisobot: ${u.canReport ? "✅" : "❌"}\n` +
    `Holat: ${u.isActive ? "🟢 Faol" : "🔴 Bloklangan"}\n` +
    `━━━━━━━━━━━━━━━━━━\n` +
    `O'zgartirish uchun bosing:`
  );
}

async function handleUsers(
  conversation: MyConversation,
  ctx: MyContext
) {
  const users = await conversation.external(async () => {
    const all = await prisma.user.findMany({ orderBy: { id: "asc" } });
    return all.map((u) => ({
      id: u.id,
      telegramId: u.telegramId.toString(),
      fullName: u.fullName,
      isSuperAdmin: u.isSuperAdmin,
      canIncome: u.canIncome,
      canExpense: u.canExpense,
      canDebt: u.canDebt,
      canReport: u.canReport,
      isActive: u.isActive,
    }));
  });

  let text = "👥 Foydalanuvchilar:\n━━━━━━━━━━━━━━━━━━\n";
  users.forEach((u, i) => {
    const perms = [];
    if (u.isSuperAdmin) perms.push("👑");
    if (u.canIncome) perms.push("💰");
    if (u.canExpense) perms.push("📤");
    if (u.canDebt) perms.push("📋");
    if (u.canReport) perms.push("📈");
    if (!u.isActive) perms.push("🚫");
    text += `${i + 1}. ${u.fullName} ${perms.join("")}\n`;
  });
  text += `\n👑=SuperAdmin 💰=Kirim 📤=Chiqim 📋=Qarz 📈=Hisobot 🚫=Blok`;

  await ctx.reply(text);

  // User tanlash yoki ID orqali qo'shish
  const userKb = new InlineKeyboard();
  users.forEach((u, i) => {
    userKb.text(u.fullName, `user_${u.id}`);
    if (i % 2 === 1) userKb.row();
  });
  userKb.row().text("➕ Telegram ID orqali qo'shish", "user_add_new");

  await ctx.reply("👤 Tanlang yoki yangi qo'shing:", {
    reply_markup: userKb,
  });

  const userCtx = await conversation.waitForCallbackQuery(/^user_/);
  await userCtx.answerCallbackQuery();

  const menu = await getMenu(conversation, ctx);

  // ======= Yangi user qo'shish =======
  if (userCtx.callbackQuery.data === "user_add_new") {
    await userCtx.editMessageText("➕ Yangi foydalanuvchi qo'shish");

    await ctx.reply("📱 Telegram ID kiriting:", {
      reply_markup: cancelKeyboard,
    });

    let telegramId: bigint;
    while (true) {
      const idCtx = await conversation.waitFor("message:text");
      if (idCtx.message.text === "❌ Bekor qilish") {
        await ctx.reply("❌ Bekor qilindi.", { reply_markup: menu });
        return;
      }
      const parsed = parseInt(idCtx.message.text);
      if (isNaN(parsed) || parsed <= 0) {
        await ctx.reply("⚠️ To'g'ri Telegram ID kiriting (faqat raqam):");
        continue;
      }
      telegramId = BigInt(parsed);
      break;
    }

    await ctx.reply("👤 Foydalanuvchi ismini kiriting:");
    const nameCtx = await conversation.waitFor("message:text");
    if (nameCtx.message.text === "❌ Bekor qilish") {
      await ctx.reply("❌ Bekor qilindi.", { reply_markup: menu });
      return;
    }
    const fullName = nameCtx.message.text;

    const created = await conversation.external(async () => {
      const existing = await prisma.user.findUnique({ where: { telegramId } });
      if (existing) return null;
      const u = await prisma.user.create({
        data: { telegramId, fullName, isActive: true },
      });
      return { id: u.id };
    });

    if (!created) {
      await ctx.reply("⚠️ Bu Telegram ID allaqachon ro'yxatda bor!", {
        reply_markup: menu,
      });
      return;
    }

    await ctx.reply(`✅ Foydalanuvchi qo'shildi: ${fullName}\nEndi ruxsatlarni sozlang — Admin panel > Foydalanuvchilar`, {
      reply_markup: menu,
    });
    return;
  }

  // ======= Mavjud user permission toggle =======
  const userId = parseInt(userCtx.callbackQuery.data.split("_")[1]);
  let selected = users.find((u) => u.id === userId);
  if (!selected) {
    await ctx.reply("❌ Foydalanuvchi topilmadi.", { reply_markup: menu });
    return;
  }

  await userCtx.editMessageText(userInfoText(selected), {
    reply_markup: buildPermKeyboard(selected),
  });

  // Toggle loop — "Tayyor" bosilguncha davom etadi
  while (true) {
    const permCtx = await conversation.waitForCallbackQuery(/^perm_.+$/);
    const permField = permCtx.callbackQuery.data.replace("perm_", "");
    await permCtx.answerCallbackQuery();

    if (permField === "done") {
      await permCtx.editMessageText(
        `✅ ${selected.fullName} — ruxsatlar saqlandi!`
      );
      break;
    }

    const field = permField as "canIncome" | "canExpense" | "canDebt" | "canReport" | "isActive";
    selected[field] = !selected[field];

    await conversation.external(async () => {
      await prisma.user.update({
        where: { id: userId },
        data: { [field]: selected![field] },
      });
    });

    await permCtx.editMessageText(userInfoText(selected), {
      reply_markup: buildPermKeyboard(selected),
    });
  }

  await ctx.reply("🏠 Asosiy menyu:", { reply_markup: menu });
}
