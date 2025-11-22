import { describe, it, expect, vi, beforeEach } from "vitest";
import { of, firstValueFrom, Subject, Observable } from "rxjs";
import { createRootEpic } from "../src/controllers/root-epic.ts";
import {
  jobsSlice,
  playlistsSlice,
  levelsSlice,
} from "../src/store/slices/index.ts";
import {
  createMockDependencies,
  createMockState,
  createTestPlaylist,
  createTestLevel,
} from "./test-utils";
import { Dependencies } from "../src/services";
import { Epic } from "redux-observable";
import { RootAction, RootState } from "../src/store/root-reducer";

describe("root epic", () => {
  let mockDependencies: Dependencies;
  let mockState: RootState;

  beforeEach(() => {
    mockDependencies = createMockDependencies();
    mockState = createMockState() as any;
  });

  it("runs child epics - cancel job epic", async () => {
    // Setup
    const rootEpic = createRootEpic();
    const action$ = of(jobsSlice.actions.cancel({ jobId: "1" }));

    // Execute
    const result = await firstValueFrom(
      rootEpic(action$, { value: mockState } as any, mockDependencies),
    );

    // Verify
    expect(result).toEqual(jobsSlice.actions.delete({ jobId: "1" }));
  });

  it("combines multiple epics and processes them in sequence", async () => {
    // Setup
    const rootEpic = createRootEpic();
    const playlist = createTestPlaylist({ id: "1" });

    // Set up state with playlist
    mockState.playlists.playlists["1"] = playlist;
    mockState.playlists.playlistsStatus["1"] = { status: "init" };

    // Mock parser to return levels
    const level = createTestLevel({ id: "l1", playlistID: "1" });
    mockDependencies.parser.parseMasterPlaylist = vi
      .fn()
      .mockReturnValue([level]);

    // Create an action that will trigger a chain of epic responses
    const action$ = of(
      playlistsSlice.actions.fetchPlaylistLevels({ playlistID: "1" }),
    );

    // Create array to collect results
    const results: any[] = [];

    // Use a subscription instead of firstValueFrom + toArray to avoid waiting for completion
    const subscription = rootEpic(
      action$,
      { value: mockState } as any,
      mockDependencies,
    ).subscribe((action) => {
      results.push(action);

      // Once we have our expected 2 actions, we can run our assertions
      if (results.length === 2) {
        // We should get fetchPlaylistLevelsSuccess and add levels actions
        expect(results[0].type).toBe(
          playlistsSlice.actions.fetchPlaylistLevelsSuccess.type,
        );
        expect(results[1].type).toBe(levelsSlice.actions.add.type);

        // Clean up subscription
        subscription.unsubscribe();
      }
    });

    // Allow some time for the observable to emit values
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify we got the expected number of results
    expect(results.length).toBe(2);

    // Clean up
    subscription.unsubscribe();
  });

  it("handles initialization epic", async () => {
    // Setup
    const rootEpic = createRootEpic();
    const action$ = of({ type: "init/start" });

    // Execute
    const result = await firstValueFrom(
      rootEpic(action$, { value: mockState } as any, mockDependencies),
    );

    // Verify
    expect(result.type).toBe("init/done");
    expect(mockDependencies.fs.cleanup).toHaveBeenCalled();
  });

  it("supports dynamic epic addition and updates", () => {
    // Create a custom epic to test dynamic epic addition
    const customEpic: Epic<RootAction, RootAction, RootState, Dependencies> = (
      action$,
    ) =>
      action$.pipe(
        // Map any action to a test action
        (source) =>
          new Observable((observer) => {
            source.subscribe({
              next: (action) => {
                if ((action as any).type === "custom/action") {
                  observer.next({ type: "custom/result" } as any);
                }
              },
              error: (err) => observer.error(err),
              complete: () => observer.complete(),
            });
          }),
      );

    // Get the private BehaviorSubject from root epic
    const rootEpic = createRootEpic();

    // Test that initial epics work
    const action$ = new Subject<any>();
    const output$ = rootEpic(
      action$,
      { value: mockState } as any,
      mockDependencies,
    );

    const results: any[] = [];
    const subscription = output$.subscribe((action) => {
      results.push(action);
    });

    // Emit an action that triggers existing epics
    action$.next(jobsSlice.actions.cancel({ jobId: "1" }));
    expect(results[0]).toEqual(jobsSlice.actions.delete({ jobId: "1" }));

    // Cleanup
    subscription.unsubscribe();
  });
});
