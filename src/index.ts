import { Client, Intents } from "discord.js";

import { botInstancesCount, discordBotSecretsPath } from "./const";
import { getAWSSecrets } from "./utils/getAWSSecrets";
import { createBots } from "./utils/createBots";
import { setDiscordMessagesListener } from "./utils/setDiscordMessagesListener";

void (async () => {
  const { discord_token } = await getAWSSecrets<{
    discord_token: string;
  }>(discordBotSecretsPath);

  const bots = await createBots(botInstancesCount);

  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
  });

  setDiscordMessagesListener(client, bots);

  client.once("ready", () => {
    console.log("Bot is ready");
  });

  client.login(discord_token);
})();
