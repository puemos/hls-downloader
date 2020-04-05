import { combineReducers } from "redux";
import requests from "../requests/reducer";
import tabs from "../tabs/reducer";
import downloads from "../downloads/reducer";

export default combineReducers({
  requests,
  tabs,
  downloads
});
