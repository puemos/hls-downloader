import { ADD_REQUEST } from "./action-types";

export function addRequest(request) {
  return { type: ADD_REQUEST, payload: request };
}
