chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg && msg.type === 'create-object-url') {
    const url = URL.createObjectURL(msg.blob);
    sendResponse({ url });
  } else if (msg && msg.type === 'revoke-object-url') {
    URL.revokeObjectURL(msg.url);
  }
  return false;
});
