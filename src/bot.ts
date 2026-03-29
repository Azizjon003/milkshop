import { Bot, session } from "grammy";
import { conversations, createConversation } from "@grammyjs/conversations";
import { config } from "./config";
import { MyContext, SessionData } from "./types";
import { authMiddleware, requirePermission } from "./middlewares/auth";
import { getMainMenuForUser } from "./keyboards/main";
import { incomeConversation } from "./conversations/income";
import { expenseConversation } from "./conversations/expense";
import { debtConversation } from "./conversations/debt";
import { adminConversation } from "./conversations/admin";
import { excelRangeConversation } from "./conversations/excelRange";
import balanceHandler from "./handlers/balance";
import reportsHandler from "./handlers/reports";

// Bot yaratish
const bot = new Bot<MyContext>(config.botToken);

// Session
bot.use(
  session({
    initial: (): SessionData => ({}),
  })
);

// Conversations plugin
bot.use(conversations());

// Menyu tugmalari bosilganda aktiv conversationni to'xtatish
// (createConversation dan OLDIN bo'lishi kerak)
const menuButtons = [
  "💰 Kirim qo'shish",
  "📤 Chiqim qo'shish",
  "📋 Qarzlar",
  "📊 Balans",
  "📈 Hisobotlar",
  "⚙️ Admin panel",
  "🏠 Bosh menyu",
];
bot.use(async (ctx, next) => {
  const text = ctx.message?.text;
  if (text && (text === "/start" || menuButtons.includes(text))) {
    await ctx.conversation.exitAll();
  }
  await next();
});

bot.use(createConversation(incomeConversation));
bot.use(createConversation(expenseConversation));
bot.use(createConversation(debtConversation));
bot.use(createConversation(adminConversation));
bot.use(createConversation(excelRangeConversation));

// Auth middleware
bot.use(authMiddleware);

// /start va "Bosh menyu" — istalgan joyda qayta boshlash
async function goHome(ctx: MyContext) {
  await ctx.conversation.exitAll();
  const menu = await getMainMenuForUser(ctx.from!.id);
  await ctx.reply(
    `Assalomu alaykum, ${ctx.from?.first_name}! 🥛\n\nSut fermasi boshqaruv botiga xush kelibsiz.\nQuyidagi menyudan tanlang:`,
    { reply_markup: menu }
  );
}

bot.command("start", goHome);
bot.hears("🏠 Bosh menyu", goHome);

// Menyu handlerlari (permission tekshirish bilan)
bot.hears("💰 Kirim qo'shish", requirePermission("canIncome"), async (ctx) => {
  await ctx.conversation.enter("incomeConversation");
});

bot.hears("📤 Chiqim qo'shish", requirePermission("canExpense"), async (ctx) => {
  await ctx.conversation.enter("expenseConversation");
});

bot.hears("📋 Qarzlar", requirePermission("canDebt"), async (ctx) => {
  await ctx.conversation.enter("debtConversation");
});

bot.hears("📊 Balans", requirePermission("canReport"));
bot.hears("📈 Hisobotlar", requirePermission("canReport"));

bot.hears("⚙️ Admin panel", requirePermission("isSuperAdmin"), async (ctx) => {
  await ctx.conversation.enter("adminConversation");
});

// Balans va hisobotlar
bot.use(balanceHandler);
bot.use(reportsHandler);

// Xatolarni ushlash
bot.catch((err) => {
  console.error("Bot xatosi:", err);
});

// Botni ishga tushirish
bot.start({
  onStart: () => {
    console.log("✅ Bot ishga tushdi!");
  },
});
