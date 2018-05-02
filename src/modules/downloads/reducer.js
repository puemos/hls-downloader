import * as R from "ramda";
import { ADD_DOWNLOAD, DOWNLOAD_CHANGE, DOWNLOAD_FINISHED, REMOVE_DOWNLOAD } from "./action-types";

const initState = {
  entities: {
    downloads: {}
  }
};

export default function downloads(state = initState, action) {
  switch (action.type) {
    case ADD_DOWNLOAD: {
      return {
        ...state,
        entities: {
          downloads: {
            ...state.entities.downloads,
            [action.payload.id]: action.payload
          }
        }
      };
    }
    case DOWNLOAD_CHANGE: {
      return {
        ...state,
        entities: {
          downloads: {
            ...state.entities.downloads,
            [action.payload.id]: {
              ...state.entities.downloads[action.payload.id],
              ...action.payload
            }
          }
        }
      };
    }
    case REMOVE_DOWNLOAD: {
      const filteredDownloads = R.toPairs(state.entities.downloads).filter(
        ([id]) => id !== action.payload
      );
      return {
        ...state,
        entities: {
          downloads: R.fromPairs(filteredDownloads)
        }
      };
    }
    case DOWNLOAD_FINISHED: {
      return {
        ...state,
        entities: {
          downloads: {
            ...state.entities.downloads,
            [action.payload.id]: {
              ...state.entities.downloads[action.payload.id],
              ...action.payload
            }
          }
        }
      };
    }
    default:
      return state;
  }
}
