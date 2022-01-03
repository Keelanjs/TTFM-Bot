import { Bot, Io } from "../bot";
import fetch from "node-fetch";

import { BotTestState } from "./mocks/botTestState";
import { mockedSpotifyResponse } from "./mocks/mockedSpotifyResponse";
import { SocketMessages } from "../types";
import { Socket } from "socket.io-client";

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
  const djSeatNumber = "1";

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

  test("should fetch playlist and emit playNextSong message", async () => {
    fetch.mockImplementation(() =>
      Promise.resolve({
        json: () => mockedSpotifyResponse,
      })
    );

    botState.setState({
      socket: socketMock as any as Socket,
      roomSlug,
      songs: [],
      playingUserUuids: [],
      djSeatNumber: null,
    });

    await bot.playPlaylist("playlist-id", djSeatNumber);

    expect(socketMock.emit).toHaveBeenNthCalledWith(
      1,
      SocketMessages.leaveDjSeat,
      {
        userUuid: botUuid,
      }
    );

    expect(socketMock.emit).toHaveBeenNthCalledWith(
      2,
      SocketMessages.takeDjSeat,
      {
        avatarId,
        djSeatKey: 1,
        nextTrack: {
          song: {
            artistName: "artist-name-1",
            duration: 0,
            genre: "",
            id: "spotify:track:test-id-1",
            isrc: "test-isrc-1",
            musicProvider: "spotify",
            trackName: "test-name-1",
            trackUrl: "",
          },
        },
      }
    );

    expect(socketMock.emit.mock.calls[2][0]).toBe(
      SocketMessages.sendNextTrackToPlay
    );

    expect(botState.getState().djSeatNumber).toBe(Number(djSeatNumber));
    expect(botState.getState().songs).toHaveLength(2);
    expect(botState.getState().songs).toMatchInlineSnapshot(`
Array [
  Object {
    "artistName": "artist-name-1",
    "duration": 0,
    "genre": "",
    "id": "spotify:track:test-id-1",
    "isrc": "test-isrc-1",
    "musicProvider": "spotify",
    "trackName": "test-name-1",
    "trackUrl": "",
  },
  Object {
    "artistName": "artist-name-2",
    "duration": 0,
    "genre": "",
    "id": "spotify:track:test-id-2",
    "isrc": "test-isrc-2",
    "musicProvider": "spotify",
    "trackName": "test-name-2",
    "trackUrl": "",
  },
]
`);
  });
});
