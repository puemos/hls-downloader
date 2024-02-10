import { runtime } from "webextension-polyfill";

interface ReturnType {
  version: string;
}

const useAboutController = (): ReturnType => {
  const { version } = runtime.getManifest();

  return {
    version,
  };
};

export default useAboutController;
