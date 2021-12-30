import { Client, Intents, Message } from "discord.js";
import io from "socket.io-client";

import { botInstancesCount, discordBotSecretsPath } from "./const";
import { getAWSSecrets } from "./utils/getAWSSecrets";
import { Bot } from "./bot";
import { getArgsFromMessage } from "./utils/getArgsFromMessage";
import { BotMessages } from "./types";

void (async () => {
  const secrets = await getAWSSecrets<{
    discord_token: string;
    auth_bot_token: string;
    spotify_refresh_token: string;
    spotify_credentials: string;
  }>(discordBotSecretsPath);

  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
  });

  const bots = {};

  for (let i = 0; i < botInstancesCount; i++) {
    const bot = await Bot.createBot(
      io,
      secrets.auth_bot_token,
      secrets.spotify_refresh_token,
      secrets.spotify_credentials
    );
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

  client.login(secrets.discord_token);
})();
