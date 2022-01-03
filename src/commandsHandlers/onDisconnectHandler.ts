import { Message } from "discord.js";

import { IBots } from "../utils/createBots";

export const onDisconnectHandler = (
  bots: IBots,
  message: Message,
  args: string[] | undefined
): void => {
  if (!args || args.length < 1) {
    message.reply("Invalid command");

    return;
  }

  const [botNumber] = args;

  bots[botNumber]
    .disconnectFromRoom()
    .then(() => message.reply("Disconnected"));
};
