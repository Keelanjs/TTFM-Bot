import { Socket } from "socket.io-client";

import { SocketMessages, Song } from "./types";
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
  private socket: Socket | undefined = undefined;

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

  public async connectToRoom(
    roomSlug: string,
    roomPassword: string | null
  ): Promise<void> {
    const roomConfig = await getRoomConfigForClient(roomSlug, this.accessToken);

    if (!roomConfig) {
      return;
    }

    await this.connect(
      roomConfig.socketDomain,
      roomConfig.socketPath,
      roomPassword
    );
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

  private getSongsFromPlaylist(playlist): Song[] {
    const songs = playlist.tracks.items.map((item) => {
      const song: Song = {
        artistName: item["track"]["artists"][0]["name"],
        duration: Math.floor(item["track"]["duration_ms"] / 1000),
        genre: "",
        id: "spotify:track:" + item["track"]["id"],
        isrc: item["track"]["external_ids"]["isrc"],
        musicProvider: "spotify",
        trackName: item["track"]["name"],
        trackUrl: "",
      };

      return song;
    });

    return songs;
  }

  public async playPlaylist(
    playlistId: string,
    DjSeatNumber: string
  ): Promise<void> {
    const playlist = await fetchSpotifyPlaylist(
      playlistId,
      this.spotifyRefreshToken,
      this.spotifyCredentials
    );

    this.songs = this.getSongsFromPlaylist(playlist);

    this.socket?.emit(SocketMessages.takeDjSeat, {
      avatarId: this.avatarId,
      djSeatKey: Number(DjSeatNumber),
      nextTrack: { song: this.songs[0] },
    });
  }
}
