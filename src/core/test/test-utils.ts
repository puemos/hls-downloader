/**
 * Test utilities for the HLS Downloader core module
 */
import { vi } from 'vitest';
import { of } from 'rxjs';
import type { ILoader, IDecryptor, IParser, IFS, Bucket, Dependencies } from '../src/services';
import { Level, Fragment, Key, Playlist, Job, JobStatus } from '../src/entities';

/**
 * Create mock loader with configurable responses
 */
export function createMockLoader(options: {
  textResponse?: string;
  bufferResponse?: ArrayBuffer;
  shouldFail?: boolean;
} = {}): ILoader {
  const {
    textResponse = '',
    bufferResponse = new ArrayBuffer(0),
    shouldFail = false
  } = options;

  return {
    fetchText: vi.fn().mockImplementation((url: string, attempts?: number) => {
      if (shouldFail) {
        return Promise.reject(new Error('Fetch text failed'));
      }
      return Promise.resolve(textResponse);
    }),
    fetchArrayBuffer: vi.fn().mockImplementation((url: string, attempts?: number) => {
      if (shouldFail) {
        return Promise.reject(new Error('Fetch buffer failed'));
      }
      return Promise.resolve(bufferResponse);
    })
  };
}

/**
 * Create mock decryptor
 */
export function createMockDecryptor(): IDecryptor {
  return {
    decrypt: vi.fn().mockImplementation(
      (data: ArrayBuffer, keyData: ArrayBuffer, iv: Uint8Array) => {
        return Promise.resolve(new ArrayBuffer(data.byteLength));
      }
    )
  };
}

/**
 * Create mock parser with configurable responses
 */
export function createMockParser(options: {
  levels?: Level[];
  fragments?: Fragment[];
} = {}): IParser {
  const { levels = [], fragments = [] } = options;

  return {
    parseMasterPlaylist: vi.fn().mockReturnValue(levels),
    parseLevelPlaylist: vi.fn().mockReturnValue(fragments)
  };
}

/**
 * Create mock bucket
 */
export function createMockBucket(options: {
  link?: string;
} = {}): Bucket {
  const { link = 'mock-link' } = options;

  return {
    write: vi.fn().mockResolvedValue(undefined),
    getLink: vi.fn().mockImplementation((onProgress?: (progress: number, message: string) => void) => {
      if (onProgress) {
        onProgress(0, 'Starting');
        onProgress(50, 'Halfway');
        onProgress(100, 'Complete');
      }
      return Promise.resolve(link);
    })
  };
}

/**
 * Create mock filesystem
 */
export function createMockFS(options: {
  bucket?: Bucket;
} = {}): IFS {
  const { bucket = createMockBucket() } = options;

  return {
    cleanup: vi.fn().mockResolvedValue(undefined),
    getBucket: vi.fn().mockResolvedValue(bucket),
    createBucket: vi.fn().mockResolvedValue(undefined),
    deleteBucket: vi.fn().mockResolvedValue(undefined),
    saveAs: vi.fn().mockResolvedValue(undefined)
  };
}

/**
 * Create all dependencies with mocks
 */
export function createMockDependencies(options: {
  loader?: ILoader;
  decryptor?: IDecryptor;
  parser?: IParser;
  fs?: IFS;
} = {}): Dependencies {
  const {
    loader = createMockLoader(),
    decryptor = createMockDecryptor(),
    parser = createMockParser(),
    fs = createMockFS()
  } = options;

  return {
    loader,
    decryptor,
    parser,
    fs
  };
}

/**
 * Create a test fragment
 */
export function createTestFragment(options: {
  index?: number;
  uri?: string;
  keyUri?: string | null;
  keyIv?: Uint8Array | null;
} = {}): Fragment {
  const {
    index = 0,
    uri = `fragment-${index}.ts`,
    keyUri = null,
    keyIv = null
  } = options;

  const key = new Key(keyUri, keyIv);
  return new Fragment(key, uri, index);
}

/**
 * Create a test level
 */
export function createTestLevel(options: {
  id?: string;
  playlistID?: string;
  uri?: string;
  type?: 'stream' | 'audio';
  width?: number;
  height?: number;
  bitrate?: number;
  fps?: number;
} = {}): Level {
  const {
    id = `level-${Math.random().toString(36).substring(2, 9)}`,
    playlistID = 'playlist-1',
    uri = `http://example.com/level/${id}.m3u8`,
    type = 'stream',
    width = 1920,
    height = 1080,
    bitrate = 5000,
    fps = 30
  } = options;

  return new Level(type, id, playlistID, uri, width, height, bitrate, fps);
}

/**
 * Create a test playlist
 */
export function createTestPlaylist(options: {
  id?: string;
  uri?: string;
  pageTitle?: string;
  initiator?: string;
  tabId?: number;
} = {}): Playlist {
  const {
    id = `playlist-${Math.random().toString(36).substring(2, 9)}`,
    uri = `http://example.com/playlist/${id}.m3u8`,
    pageTitle = 'Test Page',
    initiator = 'test',
    tabId = 1
  } = options;

  return new Playlist(id, uri, Date.now(), pageTitle, initiator, tabId);
}

/**
 * Create a test job
 */
export function createTestJob(options: {
  id?: string;
  videoFragments?: Fragment[];
  audioFragments?: Fragment[];
  filename?: string;
  width?: number;
  height?: number;
  bitrate?: number;
  link?: string;
} = {}): Job {
  const {
    id = `job-${Math.random().toString(36).substring(2, 9)}`,
    videoFragments = [createTestFragment({ index: 0 }), createTestFragment({ index: 1 })],
    audioFragments = [],
    filename = 'test-video.mp4',
    width = 1920,
    height = 1080,
    bitrate = 5000,
    link
  } = options;

  return new Job(
    id,
    videoFragments,
    audioFragments,
    filename,
    Date.now(),
    width,
    height,
    bitrate,
    link
  );
}

/**
 * Create a test job status
 */
export function createTestJobStatus(options: {
  status?: 'downloading' | 'done' | 'ready' | 'init' | 'saving';
  total?: number;
  done?: number;
  saveProgress?: number;
  saveMessage?: string;
} = {}): JobStatus {
  const {
    status = 'downloading',
    total = 10,
    done = 0,
    saveProgress,
    saveMessage
  } = options;

  return {
    status,
    total,
    done,
    saveProgress,
    saveMessage
  };
}

/**
 * Create a mock redux state
 */
export function createMockState(options: {
  playlists?: Record<string, Playlist | null>;
  playlistsStatus?: Record<string, any>;
  levels?: Record<string, Level | null>;
  jobs?: Record<string, Job | null>;
  jobsStatus?: Record<string, JobStatus | null>;
  concurrency?: number;
  fetchAttempts?: number;
  saveDialog?: boolean;
  tabId?: number;
} = {}): any {
  const {
    playlists = {},
    playlistsStatus = {},
    levels = {},
    jobs = {},
    jobsStatus = {},
    concurrency = 2,
    fetchAttempts = 5,
    saveDialog = false,
    tabId = 1
  } = options;

  return {
    playlists: {
      playlists,
      playlistsStatus
    },
    levels: {
      levels
    },
    jobs: {
      jobs,
      jobsStatus
    },
    config: {
      concurrency,
      fetchAttempts,
      saveDialog
    },
    tabs: {
      current: {
        id: tabId
      }
    }
  };
}

/**
 * Helper to create RxJS observable from objects
 */
export function toObservable<T>(items: T | T[]): typeof of {
  return Array.isArray(items) ? of(...items) : of(items);
}
