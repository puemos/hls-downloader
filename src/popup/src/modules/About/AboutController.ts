import { runtime } from "webextension-polyfill";

interface ReturnType {
  version: string;
  name: string;
  description: string;
}

const useAboutController = (): ReturnType => {
  const { version, name, description } = runtime.getManifest();

  return {
    version,
    name,
    description,
  };
};

export default useAboutController;
