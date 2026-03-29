import dotenv from "dotenv";
dotenv.config();

export const config = {
  botToken: process.env.BOT_TOKEN!,
  adminIds: (process.env.ADMIN_IDS || "")
    .split(",")
    .map((id) => Number(id.trim()))
    .filter(Boolean),
};
