import { schema } from "normalizr";

export const requestSchema = new schema.Entity(
  "requests",
  {},
  { idAttribute: "requestId" }
);
