import { CHANGE_TAB, REMOVE_TAB } from "./action-types";

export function removeTab(tab) {
  return { type: REMOVE_TAB, payload: tab };
}
export function changeTab(tab) {
  return { type: CHANGE_TAB, payload: tab };
}
