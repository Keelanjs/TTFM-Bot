import { Message } from "discord.js";

import { IBots } from "../utils/createBots";

export const onConnectHandler = (
  bots: IBots,
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
