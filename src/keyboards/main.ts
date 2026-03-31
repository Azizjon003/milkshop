import { Keyboard, InlineKeyboard } from "grammy";
import { prisma } from "../prisma";
import { t, Lang, getUserLang } from "../i18n";

// Dinamik asosiy menyu (permission + tilga qarab)
interface UserPerms {
  canIncome: boolean;
  canExpense: boolean;
  canDebt: boolean;
  canReport: boolean;
  isSuperAdmin: boolean;
}

export function buildMainMenu(p: UserPerms, lang: Lang): Keyboard {
  const kb = new Keyboard();
  const buttons: string[] = [];

  if (p.canIncome || p.isSuperAdmin) buttons.push(t("btnIncome", lang));
  if (p.canExpense || p.isSuperAdmin) buttons.push(t("btnExpense", lang));
  if (p.canDebt || p.isSuperAdmin) buttons.push(t("btnDebt", lang));
  if (p.canReport || p.isSuperAdmin) {
    buttons.push(t("btnBalance", lang));
    buttons.push(t("btnReports", lang));
  }
  if (p.isSuperAdmin) buttons.push(t("btnAdmin", lang));

  buttons.forEach((btn, i) => {
    kb.text(btn);
    if (i % 2 === 1) kb.row();
  });

  if (buttons.length % 2 === 1) kb.row();
  kb.text(t("langBtn", lang)).text(t("homeBtn", lang));

  return kb.resized();
}

export async function getMainMenuForUser(telegramId: number): Promise<Keyboard> {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });

  if (!user) return new Keyboard().resized();

  const lang = (user.language as Lang) || "uz";

  return buildMainMenu(
    {
      canIncome: user.canIncome,
      canExpense: user.canExpense,
      canDebt: user.canDebt,
      canReport: user.canReport,
      isSuperAdmin: user.isSuperAdmin,
    },
    lang
  );
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

// Til tanlash
export const langKeyboard = new InlineKeyboard()
  .text("🇺🇿 O'zbekcha", "lang_uz")
  .row()
  .text("🇷🇺 Русский", "lang_ru")
  .row()
  .text("🇹🇯 Тоҷикӣ", "lang_tj");

// Qarz turi (tilga qarab)
export function getDebtTypeKeyboard(lang: Lang): InlineKeyboard {
  return new InlineKeyboard()
    .text(t("debtAdd", lang), "debt_add")
    .text(t("debtPay", lang), "debt_pay");
}

// Yana qo'shish (tilga qarab)
export function getAddMoreKeyboard(lang: Lang): InlineKeyboard {
  return new InlineKeyboard()
    .text(t("yes", lang), "more_yes")
    .text(t("no", lang), "more_no");
}

// Bekor qilish (tilga qarab)
export function getCancelKeyboard(lang: Lang): Keyboard {
  return new Keyboard().text(t("cancel", lang)).resized();
}
