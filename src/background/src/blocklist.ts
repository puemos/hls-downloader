import { isBlocklistDisabled } from "./config";
import blocklist from "../../../blocklist.json";

export const BLOCKED_DOMAINS = blocklist;

export function isBlocked(url: string): boolean {
  if (isBlocklistDisabled()) {
    return false;
  }

  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    return BLOCKED_DOMAINS.some((domain) => {
      return hostname === domain || hostname.endsWith("." + domain);
    });
  } catch (e) {
    // If URL parsing fails, we can't block it safely, or maybe we should?
    // For now, let's assume valid URLs.
    return false;
  }
}
