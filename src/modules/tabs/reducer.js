import { CHANGE_TAB } from "./action-types";

const initState = {
  activeTab: {}
};

export default function tabs(state = initState, action) {
  switch (action.type) {
    case CHANGE_TAB:
      return {
        ...state,
        activeTab: action.payload
      };
    default:
      return state;
  }
}
