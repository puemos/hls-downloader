import { Bucket, IFS } from "@hls-downloader/core/lib/services";
import { downloads } from "webextension-polyfill";
import filenamify from "filenamify";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";

const buckets: Record<string, Bucket> = {};

export class InMemoryBucket implements Bucket {
  private videoStore: Record<number, Blob> = {};
  private audioStore: Record<number, Blob> = {};
  constructor(readonly videoLength: number, readonly audioLength: number) {}
  write(index: number, data: Uint8Array): Promise<void> {
    if (index < this.videoLength) {
      this.videoStore[index] = new Blob([new Uint8Array(data)]);
    } else {
      this.audioStore[index - this.videoLength] = new Blob([new Uint8Array(data)]);
    }
    return Promise.resolve();
  }
  async getLink(): Promise<string> {
    const baseURL = "/assets/ffmpeg";
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
      coreURL: `${baseURL}/ffmpeg-core.js`,
      wasmURL: `${baseURL}/ffmpeg-core.wasm`,
    });

    if (this.videoLength > 0) {
      const videoBlob = new Blob(Object.values(this.videoStore), {
        type: "video/mp2t",
      });
      const vfile = await fetchFile(videoBlob);
      await ffmpeg.writeFile("video.ts", vfile);
    }

    if (this.audioLength > 0) {
      const audioBlob = new Blob(Object.values(this.audioStore), {
        type: "video/mp2t",
      });
      const afile = await fetchFile(audioBlob);
      await ffmpeg.writeFile("audio.ts", afile);
    }

    if (this.videoLength > 0 && this.audioLength > 0) {
      await ffmpeg.exec([
        "-i",
        "video.ts",
        "-i",
        "audio.ts",
        "-c:v",
        "copy",
        "-c:a",
        "copy",
        "-bsf:a",
        "aac_adtstoasc",
        "-movflags",
<<<<<<< ours
        "+faststart",
||||||| base
=======
        "faststart",
>>>>>>> theirs
        "file.mp4",
      ]);
      await ffmpeg.deleteFile("video.ts");
      await ffmpeg.deleteFile("audio.ts");
    } else if (this.videoLength > 0) {
      await ffmpeg.exec([
        "-i",
        "video.ts",
        "-c:v",
        "copy",
<<<<<<< ours
        "-c:a",
        "copy",
        "-bsf:a",
        "aac_adtstoasc",
        "-movflags",
        "+faststart",
||||||| base
        "-c:a",
        "copy",
=======
        "-movflags",
        "faststart",
>>>>>>> theirs
        "file.mp4",
      ]);
      await ffmpeg.deleteFile("video.ts");
    } else {
      await ffmpeg.exec([
        "-i",
        "audio.ts",
        "-c:a",
        "copy",
        "-bsf:a",
        "aac_adtstoasc",
        "-movflags",
<<<<<<< ours
        "+faststart",
||||||| base
=======
        "faststart",
>>>>>>> theirs
        "file.mp4",
      ]);
      await ffmpeg.deleteFile("audio.ts");
    }

    const data = await ffmpeg.readFile("file.mp4");
    const mp4Blob = new Blob([data], { type: "video/mp4" });
    return URL.createObjectURL(mp4Blob);
  }
}

const createBucket: IFS["createBucket"] = function (
  id: string,
  videoLength: number,
  audioLength: number,
) {
  buckets[id] = new InMemoryBucket(videoLength, audioLength);
  return Promise.resolve();
};

const deleteBucket: IFS["deleteBucket"] = function (id: string) {
  delete buckets[id];
  return Promise.resolve();
};

const getBucket: IFS["getBucket"] = function (id: string) {
  return Promise.resolve(buckets[id]);
};

const saveAs: IFS["saveAs"] = async function (
  path: string,
  link: string,
  { dialog },
) {
  window.URL = window.URL || window.webkitURL;
  const filename = filenamify(path ?? "steam.mp4");

  await downloads.download({
    url: link,
    saveAs: dialog,
    conflictAction: "uniquify",
    filename,
  });
  URL.revokeObjectURL(link);
  return Promise.resolve();
};

export const InMemoryFS: IFS = {
  getBucket,
  createBucket,
  deleteBucket,
  saveAs,
  cleanup: () => Promise.resolve(),
};
