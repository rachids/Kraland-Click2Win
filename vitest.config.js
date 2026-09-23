import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // The logic layer is DOM-free by design, so tests run in plain Node.
    environment: 'node',
    include: ['tests/**/*.test.js'],
  },
});
