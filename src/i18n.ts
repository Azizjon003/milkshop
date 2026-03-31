import { prisma } from "./prisma";

export type Lang = "uz" | "ru" | "tj";

const translations: Record<string, Record<Lang, string>> = {
  // ===== UMUMIY =====
  welcome: {
    uz: "Assalomu alaykum, {name}! 🥛\n\nSut fermasi boshqaruv botiga xush kelibsiz.\nQuyidagi menyudan tanlang:",
    ru: "Здравствуйте, {name}! 🥛\n\nДобро пожаловать в бот управления молочной фермой.\nВыберите из меню:",
    tj: "Салом, {name}! 🥛\n\nХуш омадед ба боти идоракунии фермаи ширӣ.\nАз меню интихоб кунед:",
  },
  cancel: {
    uz: "❌ Bekor qilish",
    ru: "❌ Отменить",
    tj: "❌ Бекор кардан",
  },
  cancelled: {
    uz: "❌ Bekor qilindi.",
    ru: "❌ Отменено.",
    tj: "❌ Бекор карда шуд.",
  },
  mainMenu: {
    uz: "🏠 Asosiy menyu:",
    ru: "🏠 Главное меню:",
    tj: "🏠 Менюи асосӣ:",
  },
  homeBtn: {
    uz: "🏠 Bosh menyu",
    ru: "🏠 Главное меню",
    tj: "🏠 Менюи асосӣ",
  },
  langBtn: {
    uz: "🌐 Til",
    ru: "🌐 Язык",
    tj: "🌐 Забон",
  },
  yes: {
    uz: "✅ Ha",
    ru: "✅ Да",
    tj: "✅ Ҳа",
  },
  no: {
    uz: "❌ Yo'q",
    ru: "❌ Нет",
    tj: "❌ Не",
  },
  saved: {
    uz: "✅ Saqlandi!",
    ru: "✅ Сохранено!",
    tj: "✅ Нигоҳ дошта шуд!",
  },
  noPermission: {
    uz: "⛔ Sizga bu funksiya uchun ruxsat berilmagan!",
    ru: "⛔ У вас нет доступа к этой функции!",
    tj: "⛔ Шумо ба ин вазифа иҷозат надоред!",
  },
  invalidNumber: {
    uz: "⚠️ Iltimos, to'g'ri son kiriting:",
    ru: "⚠️ Пожалуйста, введите правильное число:",
    tj: "⚠️ Лутфан, рақами дуруст ворид кунед:",
  },

  // ===== MENYU TUGMALARI =====
  btnIncome: {
    uz: "💰 Kirim qo'shish",
    ru: "💰 Добавить доход",
    tj: "💰 Даромад илова",
  },
  btnExpense: {
    uz: "📤 Chiqim qo'shish",
    ru: "📤 Добавить расход",
    tj: "📤 Хароҷот илова",
  },
  btnDebt: {
    uz: "📋 Qarzlar",
    ru: "📋 Долги",
    tj: "📋 Қарзҳо",
  },
  btnBalance: {
    uz: "📊 Balans",
    ru: "📊 Баланс",
    tj: "📊 Баланс",
  },
  btnReports: {
    uz: "📈 Hisobotlar",
    ru: "📈 Отчёты",
    tj: "📈 Ҳисоботҳо",
  },
  btnAdmin: {
    uz: "⚙️ Admin panel",
    ru: "⚙️ Админ панель",
    tj: "⚙️ Админ панел",
  },

  // ===== TIL =====
  chooseLang: {
    uz: "🌐 Tilni tanlang:",
    ru: "🌐 Выберите язык:",
    tj: "🌐 Забонро интихоб кунед:",
  },
  langChanged: {
    uz: "✅ Til o'zgartirildi: O'zbekcha",
    ru: "✅ Язык изменён: Русский",
    tj: "✅ Забон иваз шуд: Тоҷикӣ",
  },

  // ===== KIRIM =====
  incomeSelectType: {
    uz: "📦 Kirim turini tanlang:",
    ru: "📦 Выберите тип дохода:",
    tj: "📦 Навъи даромадро интихоб кунед:",
  },
  incomeSelected: {
    uz: "✅ Tanlandi: {name}",
    ru: "✅ Выбрано: {name}",
    tj: "✅ Интихоб шуд: {name}",
  },
  incomeEnterQty: {
    uz: "📊 Miqdor kiriting ({unit}):",
    ru: "📊 Введите количество ({unit}):",
    tj: "📊 Миқдор ворид кунед ({unit}):",
  },
  incomeEnterPrice: {
    uz: "💵 1 {unit} narxini kiriting:",
    ru: "💵 Введите цену за 1 {unit}:",
    tj: "💵 Нархи 1 {unit}-ро ворид кунед:",
  },
  incomeSummary: {
    uz: "📋 Kirim ma'lumotlari:\n\n📦 Turi: {type}\n📊 Miqdor: {qty} {unit}\n💵 Narx (1 {unit}): {price} сомон\n💰 Jami: {total} сомон",
    ru: "📋 Данные дохода:\n\n📦 Тип: {type}\n📊 Количество: {qty} {unit}\n💵 Цена (1 {unit}): {price} сомон\n💰 Итого: {total} сомон",
    tj: "📋 Маълумоти даромад:\n\n📦 Навъ: {type}\n📊 Миқдор: {qty} {unit}\n💵 Нарх (1 {unit}): {price} сомон\n💰 Ҷамъ: {total} сомон",
  },
  incomeSaved: {
    uz: "✅ Kirim saqlandi! Yana qo'shasizmi?",
    ru: "✅ Доход сохранён! Добавить ещё?",
    tj: "✅ Даромад нигоҳ дошта шуд! Боз илова мекунед?",
  },
  incomeAllSaved: {
    uz: "✅ Kirimlar saqlandi!",
    ru: "✅ Доходы сохранены!",
    tj: "✅ Даромадҳо нигоҳ дошта шуданд!",
  },
  incomeSavedNext: {
    uz: "✅ Saqlandi. Keyingisi...",
    ru: "✅ Сохранено. Следующий...",
    tj: "✅ Нигоҳ дошта шуд. Навбатӣ...",
  },
  typeNotFound: {
    uz: "❌ Tur topilmadi!",
    ru: "❌ Тип не найден!",
    tj: "❌ Навъ ёфт нашуд!",
  },

  // ===== CHIQIM =====
  expenseSelectCat: {
    uz: "📂 Chiqim kategoriyasini tanlang:",
    ru: "📂 Выберите категорию расхода:",
    tj: "📂 Категорияи хароҷотро интихоб кунед:",
  },
  expenseEnterAmount: {
    uz: "💰 Summa kiriting:",
    ru: "💰 Введите сомонму:",
    tj: "💰 Маблағ ворид кунед:",
  },
  expenseEnterComment: {
    uz: "📝 Izoh kiriting (yoki - bosing):",
    ru: "📝 Введите комментарий (или - для пропуска):",
    tj: "📝 Тавзеҳ ворид кунед (ё - барои гузаштан):",
  },
  expenseSummary: {
    uz: "📋 Chiqim ma'lumotlari:\n\n📂 Kategoriya: {category}\n💰 Summa: {amount} сомон\n📝 Izoh: {comment}",
    ru: "📋 Данные расхода:\n\n📂 Категория: {category}\n💰 Сумма: {amount} сомон\n📝 Комментарий: {comment}",
    tj: "📋 Маълумоти хароҷот:\n\n📂 Категория: {category}\n💰 Маблағ: {amount} сомон\n📝 Тавзеҳ: {comment}",
  },
  expenseSaved: {
    uz: "✅ Chiqim saqlandi! Yana qo'shasizmi?",
    ru: "✅ Расход сохранён! Добавить ещё?",
    tj: "✅ Хароҷот нигоҳ дошта шуд! Боз илова мекунед?",
  },
  expenseAllSaved: {
    uz: "✅ Chiqimlar saqlandi!",
    ru: "✅ Расходы сохранены!",
    tj: "✅ Хароҷотҳо нигоҳ дошта шуданд!",
  },
  catNotFound: {
    uz: "❌ Kategoriya topilmadi!",
    ru: "❌ Категория не найдена!",
    tj: "❌ Категория ёфт нашуд!",
  },

  // ===== QARZLAR =====
  debtSelectFirm: {
    uz: "🏢 Firmani tanlang:",
    ru: "🏢 Выберите фирму:",
    tj: "🏢 Фирмаро интихоб кунед:",
  },
  debtBalance: {
    uz: "🏢 {name}\n💰 Qarz qoldig'i: {balance} сомон",
    ru: "🏢 {name}\n💰 Остаток долга: {balance} сомон",
    tj: "🏢 {name}\n💰 Боқимондаи қарз: {balance} сомон",
  },
  debtChooseAction: {
    uz: "Nima qilasiz?",
    ru: "Что хотите сделать?",
    tj: "Чӣ кор мекунед?",
  },
  debtAdd: {
    uz: "➕ Qarz qo'shish",
    ru: "➕ Добавить долг",
    tj: "➕ Қарз илова",
  },
  debtPay: {
    uz: "➖ Qarz to'lash",
    ru: "➖ Оплатить долг",
    tj: "➖ Қарз пардохт",
  },
  debtSummary: {
    uz: "📋 Qarz ma'lumotlari:\n\n🏢 Firma: {firm}\n📌 Turi: {type}\n💰 Summa: {amount} сомон\n📝 Izoh: {comment}\n━━━━━━━━━━━━━━━━━━\n💰 Yangi qoldiq: {balance} сомон",
    ru: "📋 Данные долга:\n\n🏢 Фирма: {firm}\n📌 Тип: {type}\n💰 Сумма: {amount} сомон\n📝 Комментарий: {comment}\n━━━━━━━━━━━━━━━━━━\n💰 Новый остаток: {balance} сомон",
    tj: "📋 Маълумоти қарз:\n\n🏢 Фирма: {firm}\n📌 Навъ: {type}\n💰 Маблағ: {amount} сомон\n📝 Тавзеҳ: {comment}\n━━━━━━━━━━━━━━━━━━\n💰 Боқимондаи нав: {balance} сомон",
  },
  debtAddMore: {
    uz: "Yana qo'shasizmi?",
    ru: "Добавить ещё?",
    tj: "Боз илова мекунед?",
  },
  firmNotFound: {
    uz: "❌ Firma topilmadi!",
    ru: "❌ Фирма не найдена!",
    tj: "❌ Фирма ёфт нашуд!",
  },

  // ===== BALANS =====
  balanceTitle: {
    uz: "📊 Umumiy balans:\n━━━━━━━━━━━━━━━━━━\n💰 Jami kirim: {income} сомон\n📤 Jami chiqim: {expense} сомон\n━━━━━━━━━━━━━━━━━━\n💵 Balans: {balance} сомон\n━━━━━━━━━━━━━━━━━━\n📋 Jami qarz qoldig'i: {debt} сомон",
    ru: "📊 Общий баланс:\n━━━━━━━━━━━━━━━━━━\n💰 Общий доход: {income} сомон\n📤 Общий расход: {expense} сомон\n━━━━━━━━━━━━━━━━━━\n💵 Баланс: {balance} сомон\n━━━━━━━━━━━━━━━━━━\n📋 Общий остаток долга: {debt} сомон",
    tj: "📊 Баланси умумӣ:\n━━━━━━━━━━━━━━━━━━\n💰 Ҷамъи даромад: {income} сомон\n📤 Ҷамъи хароҷот: {expense} сомон\n━━━━━━━━━━━━━━━━━━\n💵 Баланс: {balance} сомон\n━━━━━━━━━━━━━━━━━━\n📋 Ҷамъи боқимондаи қарз: {debt} сомон",
  },

  // ===== HISOBOTLAR =====
  reportsTitle: {
    uz: "📈 Hisobot turini tanlang:",
    ru: "📈 Выберите тип отчёта:",
    tj: "📈 Навъи ҳисоботро интихоб кунед:",
  },
  reportToday: {
    uz: "📅 Bugungi",
    ru: "📅 Сегодня",
    tj: "📅 Имрӯз",
  },
  reportMonthly: {
    uz: "📆 Oylik",
    ru: "📆 Месячный",
    tj: "📆 Моҳона",
  },
  reportByIncome: {
    uz: "💰 Kirim (turi bo'yicha)",
    ru: "💰 Доход (по типу)",
    tj: "💰 Даромад (аз рӯи навъ)",
  },
  reportByExpense: {
    uz: "📤 Chiqim (kategoriya)",
    ru: "📤 Расход (категория)",
    tj: "📤 Хароҷот (категория)",
  },
  reportDebtStatus: {
    uz: "📋 Qarz holati",
    ru: "📋 Статус долгов",
    tj: "📋 Ҳолати қарзҳо",
  },
  excelMonthly: {
    uz: "📥 Excel: Oylik",
    ru: "📥 Excel: Месяц",
    tj: "📥 Excel: Моҳ",
  },
  excelAll: {
    uz: "📥 Excel: Umumiy",
    ru: "📥 Excel: Общий",
    tj: "📥 Excel: Умумӣ",
  },
  excelRange: {
    uz: "📥 Excel: Sana bo'yicha",
    ru: "📥 Excel: По дате",
    tj: "📥 Excel: Аз рӯи сана",
  },
  noData: {
    uz: "  — yo'q",
    ru: "  — нет",
    tj: "  — нест",
  },
  total: {
    uz: "Jami",
    ru: "Итого",
    tj: "Ҷамъ",
  },
  profit: {
    uz: "Foyda",
    ru: "Прибыль",
    tj: "Фоида",
  },
  noDebt: {
    uz: "Qarz yo'q ✅",
    ru: "Долгов нет ✅",
    tj: "Қарз нест ✅",
  },
  totalDebt: {
    uz: "Jami qarz",
    ru: "Общий долг",
    tj: "Ҷамъи қарз",
  },
  excelPreparing: {
    uz: "⏳ {label} tayyorlanmoqda...",
    ru: "⏳ {label} подготавливается...",
    tj: "⏳ {label} тайёр карда мешавад...",
  },
  excelError: {
    uz: "❌ Excel yaratishda xatolik yuz berdi.",
    ru: "❌ Ошибка при создании Excel.",
    tj: "❌ Хато ҳангоми сохтани Excel.",
  },
  enterFromDate: {
    uz: "📅 Boshlanish sanasini kiriting (DD.MM.YYYY):",
    ru: "📅 Введите дату начала (ДД.ММ.ГГГГ):",
    tj: "📅 Санаи оғозро ворид кунед (DD.MM.YYYY):",
  },
  enterToDate: {
    uz: "📅 Tugash sanasini kiriting (DD.MM.YYYY):",
    ru: "📅 Введите дату конца (ДД.ММ.ГГГГ):",
    tj: "📅 Санаи анҷомро ворид кунед (DD.MM.YYYY):",
  },
  invalidDate: {
    uz: "⚠️ Noto'g'ri format. DD.MM.YYYY kiriting:",
    ru: "⚠️ Неверный формат. Введите ДД.ММ.ГГГГ:",
    tj: "⚠️ Формати нодуруст. DD.MM.YYYY ворид кунед:",
  },
  dateMustBeAfter: {
    uz: "⚠️ Tugash sanasi boshlanishdan keyin bo'lishi kerak:",
    ru: "⚠️ Дата конца должна быть после даты начала:",
    tj: "⚠️ Санаи анҷом бояд баъд аз оғоз бошад:",
  },
  debtGave: {
    uz: "Qarz berdi",
    ru: "Дал в долг",
    tj: "Қарз дод",
  },
  debtPaid: {
    uz: "To'ladi",
    ru: "Оплатил",
    tj: "Пардохт кард",
  },
};

// ===== HELPER =====
export function t(key: string, lang: Lang, params?: Record<string, string | number>): string {
  const entry = translations[key];
  if (!entry) return key;
  let text = entry[lang] || entry["uz"];
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      text = text.replace(new RegExp(`\\{${k}\\}`, "g"), String(v));
    }
  }
  return text;
}

// Foydalanuvchi tilini olish
export async function getUserLang(telegramId: number): Promise<Lang> {
  const user = await prisma.user.findUnique({
    where: { telegramId: BigInt(telegramId) },
  });
  return (user?.language as Lang) || "uz";
}
