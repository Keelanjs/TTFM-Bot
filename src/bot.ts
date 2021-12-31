import { Socket } from "socket.io-client";

import {
  IInitialStateReceived,
  ILeaveDjSeat,
  ITakeDjSeat,
  SocketMessages,
  Song,
} from "./types";
import { fetchSpotifyPlaylist } from "./utils/fetchSpotifyPlaylist";
import { getRoomConfigForClient } from "./utils/getRoomConfigForClient";

export class Bot {
  private readonly io: any;
  public accessToken: string;
  private spotifyRefreshToken: string;
  private spotifyCredentials: string;
  private avatarId: string;
  private botUuid: string;

  private songs: Song[] = [];
  private socket: Socket | undefined;
  private playingUserUuids: (string | null)[] | [] = [];
  private djSeatNumber: number | null = null;
  public roomSlug: string | undefined;

  private constructor(
    io,
    accessToken: string,
    spotifyRefreshToken: string,
    spotifyCredentials: string,
    avatarId: string,
    botUuid: string
  ) {
    this.io = io;
    this.accessToken = accessToken;
    this.spotifyRefreshToken = spotifyRefreshToken;
    this.spotifyCredentials = spotifyCredentials;
    this.avatarId = avatarId;
    this.botUuid = botUuid;
  }

  public static async createBot(
    io,
    accessToken: string,
    spotifyRefreshToken: string,
    spotifyCredentials: string,
    avatarId: string,
    botUuid: string
  ): Promise<Bot> {
    const _bot = new Bot(
      io,
      accessToken,
      spotifyRefreshToken,
      spotifyCredentials,
      avatarId,
      botUuid
    );

    return _bot;
  }

  private async delay(delay: number) {
    return new Promise((resolve) => setTimeout(resolve, delay));
  }

  private setPlayNextSongListener(socket: Socket): void {
    socket.on(SocketMessages.playNextSong, () => {
      this.sendNextTrackToPlay();
    });
  }

  private setSendInitialStateListener(socket: Socket) {
    socket.on(
      SocketMessages.sendInitialState,
      (state: IInitialStateReceived) => {
        this.playingUserUuids = state.djSeats.value
          .map((item) => item[1].userUuid)
          .filter((a) => a);

        this.takeOrLeaveDjSeat();
      }
    );
  }

  private setTakeDjSeatListener(socket: Socket) {
    socket.on(SocketMessages.takeDjSeat, (msg: ITakeDjSeat) => {
      this.playingUserUuids = [...this.playingUserUuids, msg.userUuid];

      this.takeOrLeaveDjSeat();
    });
  }

  private setLeaveDjSeatListener(socket: Socket) {
    socket.on(SocketMessages.leaveDjSeat, (msg: ILeaveDjSeat) => {
      this.playingUserUuids = this.playingUserUuids.filter(
        (item) => item !== msg.userUuid
      );

      this.takeOrLeaveDjSeat();
    });
  }

  private takeOrLeaveDjSeat() {
    const playingDjs = this.playingUserUuids.filter(
      (item) => item !== this.botUuid
    );

    if (playingDjs.length > 0) {
      this.socket?.emit(SocketMessages.leaveDjSeat, { userUuid: this.botUuid });
    } else {
      this.takeDjSeat();
    }
  }

  private configureListeners(socket: Socket) {
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
      this.io.Socket.close();
    });
  }

  private sendNextTrackToPlay() {
    const song = this.songs[Math.floor(Math.random() * this.songs.length)];

    if (!song) {
      return;
    }

    const nextTrack = {
      song,
      trackUrl: "",
    };

    this.socket?.emit(SocketMessages.sendNextTrackToPlay, nextTrack);
  }

  private getSongsFromPlaylist(playlist): Song[] {
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

  private takeDjSeat() {
    this.socket?.emit(SocketMessages.takeDjSeat, {
      avatarId: this.avatarId,
      djSeatKey: this.djSeatNumber,
      nextTrack: { song: this.songs[0] },
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

    this.roomSlug = roomSlug;
  }

  public async disconnectFromRoom(): Promise<boolean> {
    this.leaveDjSeat();

    await this.delay(1000);

    const isClosed = await this.close();

    this.roomSlug = undefined;

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

    this.songs = this.getSongsFromPlaylist(playlist);
    this.djSeatNumber = Number(djSeatNumber);

    this.takeOrLeaveDjSeat();

    this.sendNextTrackToPlay();
  }

  public async leaveDjSeat(): Promise<void> {
    this.djSeatNumber = null;
    this.socket?.emit(SocketMessages.leaveDjSeat, { userUuid: this.botUuid });
  }
}
