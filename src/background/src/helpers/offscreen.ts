export async function ensureOffscreen(): Promise<void> {
  if (!('offscreen' in chrome)) return;
  const has = await (chrome.offscreen as any).hasDocument?.();
  if (!has) {
    await (chrome.offscreen as any).createDocument({
      url: chrome.runtime.getURL('offscreen.html'),
      reasons: [(chrome.offscreen as any).Reason?.BLOBS || 'BLOBS'],
      justification: 'create object URLs for downloads',
    });
  }
}
