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

export enum SocketMessages {
  takeDjSeat = "takeDjSeat",
  leaveDjSeat = "leaveDjSeat",
  skipDjTrack = "skipDjTrack",
  userWasDisconnected = "userWasDisconnected",
  addAvatarToDancefloor = "addAvatarToDancefloor",
  sendNextTrackToPlay = "sendNextTrackToPlay",
  playNextSong = "playNextSong",
  sendInitialState = "sendInitialState",
  sendSatisfaction = "sendSatisfaction",
  startConnection = "startConnection",
  userConnectionLost = "userConnectionLost",
  userDisconnected = "user:disconnected",
  wrongMessagePayload = "wrongMessagePayload",
}
