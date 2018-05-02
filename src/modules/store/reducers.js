import { combineReducers } from "redux";
import requests from "../requests/reducer";
import tabs from "../tabs/reducer";
import router from "../router/reducer";
import downloads from "../downloads/reducer";

export default combineReducers({
  router,
  requests,
  tabs,
  downloads
});
