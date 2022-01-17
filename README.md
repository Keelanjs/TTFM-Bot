# Discord Bot

Currently we have 20 bot instances

Commads:

```
!status
```

Returns the current status of all bots

```
!connect <botNumber>  <roomName>
```

To connect to a room, use the bot number and the room slug

```
!disconnect <botNumber>
```

To disconect from the room use the bot number

```
!playPlaylist <botNumber> <playlistId> <DjseatNumber>
```

Play selected playlist

```
!leaveDJ <botNumber>
```

To leave the dj seat use the bot

```
!takeDJ <botNumber> <DjseatNumber>
```

To take the dj seat use the bot number and dj seat number

```
!changeMode <bot> | <testing>
```

Changes the mode for all bots

The bot has two modes `testing` and `bot`. Default mode is `bot`. In `bot` mode it will leave the stage when someone starts playing, and will start playing again when stage is empty. This functionality is disabled in `testing` mode.
