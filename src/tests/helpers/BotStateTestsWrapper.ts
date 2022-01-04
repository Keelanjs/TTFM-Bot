import { Socket } from "socket.io-client";
import { BotState } from "../../botState";
import { Song } from "../../types";

export interface IBotTestState {
  songs: Song[] | [];
  playingUserUuids: (string | null)[];
  djSeatNumber: number | null;
  roomSlug: string | undefined;
  socket: Socket | undefined;
}
export class BotStateTestsWrapper extends BotState {
  public setState(state: IBotTestState) {
    this.songs = state.songs;
    this.playingUserUuids = state.playingUserUuids;
    this.djSeatNumber = state.djSeatNumber;
    this.roomSlug = state.roomSlug;
    this.socket = state.socket;
  }

  public getState(): IBotTestState {
    return {
      songs: this.songs,
      playingUserUuids: this.playingUserUuids,
      djSeatNumber: this.djSeatNumber,
      roomSlug: this.roomSlug,
      socket: this.socket,
    };
  }
}
