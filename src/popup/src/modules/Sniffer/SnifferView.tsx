import { Playlist } from "@hls-downloader/core/lib/entities";
import {
  Button,
  Input,
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
  ScrollArea,
  Card,
  cn,
} from "@hls-downloader/design-system";
import { Banana } from "lucide-react";
import React from "react";
import PlaylistModule from "../Playlist/PlaylistModule";

interface Props {
  playlists: Playlist[];
  currentPlaylistId: string | undefined;
  filter: string;
  clearPlaylists: () => void;
  copyPlaylistsToClipboard: () => void;
  setFilter: (filter: string) => void;
  setCurrentPlaylistId: (playlistId?: string) => void;
  directURI: string;
  setDirectURI: (uri: string) => void;
  addDirectPlaylist: () => void;
}

const SnifferView = ({
  clearPlaylists,
  copyPlaylistsToClipboard,
  setFilter,
  filter,
  playlists,
  currentPlaylistId,
  setCurrentPlaylistId,
  directURI,
  setDirectURI,
  addDirectPlaylist,
}: Props) => {
  return (
    <div className="flex flex-col p-4 space-y-4">
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
        <>
          <div className="flex flex-col space-y-3">
            <h3 className="text-base font-semibold">Sniffer</h3>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  className="p-2 border rounded-md flex-1"
                  placeholder="https://.../playlist.m3u8"
                  value={directURI}
                  onChange={(e) => setDirectURI(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={addDirectPlaylist}
                  disabled={!directURI}
                >
                  Add
                </Button>
              </div>
              <div className="flex items-center gap-2">
                <Input
                  type="text"
                  className="p-2 border rounded-md flex-1"
                  placeholder="Filter playlists..."
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                />
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={copyPlaylistsToClipboard}
                  disabled={playlists.length === 0}
                >
                  Copy URLs
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={clearPlaylists}
                  disabled={playlists.length === 0}
                >
                  Clear all
                </Button>
              </div>
            </div>
          </div>

          {playlists.length === 0 && (
            <div className="flex flex-col items-center justify-center mt-12">
              <Banana></Banana>

              <h3 className="mt-4 text-lg font-semibold">No videos found</h3>
              <p className="mt-2 mb-4 text-sm text-muted-foreground text-center">
                Try sniffing a page or paste a playlist URL above.
              </p>
            </div>
          )}

          {playlists.length > 0 && (
            <ScrollArea className="h-[calc(100vh-14rem)] w-full max-w-full view-transition view-enter-active">
              {playlists.map((item) => (
                <Card
                  key={item.id}
                  onClick={() => setCurrentPlaylistId(item.id)}
                  interactive
                  className={cn(
                    "mb-2 w-full overflow-hidden text-left text-sm",
                  )}
                >
                  <div className="flex flex-col w-full gap-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 min-w-0">
                      <div className="font-semibold truncate min-w-0">
                        {item.pageTitle}
                      </div>
                      <div className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap">
                        {new Date(item.createdAt!).toLocaleString()}
                      </div>
                    </div>
                    <HoverCard>
                      <HoverCardTrigger asChild>
                        <div className="block text-xs font-medium truncate w-full min-w-0">
                          {item.initiator}
                        </div>
                      </HoverCardTrigger>
                      <HoverCardContent>
                        <ScrollArea className="break-all max-h-60 text-xs font-medium">
                          {item.initiator}
                        </ScrollArea>
                      </HoverCardContent>
                    </HoverCard>
                  </div>
                  <HoverCard>
                    <HoverCardTrigger asChild>
                      <div className="block text-xs text-muted-foreground truncate w-full min-w-0">
                        {item.uri}
                      </div>
                    </HoverCardTrigger>
                    <HoverCardContent>
                      <ScrollArea className="break-all max-h-60 text-xs text-muted-foreground">
                        {item.uri}
                      </ScrollArea>
                    </HoverCardContent>
                  </HoverCard>
                </Card>
              ))}
            </ScrollArea>
          )}
        </>
      )}
    </div>
  );
};

export default SnifferView;
