export enum BotMessages {
  CONNECT = "connect",
  PLAY_PLAYLIST = "playplaylist",
  LEAVE_DJ_SEAT = "leavedj",
  DISCONNECT = "disconnect",
  STATUS = "status",
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

export type ValueMapWrapper<K, T> = {
  dataType: "Map";
  value: [K, T][];
};

export type DjSeat = {
  avatarId: string | null;
  isBot: boolean;
  isPlaying: boolean;
  isReconnecting: boolean;
  nextTrack: { song: Song } | null;
  userUuid: string | null;
  roomServerUserId: number | null;
};

export interface IInitialStateReceived {
  djSeats: ValueMapWrapper<number, DjSeat>;
}

export interface ITakeDjSeat {
  userUuid: string;
}

export interface ILeaveDjSeat {
  userUuid: string;
}
