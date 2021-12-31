import { Message } from "discord.js";
import { botInstancesCount } from "../const";

import { IBots } from "../utils/createBots";

export const onStatusHandler = (bots: IBots, message: Message): void => {
  let statusMessage = "*\n";
  const botsCount = Object.keys(bots).length;

  for (let i = 1; i <= botsCount; i++) {
    if (bots[i].roomSlug) {
      statusMessage = `${statusMessage} Bot-${i} connected to ${bots[i].roomSlug}\n`;
    } else {
      statusMessage = `${statusMessage} Bot-${i} disconnected\n`;
    }
  }

  message.reply(statusMessage);
};
