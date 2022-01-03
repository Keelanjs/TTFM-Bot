import { Socket, io } from "socket.io-client";
import { BotState } from "./botState";

import {
  IInitialStateReceived,
  ILeaveDjSeat,
  ISpotifyPlaylist,
  ITakeDjSeat,
  SocketMessages,
  Song,
} from "./types";
import { fetchSpotifyPlaylist } from "./utils/fetchSpotifyPlaylist";
import { getRoomConfigForClient } from "./utils/getRoomConfigForClient";

type Io = typeof io;

export class Bot {
  private readonly io: Io;
  public accessToken: string;
  private spotifyRefreshToken: string;
  private spotifyCredentials: string;
  private avatarId: string;
  private botUuid: string;
  private socket: Socket | undefined;

  public botState: BotState;

  private constructor(
    io: Io,
    accessToken: string,
    spotifyRefreshToken: string,
    spotifyCredentials: string,
    avatarId: string,
    botUuid: string,
    botState: BotState
  ) {
    this.io = io;
    this.accessToken = accessToken;
    this.spotifyRefreshToken = spotifyRefreshToken;
    this.spotifyCredentials = spotifyCredentials;
    this.avatarId = avatarId;
    this.botUuid = botUuid;
    this.botState = botState;
  }

  public static async createBot(
    io: Io,
    accessToken: string,
    spotifyRefreshToken: string,
    spotifyCredentials: string,
    avatarId: string,
    botUuid: string,
    botState: BotState
  ): Promise<Bot> {
    const _bot = new Bot(
      io,
      accessToken,
      spotifyRefreshToken,
      spotifyCredentials,
      avatarId,
      botUuid,
      botState
    );

    return _bot;
  }

  private async delay(delay: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  private setPlayNextSongListener(socket: Socket): void {
    socket.on(SocketMessages.playNextSong, () => {
      this.sendNextTrackToPlay();
    });
  }

  private setSendInitialStateListener(socket: Socket): void {
    socket.on(
      SocketMessages.sendInitialState,
      (state: IInitialStateReceived) => {
        this.botState.setInitialState(state);

        this.takeOrLeaveDjSeat();
      }
    );
  }

  private setTakeDjSeatListener(socket: Socket): void {
    socket.on(SocketMessages.takeDjSeat, (msg: ITakeDjSeat) => {
      this.botState.addNewPlayingDj(msg.userUuid);

      this.takeOrLeaveDjSeat();
    });
  }

  private setLeaveDjSeatListener(socket: Socket): void {
    socket.on(SocketMessages.leaveDjSeat, (msg: ILeaveDjSeat) => {
      this.botState.removePlayingDj(msg.userUuid);

      this.takeOrLeaveDjSeat();
    });
  }

  private takeOrLeaveDjSeat(): void {
    const shouldStayOnStage = this.botState.checkIfShouldStayOnStage(
      this.botUuid
    );

    if (shouldStayOnStage) {
      this.takeDjSeat();
    } else {
      this.socket?.emit(SocketMessages.leaveDjSeat, { userUuid: this.botUuid });
    }
  }

  private configureListeners(socket: Socket): void {
    this.setPlayNextSongListener(socket);
    this.setSendInitialStateListener(socket);
    this.setTakeDjSeatListener(socket);
    this.setLeaveDjSeatListener(socket);
  }

  public async connect(
    socketDomain: string,
    socketPath: string,
    password: string | null
  ): Promise<{ connected: boolean }> {
    const socket = this.io(`https://${socketDomain}`, {
      path: socketPath,
      transportOptions: {
        polling: {
          extraHeaders: {
            "X-TT-password": password,
            authorization: `Bearer ${this.accessToken}`,
          },
        },
      },
    });

    this.configureListeners(socket);

    return new Promise((resolve, _reject) => {
      socket.on("connect", () => {
        console.info("Connected in client");
        this.socket = socket;
        resolve({ connected: true });
      });

      socket.on("connect_error", (error: Error) => {
        console.log({ msg: "Error in Bot.connect", error });
      });
    });
  }

  private async close(): Promise<boolean> {
    return new Promise((resolveClose, _reject) => {
      this.socket?.on("disconnect", () => {
        resolveClose(true);
        this.socket = undefined;
        console.log("Connection closed");
      });

      if (!this.socket) {
        return;
      }

      this.socket.io.reconnection(false);
      this.socket.close();
    });
  }

  private sendNextTrackToPlay(): void {
    const song = this.botState.getRandomSong();

    if (!song) {
      return;
    }

    const nextTrack = {
      song,
      trackUrl: "",
    };

    this.socket?.emit(SocketMessages.sendNextTrackToPlay, nextTrack);
  }

  private getSongsFromPlaylist(playlist: ISpotifyPlaylist): Song[] {
    const songs = playlist.tracks.items.map((item) => {
      const song: Song = {
        artistName: item.track.artists[0].name,
        duration: Math.floor(item.track.duration_ms / 1000),
        genre: "",
        id: "spotify:track:" + item.track.id,
        isrc: item.track.external_ids.isrc,
        musicProvider: "spotify",
        trackName: item.track.name,
        trackUrl: "",
      };

      return song;
    });

    return songs;
  }

  private takeDjSeat(): void {
    this.socket?.emit(SocketMessages.takeDjSeat, {
      avatarId: this.avatarId,
      djSeatKey: this.botState.djSeatNumber,
      nextTrack: { song: this.botState.songs[0] },
    });
  }

  public async connectToRoom(
    roomSlug: string,
    roomPassword: string | null
  ): Promise<void> {
    this.disconnectFromRoom();
    const roomConfig = await getRoomConfigForClient(roomSlug, this.accessToken);

    if (!roomConfig) {
      return;
    }

    await this.connect(
      roomConfig.socketDomain,
      roomConfig.socketPath,
      roomPassword
    );

    this.botState.setRoomSlug(roomSlug);
  }

  public async disconnectFromRoom(): Promise<boolean> {
    this.leaveDjSeat();
    await this.delay(1000);

    const isClosed = await this.close();
    this.botState.setRoomSlug(undefined);

    return isClosed;
  }

  public async playPlaylist(
    playlistId: string,
    djSeatNumber: string
  ): Promise<void> {
    this.leaveDjSeat();

    const playlist = await fetchSpotifyPlaylist(
      playlistId,
      this.spotifyRefreshToken,
      this.spotifyCredentials
    );

    if (!playlist) {
      return;
    }

    const songs = this.getSongsFromPlaylist(playlist);
    this.botState.setSongs(songs);

    this.botState.setDjSeatNumber(djSeatNumber);

    this.takeOrLeaveDjSeat();

    this.sendNextTrackToPlay();
  }

  public async leaveDjSeat(): Promise<void> {
    this.botState.setDjSeatNumber(null);
    this.socket?.emit(SocketMessages.leaveDjSeat, { userUuid: this.botUuid });
  }
}
