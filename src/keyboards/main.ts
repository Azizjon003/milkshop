import { Keyboard, InlineKeyboard } from "grammy";
import { prisma } from "../prisma";

// Statik asosiy menyu (fallback uchun)
export const mainMenuKeyboard = new Keyboard()
  .text("💰 Kirim qo'shish")
  .text("📤 Chiqim qo'shish")
  .row()
  .text("📋 Qarzlar")
  .text("📊 Balans")
  .row()
  .text("📈 Hisobotlar")
  .text("⚙️ Admin panel")
  .resized();

// Dinamik asosiy menyu (permissionga qarab)
interface UserPerms {
  canIncome: boolean;
  canExpense: boolean;
  canDebt: boolean;
  canReport: boolean;
  isSuperAdmin: boolean;
}

export function buildMainMenu(p: UserPerms): Keyboard {
  const kb = new Keyboard();
  const buttons: string[] = [];

  if (p.canIncome || p.isSuperAdmin) buttons.push("💰 Kirim qo'shish");
  if (p.canExpense || p.isSuperAdmin) buttons.push("📤 Chiqim qo'shish");
  if (p.canDebt || p.isSuperAdmin) buttons.push("📋 Qarzlar");
  if (p.canReport || p.isSuperAdmin) {
    buttons.push("📊 Balans");
    buttons.push("📈 Hisobotlar");
  }
  if (p.isSuperAdmin) buttons.push("⚙️ Admin panel");

  buttons.forEach((btn, i) => {
    kb.text(btn);
    if (i % 2 === 1) kb.row();
  });

  // Oxirgi qatorda "Bosh menyu" tugmasi
  if (buttons.length % 2 === 1) kb.row();
  kb.text("🏠 Bosh menyu");

  return kb.resized();
}

export async function getMainMenuForUser(telegramId: number): Promise<Keyboard> {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });

  if (!user) return new Keyboard().resized();

  return buildMainMenu({
    canIncome: user.canIncome,
    canExpense: user.canExpense,
    canDebt: user.canDebt,
    canReport: user.canReport,
    isSuperAdmin: user.isSuperAdmin,
  });
}

// Dinamik: Kirim turlari (DB dan)
export async function getIncomeTypesKeyboard(): Promise<InlineKeyboard> {
  const types = await prisma.incomeType.findMany({ orderBy: { id: "asc" } });
  const kb = new InlineKeyboard();
  types.forEach((t, i) => {
    kb.text(t.name, `income_${t.id}`);
    if (i % 2 === 1) kb.row();
  });
  return kb;
}

// Dinamik: Chiqim kategoriyalari (DB dan)
export async function getExpenseCategoriesKeyboard(): Promise<InlineKeyboard> {
  const cats = await prisma.expenseCategory.findMany({ orderBy: { id: "asc" } });
  const kb = new InlineKeyboard();
  cats.forEach((c, i) => {
    kb.text(c.name, `expense_${c.id}`);
    if (i % 2 === 1) kb.row();
  });
  return kb;
}

// Dinamik: Firmalar (DB dan)
export async function getFirmsKeyboard(): Promise<InlineKeyboard> {
  const firms = await prisma.firm.findMany({ orderBy: { id: "asc" } });
  const kb = new InlineKeyboard();
  firms.forEach((f, i) => {
    kb.text(f.name, `firm_${f.id}`);
    if (i % 2 === 1) kb.row();
  });
  return kb;
}

// Qarz turi
export const debtTypeKeyboard = new InlineKeyboard()
  .text("➕ Qarz qo'shish", "debt_add")
  .text("➖ Qarz to'lash", "debt_pay");

// Yana qo'shish
export const addMoreKeyboard = new InlineKeyboard()
  .text("✅ Ha", "more_yes")
  .text("❌ Yo'q", "more_no");

// Bekor qilish
export const cancelKeyboard = new Keyboard()
  .text("❌ Bekor qilish")
  .resized();
