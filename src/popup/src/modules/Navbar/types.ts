export type Tab =
  | TabOptions.ABOUT
  | TabOptions.DOWNLOADS
  | TabOptions.SETTINGS
  | TabOptions.SNIFTER
  | TabOptions.DIRECT;

export enum TabOptions {
  SNIFTER = "sniffer",
  DIRECT = "direct",
  DOWNLOADS = "downloads",
  SETTINGS = "settings",
  ABOUT = "about",
}
