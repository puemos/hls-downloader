import { CHANGE_TAB, REMOVE_TAB } from "./action-types";

/**
 *
 *
 * @export
 * @param {chrome.tabs.Tab} tab
 * @returns
 */
export function removeTab(tab) {
  return { type: REMOVE_TAB, payload: tab.id };
}

/**
 *
 *
 * @export
 * @param {chrome.tabs.Tab} tab
 * @returns
 */
export function changeTab(tab) {
  return { type: CHANGE_TAB, payload: tab };
}
