export const runtime = {
  getManifest: () => ({
    version: "1.0.0",
    name: "HLS Downloader",
    description: "Fast, private HLS stream downloads.",
  }),
};

const browser = { runtime };

export default browser;
