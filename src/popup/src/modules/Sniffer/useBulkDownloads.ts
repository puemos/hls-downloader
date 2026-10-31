import { Playlist } from "@hls-downloader/core/lib/entities";
import { RootState } from "@hls-downloader/core/lib/store/root-reducer";
import {
  levelInspectionsSlice,
  levelsSlice,
} from "@hls-downloader/core/lib/store/slices";
import { selectBulkDownloads } from "@hls-downloader/core/lib/use-cases/select-bulk-downloads";
import { useContext, useEffect, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RouterContext } from "../Navbar/RouterContext";
import { TabOptions } from "../Navbar/types";

export default function useBulkDownloads(
  playlists: Playlist[],
  visiblePlaylists: Playlist[],
) {
  const dispatch = useDispatch();
  const { setTab } = useContext(RouterContext);
  const [mode, setMode] = useState<"idle" | "selecting" | "review">("idle");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [quality, setQuality] = useState("best");
  const submitted = useRef(false);
  const levels = useSelector((state: RootState) => state.levels.levels);
  const preferences = useSelector(
    (state: RootState) => state.playlistPreferences,
  );
  const config = useSelector((state: RootState) => state.config);
  const inspections = useSelector((state: RootState) => state.levelInspections);
  const selected = playlists.filter((p) => selectedIds.includes(p.id));
  const selections = selectBulkDownloads({
    playlists: selected,
    levels: Object.values(levels),
    maxHeight: quality === "best" ? undefined : Number(quality),
    preferredAudioLanguage: config.preferredAudioLanguage,
    ...preferences,
  });

  useEffect(() => {
    if (mode !== "review") return;
    const tracks = new Set(
      selections
        .flatMap((item) => [item.video?.id, item.audio?.id])
        .filter(Boolean),
    );
    tracks.forEach((levelId) => {
      if (
        levelId &&
        (!inspections.status[levelId] || inspections.status[levelId] === "idle")
      ) {
        dispatch(levelInspectionsSlice.actions.inspect({ levelId }));
      }
    });
  }, [mode, selections, inspections.status, dispatch]);

  const items = selections.map((item) => {
    const tracks = [item.video, item.audio].filter((track) => track != null);
    const error =
      item.error ??
      tracks
        .map((track) => {
          const inspection = inspections.inspections[track.id];
          if (inspections.status[track.id] === "error")
            return "Could not check this stream. Open it individually to retry.";
          if (inspection?.supported === false)
            return (
              inspection.message || "This stream uses unsupported encryption."
            );
          return undefined;
        })
        .find(Boolean);
    const checking =
      !error &&
      tracks.some(
        (track) =>
          !inspections.inspections[track.id] ||
          inspections.status[track.id] === "pending",
      );
    return { ...item, error, checking };
  });
  const ready = items.filter(
    (item) => item.video && !item.error && !item.checking,
  );
  const checking = items.some((item) => item.checking);

  return {
    mode,
    selectedIds: selected.map((p) => p.id),
    quality,
    setQuality,
    items,
    readyCount: ready.length,
    checking,
    start: () => {
      submitted.current = false;
      setSelectedIds([]);
      setMode("selecting");
    },
    cancel: () => {
      setMode("idle");
      setSelectedIds([]);
    },
    toggle: (id: string) =>
      setSelectedIds((ids) =>
        ids.includes(id) ? ids.filter((other) => other !== id) : [...ids, id],
      ),
    allVisibleSelected:
      visiblePlaylists.length > 0 &&
      visiblePlaylists.every((p) => selectedIds.includes(p.id)),
    toggleAll: () =>
      setSelectedIds((ids) =>
        visiblePlaylists.every((p) => ids.includes(p.id))
          ? ids.filter((id) => !visiblePlaylists.some((p) => p.id === id))
          : [...new Set([...ids, ...visiblePlaylists.map((p) => p.id)])],
      ),
    review: () => {
      if (selected.length) setMode("review");
    },
    back: () => setMode("selecting"),
    queue: () => {
      if (submitted.current || checking || !ready.length) return;
      submitted.current = true;
      ready.forEach((item) =>
        dispatch(
          levelsSlice.actions.download({
            levelID: item.video!.id,
            audioLevelID: item.audio?.id,
            subtitleLevelID: item.subtitle?.id,
          }),
        ),
      );
      setMode("idle");
      setSelectedIds([]);
      setTab(TabOptions.DOWNLOADS);
    },
  };
}

export type BulkDownloads = ReturnType<typeof useBulkDownloads>;
