import * as R from "ramda";
import { createSelector } from "reselect";
import { activeTabSelector } from "../tabs/selectors";
import { createMatchSelector } from "react-router-redux";

const currentRequestIdSelector = R.pipe(
  createMatchSelector({ path: "/request/:id" }),
  R.prop("params"),
  R.prop("id")
);

export const requestItemsSelector = R.pathOr({}, [
  "requests",
  "entities",
  "requests"
]);

export const currentRequestSelector = createSelector(
  requestItemsSelector,
  currentRequestIdSelector,
  (requests, requestId) => R.propOr({}, requestId, requests)
);

export const requestsByActiveTabSelector = createSelector(
  requestItemsSelector,
  activeTabSelector,
  (requests, activeTab) =>
    R.pipe(R.values, R.filter(R.propEq("tabId", activeTab)))(requests)
);
