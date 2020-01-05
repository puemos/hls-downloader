import * as R from "ramda";
import { createSelector } from "reselect";
import { activeTabSelector } from "../tabs/selectors";

export const requestItemsSelector = R.pathOr({}, [
  "requests",
  "entities",
  "requests"
]);

export const currentRequestSelector = requestId =>
  createSelector(requestItemsSelector, requests =>
    R.propOr({}, requestId, requests)
  );

export const requestsByActiveTabSelector = createSelector(
  requestItemsSelector,
  activeTabSelector,
  (requests, activeTab) =>
    R.pipe(R.values, R.filter(R.propEq("tabId", activeTab)))(requests)
);
