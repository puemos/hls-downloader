# HLS Downloader Core Testing Documentation

This document outlines the testing approach, tools, and best practices for the HLS Downloader core module.

## Testing Strategy

The HLS Downloader core module follows a comprehensive testing strategy:

- **Unit Testing**: Testing individual components in isolation (slices, use cases, utilities)
- **Integration Testing**: Testing interactions between components (epics, store configurations)
- **Mocking**: Using mock implementations for external dependencies (filesystem, network, etc.)

## Test Organization

Tests are organized in the `test/` directory with a structure mirroring the source code:

- `test/*.test.ts`: Test files for each corresponding module
- `test/test-utils.ts`: Shared testing utilities and mock factories

## Tools Used

- **Vitest**: Fast testing framework with native TypeScript support
- **C8**: Code coverage reporting tool
- **RxJS Testing Utilities**: For testing Observables and redux-observable epics

## Running Tests

### Basic Test Run

```bash
pnpm test
```

### With Coverage Report

```bash
pnpm test:coverage
```

Coverage reports are generated in the `coverage/` directory and include HTML, JSON, and console output formats.

## Testing Utilities

The `test-utils.ts` file provides a set of utility functions to make testing easier:

- **Mock Factories**:

  - `createMockLoader()`: Creates a mock loader for network operations
  - `createMockParser()`: Creates a mock parser for HLS manifest parsing
  - `createMockFS()`: Creates a mock filesystem
  - `createMockDecryptor()`: Creates a mock decryptor
  - `createMockDependencies()`: Creates all dependencies with mocks

- **Test Data Factories**:

  - `createTestFragment()`: Creates a test Fragment instance
  - `createTestLevel()`: Creates a test Level instance
  - `createTestPlaylist()`: Creates a test Playlist instance
  - `createTestJob()`: Creates a test Job instance
  - `createTestJobStatus()`: Creates a test JobStatus object
  - `createMockState()`: Creates a mock Redux state

- **Observable Utilities**:
  - `toObservable()`: Helper to create RxJS observable from objects

## Testing Redux Slices

Redux slices are tested by verifying:

1. Initial state is correctly set
2. Each reducer properly handles its actions
3. Edge cases and error scenarios

Example:

```typescript
it("should add a job to the state", () => {
  const job = createTestJob({ id: "job1" });
  const initialState = { jobs: {}, jobsStatus: {} };

  const nextState = jobsSlice.reducer(
    initialState,
    jobsSlice.actions.add({ job })
  );

  expect(nextState.jobs["job1"]).toEqual(job);
  expect(nextState.jobsStatus["job1"]?.status).toBe("downloading");
});
```

## Testing Epics

Redux-Observable epics are tested by:

1. Creating a mock action stream
2. Providing mock dependencies and state
3. Observing the output action stream
4. Verifying the correct actions are emitted

Example:

```typescript
it("creates a download job for video and audio levels", async () => {
  // Setup
  const action$ = toObservable(
    levelsSlice.actions.download({ levelID: "v", audioLevelID: "a" })
  );
  const deps = { loader: mockLoader, parser: mockParser };

  // Execute
  const result = await firstValueFrom(
    addDownloadJobEpic(action$, { value: mockState } as any, deps as any)
  );

  // Verify
  expect(result.type).toBe(jobsSlice.actions.add.type);
  expect(result.payload.job).toMatchObject({
    videoFragments: [videoFragment],
    audioFragments: [audioFragment],
  });
});
```

## Testing Use Cases

Use cases are tested by:

1. Creating mock implementations of dependencies
2. Running the use case with test inputs
3. Verifying the output matches expectations
4. Checking that dependencies were called correctly

## Coverage Goals

The project aims for the following code coverage targets:

- Statements: 80%
- Branches: 70%
- Functions: 80%
- Lines: 80%
