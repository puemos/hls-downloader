#!/usr/bin/env node
import { spawn, spawnSync } from "node:child_process";
import { once } from "node:events";
import { existsSync } from "node:fs";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const extensionDir = path.join(repoRoot, "dist", "mv3");
const keepArtifacts = process.env.E2E_KEEP_ARTIFACTS === "1";
const cleanDownload = process.env.E2E_CLEAN_DOWNLOAD === "1";
const defaultHlsUrl =
  "https://mtoczko.github.io/hls-test-streams/test-group/playlist.m3u8";
const hlsUrl = process.env.E2E_HLS_URL ?? defaultHlsUrl;

if (process.env.CI) {
  console.log("Skipping local browser e2e because CI is set.");
  process.exit(0);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitFor(
  label,
  fn,
  { timeoutMs = 15000, intervalMs = 150 } = {},
) {
  const start = Date.now();
  let lastError;
  while (Date.now() - start < timeoutMs) {
    try {
      const value = await fn();
      if (value) {
        return value;
      }
    } catch (error) {
      lastError = error;
    }
    await delay(intervalMs);
  }
  throw new Error(
    `Timed out waiting for ${label}${
      lastError ? `: ${lastError.message}` : ""
    }`,
  );
}

function getBravePath() {
  if (process.platform !== "darwin") {
    throw new Error(
      "Local browser e2e is supported on macOS with Brave Browser only.",
    );
  }

  const candidates = [
    process.env.E2E_BROWSER,
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
  ].filter(Boolean);
  const candidate = candidates.find((item) => item && existsSync(item));
  if (!candidate) {
    throw new Error(
      "Brave Browser was not found. Install Brave or set E2E_BROWSER to the Brave Browser binary path.",
    );
  }

  return candidate;
}

function runBuild() {
  const command = process.platform === "win32" ? "pnpm.cmd" : "pnpm";
  const result = spawnSync(command, ["run", "build:mv3"], {
    cwd: repoRoot,
    stdio: "inherit",
  });
  if (result.status !== 0) {
    throw new Error(
      `pnpm run build:mv3 failed with exit code ${result.status}`,
    );
  }
}

async function cleanupBuildArtifacts() {
  if (keepArtifacts) {
    return;
  }
  await fs.rm(path.join(repoRoot, "extension-mv3-chrome.zip"), { force: true });
  await fs.rm(extensionDir, { recursive: true, force: true });
  try {
    const entries = await fs.readdir(path.join(repoRoot, "dist"));
    if (entries.length === 0) {
      await fs.rm(path.join(repoRoot, "dist"), {
        recursive: true,
        force: true,
      });
    }
  } catch {
    // dist may not exist if the build failed before creating it.
  }
}

async function reservePort() {
  const server = http.createServer();
  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const { port } = server.address();
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function httpJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}`);
  }
  return response.json();
}

class CdpClient {
  constructor(ws) {
    this.ws = ws;
    this.nextId = 1;
    this.pending = new Map();
    this.events = [];
    ws.addEventListener("message", (event) => {
      const message = JSON.parse(event.data);
      if (message.id && this.pending.has(message.id)) {
        const { resolve, reject, timer } = this.pending.get(message.id);
        clearTimeout(timer);
        this.pending.delete(message.id);
        if (message.error) {
          reject(
            new Error(
              `${message.error.message}${
                message.error.data ? `: ${message.error.data}` : ""
              }`,
            ),
          );
        } else {
          resolve(message.result ?? {});
        }
        return;
      }
      if (message.method) {
        this.events.push(message);
      }
    });
  }

  static async connect(url) {
    const ws = new WebSocket(url);
    await new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error("WebSocket open timeout")),
        10000,
      );
      ws.addEventListener(
        "open",
        () => {
          clearTimeout(timer);
          resolve();
        },
        { once: true },
      );
      ws.addEventListener(
        "error",
        () => {
          clearTimeout(timer);
          reject(new Error("WebSocket connection failed"));
        },
        { once: true },
      );
    });
    return new CdpClient(ws);
  }

  send(method, params = {}, sessionId) {
    const id = this.nextId++;
    const payload = { id, method, params };
    if (sessionId) {
      payload.sessionId = sessionId;
    }
    const promise = new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (this.pending.has(id)) {
          this.pending.delete(id);
          reject(new Error(`${method} timed out`));
        }
      }, 15000);
      this.pending.set(id, { resolve, reject, timer });
    });
    this.ws.send(JSON.stringify(payload));
    return promise;
  }

  close() {
    this.ws.close();
  }
}

async function evaluate(cdp, sessionId, expression, options = {}) {
  const result = await cdp.send(
    "Runtime.evaluate",
    {
      expression,
      awaitPromise: options.awaitPromise ?? false,
      returnByValue: true,
    },
    sessionId,
  );
  if (result.exceptionDetails) {
    const description =
      result.exceptionDetails.exception?.description ??
      result.exceptionDetails.text;
    throw new Error(description);
  }
  return result.result?.value;
}

async function clickButton(cdp, sessionId, label) {
  const clicked = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const button = [...document.querySelectorAll("button")].find((item) =>
        item.innerText.trim().includes(${JSON.stringify(label)})
      );
      if (!button || button.disabled) return false;
      button.click();
      return true;
    })()`,
  );
  assert(clicked, `Could not click enabled button containing "${label}"`);
}

