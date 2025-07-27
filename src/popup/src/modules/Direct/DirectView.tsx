import { Playlist } from "@hls-downloader/core/lib/entities";
import { Button, Input, ScrollArea, cn } from "@hls-downloader/design-system";
import { Banana } from "lucide-react";
import React from "react";
import PlaylistModule from "../Playlist/PlaylistModule";

interface Props {
  playlists: Playlist[];
  currentPlaylistId: string | undefined;
  filter: string;
  directURI: string;
  clearPlaylists: () => void;
  addDirectPlaylist: () => void;
  setCurrentPlaylistId: (playlistId?: string) => void;
  setFilter: (filter: string) => void;
  setDirectURI: (filter: string) => void;
}

const DirectView = ({
  clearPlaylists,
  setFilter,
  filter,
  playlists,
  currentPlaylistId,
  setCurrentPlaylistId,
  addDirectPlaylist,
  directURI,
  setDirectURI,
}: Props) => {
  const showFilterInput = playlists.length !== 0;

  return (
    <div className="flex flex-col p-1 mt-4 space-y-3">
      {currentPlaylistId && (
        <>
          <Button
            onClick={() => setCurrentPlaylistId()}
            size="sm"
            variant="secondary"
          >
            Back
          </Button>
          <PlaylistModule id={currentPlaylistId}></PlaylistModule>
        </>
      )}
      {!currentPlaylistId && (
        <div className="flex flex-row items-center justify-between gap-2">
          <Input
            type="text"
            placeholder="https://.../playlist.m3u8"
            value={directURI}
            onChange={(e) => setDirectURI(e.target.value)}
          />
          <Button
            size="sm"
            variant="secondary"
            onClick={addDirectPlaylist}
          >
            Add
          </Button>
        </div>
      )}
      {!currentPlaylistId && playlists.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20">
          <Banana></Banana>

          <h3 className="mt-4 text-lg font-semibold">No videos</h3>
          <p className="mt-2 mb-4 text-sm text-muted-foreground">
            Enter an URI and hit the Add button
          </p>
        </div>
      )}
      {!currentPlaylistId && playlists.length > 0 && (
        <ScrollArea className="h-[calc(100vh-10rem)] w-full max-w-full">
          {playlists.map((item) => (
            <div
              key={item.id}
              className={cn(
                "flex flex-col mb-2 items-start gap-2 rounded-lg border p-3 text-left text-sm hover:bg-muted",
              )}
            >
              <div className="flex flex-col w-full gap-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <div className="font-semibold">{item.pageTitle}</div>
                  </div>
                  <div className={cn("ml-auto text-xs")}>
                    {new Date(item.createdAt!).toLocaleString()}
                  </div>
                </div>
                <div className="text-xs font-medium truncate" title={item.initiator}>
                  {item.initiator}
                </div>
              </div>
              <div className="text-xs text-muted-foreground truncate" title={item.uri}>
                {item.uri}
              </div>
              <div className="flex flex-row-reverse w-full">
                <Button
                  onClick={() => setCurrentPlaylistId(item.id)}
                  size="sm"
                  variant="secondary"
                >
                  Select
                </Button>
              </div>
            </div>
          ))}
        </ScrollArea>
      )}
    </div>
  );
};

export default DirectView;
