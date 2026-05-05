import { Bot, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import { config } from "./config";
import { MyContext, SessionData } from "./types";
import { authMiddleware, requirePermission } from "./middlewares/auth";
import { getMainMenuForUser, langKeyboard } from "./keyboards/main";
import { incomeConversation } from "./conversations/income";
import { expenseConversation } from "./conversations/expense";
import { debtConversation } from "./conversations/debt";
import { adminConversation } from "./conversations/admin";
import { excelRangeConversation } from "./conversations/excelRange";
import balanceHandler from "./handlers/balance";
import reportsHandler from "./handlers/reports";
import { t, getUserLang, Lang } from "./i18n";
import { prisma } from "./prisma";

const bot = new Bot<MyContext>(config.botToken);

bot.use(
  session({
    initial: (): SessionData => ({}),
  })
);

bot.use(conversations());

// Asosiy menyu tugmalari emoji prefiksi bilan boshlanadi.
// Conversation ichida bo'lsak ham, foydalanuvchi menyu tugmasini bossa, conversation tugatiladi.
const MENU_PREFIX_RE = /^(\/start|\/help|💰|📤|📋|📊|📈|⚙️?|🏠|🌐)(\s|$)/;

bot.use(async (ctx, next) => {
  const text = ctx.message?.text;
  if (text && MENU_PREFIX_RE.test(text)) {
    try {
      await ctx.conversation.exitAll();
    } catch (e) {
      console.error("exitAll xatosi:", e);
    }
  }
  await next();
});

bot.use(createConversation(incomeConversation));
bot.use(createConversation(expenseConversation));
bot.use(createConversation(debtConversation));
bot.use(createConversation(adminConversation));
bot.use(createConversation(excelRangeConversation));

bot.use(authMiddleware);

// /start va "Bosh menyu" (barcha tilda)
async function goHome(ctx: MyContext) {
  const lang = await getUserLang(ctx.from!.id);
  const menu = await getMainMenuForUser(ctx.from!.id);
  await ctx.reply(t("welcome", lang, { name: ctx.from!.first_name }), {
    reply_markup: menu,
  });
}

bot.command("start", goHome);
bot.hears(/^🏠 /, goHome);

// Til o'zgartirish tugmasi (barcha tilda)
bot.hears(/^🌐 /, async (ctx) => {
  const lang = await getUserLang(ctx.from!.id);
  await ctx.reply(t("chooseLang", lang), { reply_markup: langKeyboard });
});

// Til tanlash callback
bot.callbackQuery(/^lang_(uz|ru|tj)$/, async (ctx) => {
  const lang = ctx.callbackQuery.data.split("_")[1] as Lang;
  await prisma.user.update({
    where: { telegramId: BigInt(ctx.from.id) },
    data: { language: lang },
  });
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(t("langChanged", lang));
  const menu = await getMainMenuForUser(ctx.from.id);
  await ctx.reply(t("welcome", lang, { name: ctx.from.first_name }), {
    reply_markup: menu,
  });
});

// Kirim (barcha tilda)
bot.hears(/^💰 /, requirePermission("canIncome"), async (ctx) => {
  await ctx.conversation.enter("incomeConversation");
});

// Chiqim (barcha tilda)
bot.hears(/^📤 /, requirePermission("canExpense"), async (ctx) => {
  await ctx.conversation.enter("expenseConversation");
});

// Qarzlar (barcha tilda)
bot.hears(/^📋 /, requirePermission("canDebt"), async (ctx) => {
  await ctx.conversation.enter("debtConversation");
});

// Balans (barcha tilda)
bot.hears(/^📊 /, requirePermission("canReport"));

// Hisobotlar (barcha tilda)
bot.hears(/^📈 /, requirePermission("canReport"));

// Admin panel (barcha tilda)
bot.hears(/^⚙️ /, requirePermission("isSuperAdmin"), async (ctx) => {
  await ctx.conversation.enter("adminConversation");
});

bot.use(balanceHandler);
bot.use(reportsHandler);

bot.catch(async (err) => {
  console.error("Bot xatosi:", err.error);
  console.error("Update:", JSON.stringify(err.ctx.update, null, 2));
  try {
    await err.ctx.conversation.exitAll();
  } catch {}
  try {
    const lang = await getUserLang(err.ctx.from!.id);
    const menu = await getMainMenuForUser(err.ctx.from!.id);
    await err.ctx.reply(
      "⚠️ Botda kutilmagan xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring yoki 🏠 Bosh menyu tugmasini bosing.",
      { reply_markup: menu }
    );
  } catch (e) {
    console.error("Foydalanuvchini xabardor qilishda xato:", e);
  }
});

bot.start({
  drop_pending_updates: true,
  onStart: () => {
    console.log("✅ Bot ishga tushdi!");
  },
});
