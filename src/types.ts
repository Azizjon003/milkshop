import { Context, SessionFlavor } from "grammy";
import { Conversation, ConversationFlavor } from "@grammyjs/conversations";

export interface SessionData {}

export type MyContext = ConversationFlavor<
  Context & SessionFlavor<SessionData>
>;

export type MyConversation = Conversation<MyContext, MyContext>;
