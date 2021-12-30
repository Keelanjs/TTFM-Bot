export enum BotMessages {
  CONNECT = "connect",
  PLAY_PLAYLIST = "playplaylist",
}

export type Song = {
  artistName: string;
  duration: number;
  genre: string;
  id: string;
  isrc: string | undefined;
  musicProvider: "spotify";
  trackName: string;
  trackUrl: string;
};
