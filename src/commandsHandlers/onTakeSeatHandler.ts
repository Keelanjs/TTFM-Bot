import { Message } from "discord.js";

import { IBots } from "../utils/createBots";

export const onTakeSeatHandler = (
  bots: IBots,
  message: Message,
  args: string[] | undefined
): void => {
  if (!args || args.length < 2) {
    message.reply("Invalid command");

    return;
  }

  const [botNumber, djSeatNumber] = args;

  bots[botNumber].takeDjSeat(djSeatNumber);

  message.reply(`Bot ${botNumber} taking seat: ${djSeatNumber}`);
};
