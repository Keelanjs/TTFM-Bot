import { Bot, Io } from "../bot";
import fetch from "node-fetch";

import { BotTestState } from "./mocks/botTestState";

jest.mock("node-fetch", () => jest.fn());

const socketMock = {
  emit: jest.fn(),
  on: jest.fn(),
};
const io = jest.fn(() => socketMock) as any as Io;

describe("Bot tests", () => {
  let bot: Bot;
  let botState: BotTestState;

  const accessToken = "test-accessToken";
  const spotifyRefreshToken = "test-spotifyRefreshToken";
  const spotifyCredentials = "test-spotifyCredentials";
  const avatarId = "test-avatar-id";
  const botUuid = "test-bot-uuid";
  const roomSlug = "my-test-room";
  const testSocketPath = "test-socket-path";
  const testDomain = "test-socket-domain";

  beforeAll(() => {
    jest.useFakeTimers();
    jest.spyOn(global, "setTimeout");
  });

  beforeEach(() => {
    botState = new BotTestState();

    bot = Bot.createBot(
      io,
      accessToken,
      spotifyRefreshToken,
      spotifyCredentials,
      avatarId,
      botUuid,
      botState
    );

    socketMock.emit.mockClear();
    socketMock.on.mockClear();
    fetch.mockClear();
  });

  test("should fetch roomConfig and connect to the room", async () => {
    socketMock.on.mockImplementation((event, cb) => {
      if (event === "connect") {
        cb();
      }
    });

    fetch.mockImplementation(() =>
      Promise.resolve({
        json: () => {
          return {
            socketDomain: testDomain,
            socketPath: testSocketPath,
          };
        },
      })
    );

    await bot.connectToRoom(roomSlug, null);

    expect(fetch).toBeCalledWith(`/rooms/${roomSlug}/join`, {
      headers: { authorization: `Bearer ${accessToken}` },
      method: "POST",
    });

    expect(io).toBeCalledWith(`https://${testDomain}`, {
      path: testSocketPath,
      transportOptions: {
        polling: {
          extraHeaders: {
            "X-TT-password": null,
            authorization: `Bearer ${accessToken}`,
          },
        },
      },
    });

    expect(botState.getState().roomSlug).toBe(roomSlug);
    expect(botState.getState().socket).not.toBeUndefined();
  });
});
