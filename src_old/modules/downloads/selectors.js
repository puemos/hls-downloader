import * as R from "ramda";

export const downloadsItemsSelector = R.pathOr({}, [
  "downloads",
  "entities",
  "downloads"
]);
