export type Tab =
  | TabOptions.ABOUT
  | TabOptions.DOWNLOADS
  | TabOptions.SETTINGS
  | TabOptions.SNIFTER;

export enum TabOptions {
  SNIFTER = "sniffer",
  DOWNLOADS = "downloads",
  SETTINGS = "settings",
  ABOUT = "about",
}
