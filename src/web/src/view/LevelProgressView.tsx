import { levelsSlice } from "@hls-downloader/core/lib/adapters/redux/slices";
import { LevelStatus } from "@hls-downloader/core/lib/entities";
import React from "react";
import { useDispatch } from "react-redux";

export const LevelProgressView = (props: {
  status: LevelStatus;
  levelID: string;
}) => {
  const dispatch = useDispatch();
  function onDownloadLevelClick() {
    dispatch(levelsSlice.actions.saveLevelToFile({ levelID: props.levelID }));
  }
  return (
    <div>
      <span>
        <label htmlFor="download">Download progress:</label>
        <progress
          id="download"
          max="100"
          value={String((props.status.done / props.status.total) * 100)}
        ></progress>
        <span>
          {props.status.done} / {props.status.total}
        </span>
        <button onClick={() => onDownloadLevelClick()}></button>
      </span>
    </div>
  );
};
