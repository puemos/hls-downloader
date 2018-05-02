import * as R from "ramda";

export const activeTabSelector = R.pathOr(-1, ["router", "location", "search"]);
