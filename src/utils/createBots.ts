import { io } from "socket.io-client";

import { Bot } from "../bot";
import { BotState } from "../botState";
import { discordBotSecretsPath } from "../const";
import { getAWSSecrets } from "./getAWSSecrets";
import { getUserProfile } from "./getUserProfile";

export interface IBots {
  [key: string]: Bot;
}

export const createBots = async (botInstancesCount: number): Promise<IBots> => {
  const secrets = await getAWSSecrets<{
    auth_bot_token: string;
    spotify_refresh_token: string;
    spotify_credentials: string;
  }>(discordBotSecretsPath);

  const profile = await getUserProfile(secrets.auth_bot_token);

  const bots: IBots = {};

  for (let i = 1; i <= botInstancesCount; i++) {
    const bot = Bot.createBot(
      io,
      secrets.auth_bot_token,
      secrets.spotify_refresh_token,
      secrets.spotify_credentials,
      profile.avatarId,
      profile.uuid,
      new BotState()
    );
    bots[i] = bot;
  }

  return bots;
};
