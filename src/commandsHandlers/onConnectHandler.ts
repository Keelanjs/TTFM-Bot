import { Message } from "discord.js";
import { Bot } from "../bot";

export interface Bots {
  [key: string]: Bot;
}

export const onConnectHandler = (
  bots: Bots,
  message: Message,
  args: string[] | undefined
) => {
  if (!args || args.length < 2) {
    message.reply("Invalid command");

    return;
  }

  message.reply("Bot is connecting...");

  const [botNumber, roomSlug] = args;

  bots[botNumber]
    .connectToRoom(roomSlug, null)
    .then(() => {
      message.reply(`Bot-${botNumber} is connected to ${roomSlug}`);
    })
    .catch(() => {
      message.reply("Cannot connect");
    });
};
