import { getRoomConfigForClient } from "./utils/getRoomConfigForClient";

export class Bot {
  private readonly io: any;
  public accessToken: string = "";

  private constructor(io, accessToken: string) {
    this.io = io;
    this.accessToken = accessToken;
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

  public static async createBot(io, accessToken: string): Promise<Bot> {
    const _bot = new Bot(io, accessToken);
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
        console.info("connected in client");
        resolve({ connected: true });
      });

      socket.on("connect_error", (error: Error) => {
        console.log({ msg: "Error in Bot.connect", error });
      });
    });
  }
}