async function clickTab(cdp, sessionId, label) {
  const box = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const tab = [...document.querySelectorAll('[role="tab"]')].find((item) =>
        item.innerText.trim() === ${JSON.stringify(label)}
      );
      if (!tab || tab.disabled) return null;
      const rect = tab.getBoundingClientRect();
      return {
        x: rect.left + rect.width / 2,
        y: rect.top + rect.height / 2,
        width: rect.width,
        height: rect.height
      };
    })()`,
  );
  assert(box, `Could not find enabled tab "${label}"`);
  await cdp.send(
    "Input.dispatchMouseEvent",
    { type: "mouseMoved", x: box.x, y: box.y },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchMouseEvent",
    {
      type: "mousePressed",
      button: "left",
      buttons: 1,
      clickCount: 1,
      x: box.x,
      y: box.y,
    },
    sessionId,
  );
  await cdp.send(
    "Input.dispatchMouseEvent",
    {
      type: "mouseReleased",
      button: "left",
      buttons: 0,
      clickCount: 1,
      x: box.x,
      y: box.y,
    },
    sessionId,
  );
  await waitFor(
    `active tab "${label}"`,
    async () => {
      const active = await evaluate(
        cdp,
        sessionId,
        `(() => {
          const tab = [...document.querySelectorAll('[role="tab"]')].find((item) =>
            item.innerText.trim() === ${JSON.stringify(label)}
          );
          return tab?.getAttribute("aria-selected") === "true";
        })()`,
      );
      return active ? true : null;
    },
    { timeoutMs: 5000, intervalMs: 100 },
  );
}

async function waitForText(cdp, sessionId, label, text, options) {
  return waitFor(
    label,
    async () => {
      const bodyText = await evaluate(
        cdp,
        sessionId,
        "document.body.innerText",
      );
      return String(bodyText ?? "").includes(text) ? bodyText : null;
    },
    options,
  );
}

async function setInputValue(cdp, sessionId, selector, value) {
  const updated = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const input = document.querySelector(${JSON.stringify(selector)});
      if (!input) return false;
      const setter = Object.getOwnPropertyDescriptor(
        HTMLInputElement.prototype,
        "value"
      ).set;
      setter.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
      return input.value === ${JSON.stringify(value)};
    })()`,
  );
  assert(updated, `Could not set input ${selector}`);
}

async function selectOption(cdp, sessionId, selectIndex, textMatch) {
  const selected = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const select = document.querySelectorAll("select")[${selectIndex}];
      if (!select) return { ok: false, reason: "missing-select" };
      const option = [...select.options].find((item) =>
        item.textContent.includes(${JSON.stringify(textMatch)}) && item.value
      );
      if (!option) {
        return {
          ok: false,
          reason: "missing-option",
          options: [...select.options].map((item) => item.textContent)
        };
      }
      select.value = option.value;
      select.dispatchEvent(new Event("change", { bubbles: true }));
      return { ok: true, value: option.value, text: option.textContent };
    })()`,
  );
  assert(
    selected?.ok,
    `Could not select option containing "${textMatch}": ${JSON.stringify(
      selected,
    )}`,
  );
  return selected;
}

async function createTriggerServer(targetUrl) {
  const server = http.createServer((request, response) => {
    const url = new URL(request.url ?? "/", "http://127.0.0.1");
    response.setHeader("Cache-Control", "no-store");

    if (url.pathname !== "/") {
      response.writeHead(404);
      response.end("not found");
      return;
    }

    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end(`<!doctype html>
