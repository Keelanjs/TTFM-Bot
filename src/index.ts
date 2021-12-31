import { Client, Intents, Message } from "discord.js";

import { botInstancesCount, discordBotSecretsPath } from "./const";
import { getAWSSecrets } from "./utils/getAWSSecrets";
import { getArgsFromMessage } from "./utils/getArgsFromMessage";
import { BotMessages } from "./types";
import { onConnectHandler } from "./commandsHandlers/onConnectHandler";
import { createBots } from "./utils/createBots";

void (async () => {
  const { discord_token } = await getAWSSecrets<{
    discord_token: string;
  }>(discordBotSecretsPath);

  const bots = await createBots(botInstancesCount);

  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
  });

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
        onConnectHandler(bots, message, args);
        break;

      case BotMessages.PLAY_PLAYLIST:
        if (!args || !args[0] || !args[1] || !args[2]) {
          message.reply("Invalid command");
          return;
        }
        message.reply("Fetching playlist...");

        const [bnumber, playlistId, DjSeatNumber] = args;
        bots[bnumber]
          .playPlaylist(playlistId, DjSeatNumber)
          .then(() => {
            message.reply(`Playing playlist to ${playlistId}`);
          })
          .catch(() => {
            message.reply("Cannot play");
          });
        break;

      default:
        return;
    }
  });

  client.login(discord_token);
})();
