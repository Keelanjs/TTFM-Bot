import { BotState } from "../botState";
import {
  initialStateReceivedMock,
  userUuid_1,
  userUuid_2,
} from "./mocks/initialStateMock";
import { songMock_1, songMock_2 } from "./mocks/songMock";

describe("Bot state tests", () => {
  let botState: BotState;

  beforeEach(() => {
    botState = new BotState();
  });

  it("shoud set songs", () => {
    expect(botState.songs).toEqual([]);

    botState.setSongs([songMock_1]);

    expect(botState.songs[0]).toEqual(songMock_1);
  });

  it("shoud return random song", () => {
    botState.setSongs([songMock_1, songMock_2]);

    const song = botState.getRandomSong();

    expect(song).toMatchInlineSnapshot(
      {
        artistName: expect.any(String),
        duration: expect.any(Number),
        genre: expect.any(String),
        id: expect.any(String),
        isrc: expect.any(String),
        musicProvider: expect.any(String),
        trackName: expect.any(String),
        trackUrl: expect.any(String),
      },
      `
Object {
  "artistName": Any<String>,
  "duration": Any<Number>,
  "genre": Any<String>,
  "id": Any<String>,
  "isrc": Any<String>,
  "musicProvider": Any<String>,
  "trackName": Any<String>,
  "trackUrl": Any<String>,
}
`
    );
  });

  it("shoud set playing djs uuids from init state", () => {
    botState.setInitialState(initialStateReceivedMock);

    expect(botState.playingUserUuids).toHaveLength(2);
    expect(botState.playingUserUuids).toContain(userUuid_1);
    expect(botState.playingUserUuids).toContain(userUuid_2);
  });

  it("shoud add user uuid", () => {
    const newUserUuid = "third-user-uuid";
    botState.setInitialState(initialStateReceivedMock);

    expect(botState.playingUserUuids).toHaveLength(2);

    botState.addNewPlayingDj(newUserUuid);

    expect(botState.playingUserUuids).toHaveLength(3);
    expect(botState.playingUserUuids).toContain(userUuid_1);
    expect(botState.playingUserUuids).toContain(userUuid_2);
    expect(botState.playingUserUuids).toContain(newUserUuid);
  });

  it("shoud remove user-1 uuid", () => {
    botState.setInitialState(initialStateReceivedMock);
    expect(botState.playingUserUuids).toHaveLength(2);

    botState.removePlayingDj(userUuid_1);

    expect(botState.playingUserUuids).toHaveLength(1);
    expect(botState.playingUserUuids).toContain(userUuid_2);
  });
});