<html>
<head><meta charset="utf-8"><title>HLS E2E Real Stream Page</title></head>
<body>
  <h1>HLS E2E Real Stream Page</h1>
  <script>
    window.hlsFetchDone = false;
    window.hlsFetchStatus = null;
    window.hlsFetchError = null;
    setTimeout(() => {
      const xhr = new XMLHttpRequest();
      xhr.open("GET", ${JSON.stringify(targetUrl)}, true);
      xhr.onreadystatechange = () => {
        if (xhr.readyState === 4) {
          window.hlsFetchStatus = xhr.status + ":" + xhr.getResponseHeader("content-type");
          window.hlsFetchBody = xhr.responseText;
          window.hlsFetchDone = true;
        }
      };
      xhr.onerror = () => {
        window.hlsFetchError = "xhr error";
        window.hlsFetchDone = true;
      };
      xhr.send();
    }, 750);
  </script>
</body>
</html>`);
  });

  await new Promise((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  return server;
}

async function stopChild(child) {
  if (!child || child.exitCode !== null || child.signalCode !== null) {
    return;
  }
  child.kill("SIGTERM");
  await Promise.race([once(child, "exit"), delay(1500)]);
  if (child.exitCode === null && child.signalCode === null) {
    child.kill("SIGKILL");
    await Promise.race([once(child, "exit"), delay(1500)]);
  }
}

function sessionExceptions(cdp, sessionId) {
  return cdp.events.filter(
    (event) =>
      event.sessionId === sessionId &&
      event.method === "Runtime.exceptionThrown",
  );
}

function withQuery(url, value) {
  const parsed = new URL(url);
  parsed.searchParams.set("hls_downloader_e2e", value);
  return parsed.href;
}

async function waitForDownloadedFile(downloadDir) {
  return waitFor(
    "saved media download",
    async () => {
      const entries = await fs.readdir(downloadDir);
      const inProgress = entries.filter(
        (entry) => entry.endsWith(".crdownload") || entry.endsWith(".tmp"),
      );
      if (inProgress.length > 0) {
        return null;
      }
      for (const entry of entries) {
        const filePath = path.join(downloadDir, entry);
        const stats = await fs.stat(filePath);
        if (!stats.isFile() || stats.size <= 100_000) {
          continue;
        }
        const handle = await fs.open(filePath, "r");
        try {
          const header = Buffer.alloc(12);
          await handle.read(header, 0, header.length, 0);
          const isMatroska =
            header[0] === 0x1a &&
            header[1] === 0x45 &&
            header[2] === 0xdf &&
            header[3] === 0xa3;
          const isMp4 = header.subarray(4, 8).toString("ascii") === "ftyp";
          if (isMatroska || isMp4) {
            return {
              filePath,
              size: stats.size,
              container: isMatroska ? "matroska" : "mp4",
            };
          }
        } finally {
          await handle.close();
        }
      }
      return null;
    },
    { timeoutMs: 240000, intervalMs: 1000 },
  );
}

async function writeDownloadPreferences(userDataDir, downloadDir) {
  const defaultProfileDir = path.join(userDataDir, "Default");
  await fs.mkdir(defaultProfileDir, { recursive: true });
  await fs.writeFile(
    path.join(defaultProfileDir, "Preferences"),
    JSON.stringify({
      download: {
        default_directory: downloadDir,
        directory_upgrade: true,
        prompt_for_download: false,
      },
      safebrowsing: {
        enabled: true,
      },
    }),
  );
}

async function parsedPlaylistDetail(cdp, sessionId) {
  const value = await evaluate(
    cdp,
    sessionId,
    `(() => ({
      text: document.body.innerText,
      videoOptions: [...document.querySelectorAll("select option")].map(
        (option) => option.textContent
      ),
      selectCount: document.querySelectorAll("select").length
    }))()`,
  );
  const text = String(value?.text ?? "");
  const options = value?.videoOptions ?? [];
  if (
    text.includes("Estimated size") &&
    text.includes("Video") &&
    text.includes("Audio") &&
    text.includes("Subtitles") &&
    options.some((option) => String(option).includes("540")) &&
    options.some((option) => String(option).includes("ENGLISH")) &&
    options.some((option) => String(option).includes("Text"))
  ) {
    return value;
  }
  return null;
}

async function assertStartDownloadEnabled(cdp, sessionId) {
  const state = await evaluate(
    cdp,
    sessionId,
    `(() => {
      const button = [...document.querySelectorAll("button")].find((item) =>
        item.innerText.includes("Start download")
      );
      return button ? { exists: true, disabled: button.disabled } : { exists: false };
    })()`,
  );
  assert(state.exists, "Start download button was not rendered");
  assert(!state.disabled, "Start download button should be enabled");
  return true;
}

async function main() {
  const browserPath = getBravePath();
  console.log(`Using Brave: ${browserPath}`);
  console.log(`Using HLS stream: ${hlsUrl}`);
  runBuild();

  let browserProcess;
  let triggerServer;
  let cdp;
  let userDataDir;
  let downloadDir;
  const browserStderr = [];

  try {
    assert(
      existsSync(extensionDir),
      `Missing extension build at ${extensionDir}`,
    );
    const sniffUrl = withQuery(hlsUrl, "sniff");
    const directUrl = withQuery(hlsUrl, "direct");
    triggerServer = await createTriggerServer(sniffUrl);
    const triggerPort = triggerServer.address().port;
    const testUrl = `http://127.0.0.1:${triggerPort}/`;
    const debugPort = await reservePort();
    userDataDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "hls-downloader-e2e-profile-"),
    );
    downloadDir = await fs.mkdtemp(
      path.join(os.tmpdir(), "hls-downloader-e2e-downloads-"),
    );
    await writeDownloadPreferences(userDataDir, downloadDir);

    browserProcess = spawn(
      browserPath,
      [
        `--user-data-dir=${userDataDir}`,
        `--remote-debugging-port=${debugPort}`,
        `--load-extension=${extensionDir}`,
        "--enable-unsafe-extension-debugging",
        "--no-first-run",
        "--no-default-browser-check",
        "--disable-default-apps",
        "--disable-popup-blocking",
        "about:blank",
      ],
      { stdio: ["ignore", "ignore", "pipe"] },
    );
    browserProcess.stderr.setEncoding("utf8");
    browserProcess.stderr.on("data", (chunk) => browserStderr.push(chunk));

    const version = await waitFor(
      "browser remote debugging endpoint",
      () => httpJson(`http://127.0.0.1:${debugPort}/json/version`),
      { timeoutMs: 20000 },
    );
    cdp = await CdpClient.connect(version.webSocketDebuggerUrl);
    await cdp.send("Target.setDiscoverTargets", { discover: true });
    await cdp.send("Browser.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: downloadDir,
    });

    const extensionInfo = await waitFor(
      "extension background service worker",
      async () => {
        const { targetInfos } = await cdp.send("Target.getTargets");
        const target = targetInfos.find(
          (info) =>
            info.type === "service_worker" &&
            /^chrome-extension:\/\/[^/]+\/background\.js$/.test(info.url),
        );
        if (!target) {
          return null;
        }
        const id = target.url.match(/^chrome-extension:\/\/([^/]+)/)?.[1];
        return id ? { id, target } : null;
      },
      { timeoutMs: 20000 },
    );

    const backgroundSession = await cdp.send("Target.attachToTarget", {
      targetId: extensionInfo.target.targetId,
      flatten: true,
    });
    await cdp.send("Runtime.enable", {}, backgroundSession.sessionId);

    await waitFor(
      "background webRequest listener registration",
      async () => {
        const hasListener = await evaluate(
          cdp,
          backgroundSession.sessionId,
          "chrome.webRequest.onCompleted.hasListeners()",
        );
        return hasListener === true ? true : null;
      },
      { timeoutMs: 10000, intervalMs: 200 },
    );

    const pageTarget = await cdp.send("Target.createTarget", {
      url: "about:blank",
    });
    const pageSession = await cdp.send("Target.attachToTarget", {
      targetId: pageTarget.targetId,
      flatten: true,
    });
    await cdp.send("Page.enable", {}, pageSession.sessionId);
    await cdp.send("Runtime.enable", {}, pageSession.sessionId);
    await cdp.send("Page.navigate", { url: testUrl }, pageSession.sessionId);

    const pageFetchStatus = await waitFor("test page HLS XHR", async () => {
      const value = await evaluate(
        cdp,
        pageSession.sessionId,
        `({
          done: window.hlsFetchDone,
          status: window.hlsFetchStatus,
          error: window.hlsFetchError,
          body: window.hlsFetchBody
        })`,
      );
      if (!value?.done) {
        return null;
      }
      if (value.error) {
        throw new Error(value.error);
      }
      assert(
        String(value.status).startsWith("200:application/vnd.apple.mpegurl"),
        `Unexpected HLS XHR status ${value.status}`,
      );
      assert(
        String(value.body).includes("#EXTM3U"),
        "Fetched master playlist did not contain #EXTM3U",
      );
      assert(
        String(value.body).includes("TYPE=SUBTITLES"),
        "Fetched master playlist did not advertise subtitles",
      );
      return value.status;
    });

    const popupTarget = await cdp.send("Target.createTarget", {
      url: `chrome-extension://${extensionInfo.id}/popup.html`,
    });
    const popupSession = await cdp.send("Target.attachToTarget", {
      targetId: popupTarget.targetId,
      flatten: true,
    });
    await cdp.send("Page.enable", {}, popupSession.sessionId);
    await cdp.send("Runtime.enable", {}, popupSession.sessionId);

    const sniffedRow = await waitFor(
      "Sniffer popup row for the page-detected playlist",
      async () => {
        const value = await evaluate(
          cdp,
          popupSession.sessionId,
          `(() => ({
            text: document.body.innerText,
            rows: document.querySelectorAll("[data-playlist-row]").length
          }))()`,
        );
        if (
          value?.rows > 0 &&
          String(value.text).includes("HLS E2E Real Stream Page")
        ) {
          return value;
        }
        return null;
      },
      { timeoutMs: 30000, intervalMs: 250 },
    );

    await evaluate(
      cdp,
      popupSession.sessionId,
      `document
        .querySelector('[data-playlist-row] button[aria-label="Toggle playlist details"]')
        ?.click()`,
    );
    await waitForText(
      cdp,
      popupSession.sessionId,
      "expanded sniffed playlist URL",
      sniffUrl,
    );
    await clickButton(cdp, popupSession.sessionId, "Open");

    const sniffedDetail = await waitFor(
      "parsed sniffed playlist detail with subtitles",
      () => parsedPlaylistDetail(cdp, popupSession.sessionId),
      { timeoutMs: 20000, intervalMs: 250 },
    );
    await selectOption(cdp, popupSession.sessionId, 0, "540");
    await selectOption(cdp, popupSession.sessionId, 2, "Text");
    await waitFor(
      "Start download enabled for sniffed playlist",
      () => assertStartDownloadEnabled(cdp, popupSession.sessionId),
      { timeoutMs: 20000, intervalMs: 250 },
    );
    await clickButton(cdp, popupSession.sessionId, "Show");
    await waitFor(
      "HLS preview to become ready",
      async () => {
        const text = await evaluate(
          cdp,
          popupSession.sessionId,
          "document.body.innerText",
        );
        if (String(text).includes("Preview unavailable")) {
          throw new Error("Preview reported unavailable");
        }
        return String(text).includes("Preview ready") ? text : null;
      },
      { timeoutMs: 30000, intervalMs: 250 },
    );

    await clickButton(cdp, popupSession.sessionId, "Back");
    await waitForText(
      cdp,
      popupSession.sessionId,
      "Sniffer list after Back",
      "Sniffer",
    );
    await clickButton(cdp, popupSession.sessionId, "Clear all");
    await waitFor("sniffer list cleared", async () => {
      const rows = await evaluate(
        cdp,
        popupSession.sessionId,
        `document.querySelectorAll("[data-playlist-row]").length`,
      );
      return rows === 0 ? true : null;
    });

    await setInputValue(
      cdp,
      popupSession.sessionId,
      'input[placeholder="https://.../playlist.m3u8"]',
      directUrl,
    );
    await clickButton(cdp, popupSession.sessionId, "Add");
    const directDetail = await waitFor(
      "parsed direct playlist detail with subtitles",
      () => parsedPlaylistDetail(cdp, popupSession.sessionId),
      { timeoutMs: 20000, intervalMs: 250 },
    );
    await selectOption(cdp, popupSession.sessionId, 0, "540");
    await selectOption(cdp, popupSession.sessionId, 2, "Text");
    await waitFor(
      "Start download enabled for direct playlist",
      () => assertStartDownloadEnabled(cdp, popupSession.sessionId),
      { timeoutMs: 20000, intervalMs: 250 },
    );
    await clickButton(cdp, popupSession.sessionId, "Start download");
    await waitForText(
      cdp,
      popupSession.sessionId,
      "Downloads tab after starting download",
      "Downloads",
    );
    const downloadStatusText = await waitFor(
      "Download job completed",
      async () => {
        const text = await evaluate(
          cdp,
          popupSession.sessionId,
          "document.body.innerText",
        );
        if (String(text).includes("Completed")) {
          return "Completed";
        }
        if (String(text).includes("Done")) {
          return "Done";
        }
        return null;
      },
      { timeoutMs: 240000, intervalMs: 1000 },
    );
    const downloaded = await waitForDownloadedFile(downloadDir);

    await clickTab(cdp, popupSession.sessionId, "Settings");
    await waitForText(
      cdp,
      popupSession.sessionId,
      "Settings controls",
      "Fragment concurrency",
    );
    await clickTab(cdp, popupSession.sessionId, "About");
    await waitForText(cdp, popupSession.sessionId, "About tab", "Version");

    const exceptions = {
      background: sessionExceptions(cdp, backgroundSession.sessionId),
      popup: sessionExceptions(cdp, popupSession.sessionId),
      page: sessionExceptions(cdp, pageSession.sessionId),
    };
    assert(
      exceptions.background.length === 0,
      `Background runtime exceptions: ${exceptions.background.length}`,
    );
    assert(
      exceptions.popup.length === 0,
      `Popup runtime exceptions: ${exceptions.popup.length}`,
    );
    assert(
      exceptions.page.length === 0,
      `Page runtime exceptions: ${exceptions.page.length}`,
    );

    console.log(
      JSON.stringify(
        {
          ok: true,
          browser: version.Browser,
          extensionId: extensionInfo.id,
          hlsUrl,
          pageFetchStatus,
          sniffedRows: sniffedRow.rows,
          sniffedVideoOptions: sniffedDetail.videoOptions,
          directVideoOptions: directDetail.videoOptions,
          downloadStatusText,
          downloadedFile: downloaded.filePath,
          downloadDirectory: downloadDir,
          downloadedBytes: downloaded.size,
          downloadedContainer: downloaded.container,
          runtimeExceptions: {
            background: exceptions.background.length,
            popup: exceptions.popup.length,
            page: exceptions.page.length,
          },
        },
        null,
        2,
      ),
    );
  } catch (error) {
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: error instanceof Error ? error.message : String(error),
          browserStderr: browserStderr
            .join("")
            .split("\n")
            .filter(Boolean)
            .slice(-30)
            .join("\n"),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  } finally {
    try {
      cdp?.close();
    } catch {
      // Ignore close errors during cleanup.
    }
    await stopChild(browserProcess);
    if (triggerServer) {
      await new Promise((resolve) => triggerServer.close(resolve));
    }
    if (userDataDir) {
      await fs.rm(userDataDir, { recursive: true, force: true });
    }
    if (downloadDir && cleanDownload) {
      await fs.rm(downloadDir, { recursive: true, force: true });
    }
    await cleanupBuildArtifacts();
  }
}

await main();
