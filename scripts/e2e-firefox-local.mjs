#!/usr/bin/env node
import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import http from "node:http";
import os from "node:os";
import path from "node:path";

const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const elementKey = "element-6066-11e4-a52e-4f735466cecf";

async function waitFor(label, action, timeout = 30_000) {
  const end = Date.now() + timeout;
  while (Date.now() < end) {
    const result = await action();
    if (result) return result;
    await pause(200);
  }
  throw new Error(`Timed out waiting for ${label}`);
}

async function reservePort() {
  const server = http.createServer();
  await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
  const port = server.address().port;
  await new Promise((resolve) => server.close(resolve));
  return port;
}

async function main() {
  assert(process.env.E2E_GECKODRIVER, "E2E_GECKODRIVER is required");
  assert(process.env.E2E_EXTENSION_XPI, "E2E_EXTENSION_XPI is required");
  assert(process.env.E2E_HLS_URL, "E2E_HLS_URL is required");
  const downloadDirectory = await fs.mkdtemp(
    path.join(os.tmpdir(), "hls-firefox-downloads-"),
  );
  const port = await reservePort();
  const driver = spawn(
    process.env.E2E_GECKODRIVER,
    // Firefox 153+ requires this opt-in to navigate to extension pages.
    ["--host", "127.0.0.1", "--port", String(port), "--allow-system-access"],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  let driverOutput = "";
  driver.stdout.on("data", (bytes) => {
    driverOutput += bytes;
  });
  driver.stderr.on("data", (bytes) => {
    driverOutput += bytes;
  });
  let session;
  let browserPid;
  const base = `http://127.0.0.1:${port}`;
  async function request(method, route, data) {
    const response = await fetch(base + route, {
      method,
      headers: { "Content-Type": "application/json" },
      body: data === undefined ? undefined : JSON.stringify(data),
      signal: AbortSignal.timeout(30_000),
    });
    const { value } = await response.json();
    if (!response.ok || value?.error)
      throw new Error(value?.message ?? `WebDriver ${response.status}`);
    return value;
  }
  const command = (method, route, data) =>
    request(method, `/session/${session}${route}`, data);
  const evaluate = (script, args = []) =>
    command("POST", "/execute/sync", { script, args });
  async function clickText(text) {
    const element = await evaluate(
      "return [...document.querySelectorAll('button')].find(button => button.innerText.trim().includes(arguments[0]) && !button.disabled)",
      [text],
    );
    assert(element, `No enabled button containing ${text}`);
    await waitFor(`unobscured ${text} button`, async () => {
      try {
        await command("POST", `/element/${element[elementKey]}/click`, {});
        return true;
      } catch (error) {
        // Let the add-URL sheet finish its exit animation before a real click.
        if (error.message.includes("obscures it")) return false;
        throw error;
      }
    });
  }
  async function screenshot() {
    if (session && process.env.E2E_SCREENSHOT_PATH) {
      const image = await command("GET", "/screenshot");
      await fs.writeFile(
        process.env.E2E_SCREENSHOT_PATH,
        Buffer.from(image, "base64"),
      );
    }
  }
  try {
    await waitFor("geckodriver", async () => {
      try {
        return (await request("GET", "/status")).ready;
      } catch {
        return false;
      }
    });
    const uuid = randomUUID();
    const geckoId = "{e3ec0551-9bfa-4233-b9dd-6b36f6a80962}";
    const created = await request("POST", "/session", {
      capabilities: {
        alwaysMatch: {
          browserName: "firefox",
          "moz:firefoxOptions": {
            binary:
              process.env.E2E_FIREFOX ??
              "/Applications/Firefox.app/Contents/MacOS/firefox",
            args: ["-headless"],
            prefs: {
              "extensions.webextensions.uuids": JSON.stringify({
                [geckoId]: uuid,
              }),
              "browser.download.folderList": 2,
              "browser.download.dir": downloadDirectory,
              "browser.download.useDownloadDir": true,
              "browser.download.always_ask_before_handling_new_types": false,
              "browser.helperApps.neverAsk.saveToDisk":
                "video/mp4,video/x-matroska,application/octet-stream,text/plain",
            },
          },
        },
      },
    });
    session = created.sessionId;
    browserPid = created.capabilities["moz:processID"];
    await command("POST", "/window/rect", { width: 1280, height: 1000 });
    await command("POST", "/moz/addon/install", {
      path: process.env.E2E_EXTENSION_XPI,
      temporary: true,
    });
    await command("POST", "/url", {
      url: `moz-extension://${uuid}/popup.html`,
    });
    await waitFor("extension Capture view", async () =>
      (await evaluate("return document.body.innerText")).includes("Capture"),
    );
    if (process.env.E2E_OUTPUT_CONTAINER) {
      for (const label of ["Settings", "Capture"]) {
        const tab = await evaluate(
          "return [...document.querySelectorAll('[role=tab]')].find(tab => tab.innerText.trim() === arguments[0])",
          [label],
        );
        assert(tab, `Missing ${label} tab`);
        await command("POST", `/element/${tab[elementKey]}/click`, {});
        if (label === "Settings") {
          await waitFor("output format setting", async () =>
            (await evaluate("return document.body.innerText")).includes(
              "Output format",
            ),
          );
          await evaluate(
            "const select = document.querySelector('select'); select.value = arguments[0]; select.dispatchEvent(new Event('change', {bubbles:true}));",
            [process.env.E2E_OUTPUT_CONTAINER],
          );
        }
      }
    }
    await clickText("Add URL");
    const input = await command("POST", "/element", {
      using: "css selector",
      value: 'input[placeholder="https://example.com/stream.m3u8"]',
    });
    await command("POST", `/element/${input[elementKey]}/value`, {
      text: process.env.E2E_HLS_URL,
    });
    const add = await command("POST", "/element", {
      using: "css selector",
      value: 'button[aria-label="Add playlist"]',
    });
    await command("POST", `/element/${add[elementKey]}/click`, {});
    await waitFor("parsed video, audio, and subtitles", async () => {
      const options = await evaluate(
        "return [...document.querySelectorAll('select option')].map(option => option.textContent)",
      );
      return process.env.E2E_PRIMARY_AUDIO === "1"
        ? options.some((text) => text.includes("0.1 mbps"))
        : options.some((text) => text.includes("540")) &&
            options.some((text) => text.includes("ENGLISH")) &&
            options.some((text) => text.includes("Text"));
    });
    if (process.env.E2E_SELECT_SUBTITLES !== "0")
      await evaluate(`const select = document.querySelectorAll('select')[2];
      const option = [...select.options].find(option => option.textContent.includes('Text') && option.value);
      select.value = option.value;
      select.dispatchEvent(new Event('change', { bubbles: true }));`);
    await waitFor("enabled Start download", () =>
      evaluate(
        "return [...document.querySelectorAll('button')].some(button => button.innerText.includes('Start download') && !button.disabled)",
      ),
    );
    await clickText("Start download");
    await waitFor(
      "download completion",
      async () => {
        const text = await evaluate("return document.body.innerText");
        if (/\bError\b/.test(text)) {
          const details = await evaluate(
            "return document.querySelector('button[aria-label^=\"Open details for \"]')",
          );
          if (details)
            await command("POST", `/element/${details[elementKey]}/click`, {});
          await pause(150);
          throw new Error(
            `Download failed: ${await evaluate("return document.body.innerText")}`,
          );
        }
        return /\b(Completed|Done)\b/.test(text);
      },
      120_000,
    );
    const downloaded = await waitFor("saved media file", async () => {
      for (const entry of await fs.readdir(downloadDirectory)) {
        if (entry.endsWith(".part")) continue;
        const file = path.join(downloadDirectory, entry);
        const bytes = await fs.readFile(file);
        if (bytes.length < 12) continue;
        const matroska = bytes
          .subarray(0, 4)
          .equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]));
        const mp4 = bytes.subarray(4, 8).toString("ascii") === "ftyp";
        if (matroska || mp4)
          return {
            file,
            bytes: bytes.length,
            container: matroska ? "matroska" : "mp4",
          };
      }
      return null;
    });
    await screenshot();
    const browserDownload = await command("POST", "/execute/async", {
      script:
        "const done = arguments[arguments.length-1]; browser.downloads.search({}).then(items => done(items.filter(item => item.state === 'complete').map(({filename, mime, fileSize, state}) => ({filename, mime, fileSize, state})).at(-1)), error => done({error: error.message}));",
      args: [],
    });
    console.log(
      JSON.stringify(
        {
          ok: true,
          browser: `Firefox/${created.capabilities.browserVersion}`,
          hlsUrl: process.env.E2E_HLS_URL,
          downloadedFile: downloaded.file,
          downloadedBytes: downloaded.bytes,
          downloadedContainer: downloaded.container,
          downloadDirectory,
          browserDownload,
        },
        null,
        2,
      ),
    );
  } catch (error) {
    await screenshot().catch(() => {});
    console.error(
      JSON.stringify(
        {
          ok: false,
          error: error.message,
          downloadDirectory,
          driverOutput: driverOutput.slice(-4000),
        },
        null,
        2,
      ),
    );
    process.exitCode = 1;
  } finally {
    if (session) await command("DELETE", "").catch(() => {});
    driver.kill("SIGTERM");
    if (browserPid) {
      try {
        process.kill(browserPid, "SIGTERM");
      } catch {
        /* Session already stopped it. */
      }
    }
  }
}

await main();
