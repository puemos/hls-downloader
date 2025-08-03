import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    deps: {
      optimizer: {
        ssr: {
          enabled: false
        }
      }
    }
  },
});
