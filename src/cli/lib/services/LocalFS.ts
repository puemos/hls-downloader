import { IFS } from "core/dist/services/FS";
import { promises } from "fs";

export const LocalFS: IFS = {
  write: (path, data) =>
    promises.writeFile("./temp/" + path, Buffer.from(data)),
  append: (path, data) =>
    promises.appendFile("./temp/" + path, Buffer.from(data)),
  read: (path) => promises.readFile("./temp/" + path),
};
