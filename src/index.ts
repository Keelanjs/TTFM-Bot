import { Client, Intents, Message } from "discord.js";
import io from "socket.io-client";

import { accessToken, botInstancesCount, discordBotSecretsPath } from "./const";
import { getAWSSecrets } from "./utils/getAWSSecrets";
import { Bot } from "./bot";
import { getArgsFromMessage } from "./utils/getArgsFromMessage";
import { BotMessages } from "./types";

void (async () => {
  const response = await getAWSSecrets<{ discordtoken: string }>(
    discordBotSecretsPath
  );

  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
  });

  const bots = {};

  for (let i = 0; i < botInstancesCount; i++) {
    const bot = await Bot.createBot(io, accessToken);
    bots[i] = bot;
  }

  client.once("ready", () => {
    console.log("Bot is ready");
  });

  client.on("messageCreate", (message: Message) => {
    const { command, args } = getArgsFromMessage(message);

    if (!command) {
      return;
    }

    switch (command) {
      case BotMessages.CONNECT:
        if (!args || !args[0] || !args[1]) {
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
        break;

      default:
        return;
    }
  });

  client.login(response.discordtoken);
})();
