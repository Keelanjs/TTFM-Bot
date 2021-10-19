import { Client, Intents, Message } from "discord.js";

void (() => {
  const client = new Client({
    intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
  });

  client.once("ready", () => {
    console.log("Bot is ready");
  });

  client.on("messageCreate", (message: Message) => {
    console.log("messageCreate", message);
  });

  client.login("token");
})();
