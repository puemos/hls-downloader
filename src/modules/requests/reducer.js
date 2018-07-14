import { denormalize, normalize } from "normalizr";
import * as R from "ramda";
import { REMOVE_TAB } from "../tabs/action-types";
import { ADD_REQUEST } from "./action-types";
import { requestSchema } from "./schemas";

const initState = {
  entities: {
    requests: {}
  },
  result: []
};

const denormalizeRequests = state =>
  denormalize(state.result, [requestSchema], state.entities);

export default function requests(state = initState, action) {
  switch (action.type) {
    case ADD_REQUEST: {
      const items = denormalizeRequests(state);
      console.log([...items, action.payload]);

      const { entities, result } = normalize(
        R.uniqBy(R.prop("url"), [...items, action.payload]),
        [requestSchema]
      );
      return { ...state, entities, result };
    }
    case REMOVE_TAB:
      const items = denormalizeRequests(state);
      const filteredItems = R.filter(
        ({ tabId }) => tabId !== action.payload,
        items
      );

      const { entities, result } = normalize(filteredItems, [requestSchema]);
      return {
        ...state,
        entities,
        result
      };

    default:
      return state;
  }
}
