import { io } from "socket.io-client";

import { Bot } from "../bot";
import { BotState } from "../botState";
import { discordBotSecretsPath } from "../const";
import { getAWSSecrets } from "./getAWSSecrets";
import { getUserProfile } from "./getUserProfile";
import { logIn } from "./login";

export interface IBots {
  [key: string]: Bot;
}

export const createBots = async (botInstancesCount: number): Promise<IBots> => {
  const secrets = await getAWSSecrets<{
    spotify_refresh_token: string;
    spotify_credentials: string;
    email_base: string;
    password: string;
  }>(discordBotSecretsPath);

  const bots: IBots = {};

  for (let i = 1; i <= botInstancesCount; i++) {
    const { accessToken } = await logIn({
      email: `${secrets.email_base}${i}@tt.fm`,
      password: secrets.password,
    });

    const profile = await getUserProfile(accessToken);

    const bot = Bot.createBot(
      io,
      accessToken,
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
