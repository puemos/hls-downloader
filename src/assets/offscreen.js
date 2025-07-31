let ffmpeg;
async function ensureFFmpeg() {
  if (ffmpeg) return;
  const { FFmpeg } = await import(chrome.runtime.getURL('assets/ffmpeg/ffmpeg.js'));
  ffmpeg = new FFmpeg();
  await ffmpeg.load({
    coreURL: chrome.runtime.getURL('assets/ffmpeg/ffmpeg-core.js'),
    wasmURL: chrome.runtime.getURL('assets/ffmpeg/ffmpeg-core.wasm'),
    workerURL: chrome.runtime.getURL('assets/ffmpeg/worker.js'),
  });
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'create-object-url') {
    const url = URL.createObjectURL(msg.blob);
    sendResponse({ url });
  } else if (msg && msg.type === 'revoke-object-url') {
    URL.revokeObjectURL(msg.url);
  } else if (msg && msg.type === 'ts-to-object-url') {
    (async () => {
      await ensureFFmpeg();
      const data = new Uint8Array(await msg.blob.arrayBuffer());
      await ffmpeg.writeFile('input.ts', data);
      await ffmpeg.exec(['-i', 'input.ts', '-acodec', 'copy', '-vcodec', 'copy', 'output.mp4']);
      await ffmpeg.deleteFile('input.ts');
      const out = await ffmpeg.readFile('output.mp4');
      await ffmpeg.deleteFile('output.mp4');
      const url = URL.createObjectURL(new Blob([out], { type: 'video/mp4' }));
      sendResponse({ url });
    })();
    return true;
  }
  return false;
});
