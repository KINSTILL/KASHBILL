import { defineConfig } from 'vitest/config';
import path from 'node:path';

export default defineConfig({
  oxc: {
    jsx: {
      runtime: 'automatic',
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/**/*.test.ts'],
    // Certains tests DB utilisent Prisma → timeout plus long
    testTimeout: 15000,
    hookTimeout: 15000,
    // Évite les conflits de cache entre fichiers
    fileParallelism: false,
    maxWorkers: 1,
    pool: 'forks',
    // @ts-expect-error compatibilité descendante
    forks: {
      singleFork: true,
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['lib/**/*.ts'],
      exclude: [
        'lib/hooks/**',
        'lib/storage/**',
        'lib/device/**',
        'lib/share/storage.ts',
      ],
      thresholds: {
        'lib/auth/**': {
          lines: 60,
          functions: 60,
          branches: 60,
          statements: 60,
        },
      },
    },
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './') },
  },
});
