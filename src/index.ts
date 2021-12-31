import { Client, Intents, Message } from "discord.js";
import io from "socket.io-client";

import { botInstancesCount, discordBotSecretsPath } from "./const";
import { getAWSSecrets } from "./utils/getAWSSecrets";
import { Bot } from "./bot";
import { getArgsFromMessage } from "./utils/getArgsFromMessage";
import { BotMessages } from "./types";
import { getUserProfile } from "./utils/getUserProfile";
import { Bots, onConnectHandler } from "./commandsHandlers/onConnectHandler";

void (async () => {
  const secrets = await getAWSSecrets<{
    discord_token: string;
    auth_bot_token: string;
    spotify_refresh_token: string;
    spotify_credentials: string;
  }>(discordBotSecretsPath);

  const profile = await getUserProfile(secrets.auth_bot_token);

  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
  });

  const bots: Bots = {};

  for (let i = 0; i < botInstancesCount; i++) {
    const bot = await Bot.createBot(
      io,
      secrets.auth_bot_token,
      secrets.spotify_refresh_token,
      secrets.spotify_credentials,
      profile.avatarId,
      profile.uuid
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

  client.login(secrets.discord_token);
})();
