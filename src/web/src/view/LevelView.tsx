import { RootState } from "@hls-downloader/core/lib/adapters/redux/root-reducer";
import { levelsSlice } from "@hls-downloader/core/lib/adapters/redux/slices";
import { Level, LevelStatus } from "@hls-downloader/core/lib/entities";
import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { LevelProgressView } from "./LevelProgressView";

export const LevelView = (props: { level: Level }) => {
  const status = useSelector<RootState, LevelStatus | null>(
    (state) => state.levels.levelsStatus[props.level.id]
  );
  const dispatch = useDispatch();

  function onDownloadLevelClick(level: Level) {
    dispatch(levelsSlice.actions.downloadLevel({ levelID: level.id }));
  }
  return (
    <div>
      <div>
        <span>
          {props.level.height}x{props.level.width}
        </span>
        <span>{props.level.bitrate}</span>
        <button onClick={() => onDownloadLevelClick(props.level)}>
          download
        </button>
      </div>
      {status && (
        <LevelProgressView
          status={status}
          levelID={props.level.id}
        ></LevelProgressView>
      )}
    </div>
  );
};
