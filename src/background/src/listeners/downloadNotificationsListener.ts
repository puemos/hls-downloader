import { createStore } from "@hls-downloader/core/lib/store/configure-store";
import { notifications, runtime } from "webextension-polyfill";

function formatDetails(job: {
  width?: number;
  height?: number;
  bitrate?: number;
}) {
  const parts = [];
  if (job.width && job.height) {
    parts.push(`${job.width}x${job.height}`);
  }
  if (job.bitrate) {
    parts.push(`${(job.bitrate / 1024 / 1024).toFixed(1)} mbps`);
  }
  return parts.length ? ` (${parts.join(" · ")})` : "";
}

export function downloadNotificationsListener(
  store: ReturnType<typeof createStore>
) {
  const iconUrl = runtime.getURL("assets/icons/128.png");
  const previousStatus: Record<string, string | null> = {};

  Object.entries(store.getState().jobs.jobsStatus).forEach(
    ([jobId, status]) => {
      previousStatus[jobId] = status?.status ?? null;
    }
  );

  store.subscribe(() => {
    const state = store.getState();
    const jobs = state.jobs.jobs;
    const statuses = state.jobs.jobsStatus;

    Object.entries(statuses).forEach(([jobId, status]) => {
      const current = status?.status ?? null;
      const prev = previousStatus[jobId] ?? null;
      if (!current || current === prev) {
        return;
      }

      const job = jobs[jobId];
      if (!job) {
        previousStatus[jobId] = current;
        return;
      }

      if (current === "downloading") {
        void notifications
          ?.create(`job-${jobId}`, {
            type: "basic",
            iconUrl,
            title: "Download started",
            message: `${job.filename}${formatDetails(job)}`,
          })
          .catch(() => {});
      }

      if (current === "done") {
        void notifications
          ?.create(`job-${jobId}`, {
            type: "basic",
            iconUrl,
            title: "Download finished",
            message: `${job.filename}${formatDetails(job)}`,
          })
          .catch(() => {});
      }

      previousStatus[jobId] = current;
    });

    Object.keys(previousStatus).forEach((jobId) => {
      if (!statuses[jobId]) {
        delete previousStatus[jobId];
      }
    });
  });
}
