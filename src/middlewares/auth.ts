import { NextFunction } from "grammy";
import { MyContext } from "../types";
import { prisma } from "../prisma";
import { config } from "../config";

// Foydalanuvchini ro'yxatga olish + active tekshirish
export async function authMiddleware(ctx: MyContext, next: NextFunction) {
  if (!ctx.from) return;

  const telegramId = BigInt(ctx.from.id);
  const isSuperAdmin = config.adminIds.includes(ctx.from.id);

  const user = await prisma.user.upsert({
    where: { telegramId },
    update: {
      fullName: ctx.from.first_name + (ctx.from.last_name ? ` ${ctx.from.last_name}` : ""),
    },
    create: {
      telegramId,
      fullName: ctx.from.first_name + (ctx.from.last_name ? ` ${ctx.from.last_name}` : ""),
      isSuperAdmin,
      canIncome: isSuperAdmin,
      canExpense: isSuperAdmin,
      canDebt: isSuperAdmin,
      canReport: isSuperAdmin,
      isActive: isSuperAdmin, // yangi userlar inactive
    },
  });

  // Faqat active userlar yoki super admin o'tadi
  if (!user.isActive && !user.isSuperAdmin) return;

  await next();
}

// Permission tekshirish helper
export type Permission = "canIncome" | "canExpense" | "canDebt" | "canReport" | "isSuperAdmin";

export function requirePermission(permission: Permission) {
  return async (ctx: MyContext, next: NextFunction) => {
    if (!ctx.from) return;

    const user = await prisma.user.findUnique({
      where: { telegramId: BigInt(ctx.from.id) },
    });

    if (!user || !user.isActive) return;

    // Super admin hammaga ruxsat
    if (user.isSuperAdmin) {
      await next();
      return;
    }

    if (!user[permission]) {
      await ctx.reply("⛔ Sizga bu funksiya uchun ruxsat berilmagan!");
      return;
    }

    await next();
  };
}
