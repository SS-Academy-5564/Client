/// <reference types="vitest" />                                                                                                          
import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@core': path.resolve(__dirname, './src/app/core'),
      '@shared': path.resolve(__dirname, './src/app/shared'),
      '@features': path.resolve(__dirname, './src/app/features'),
      '@environments': path.resolve(__dirname, './src/environments'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['src/**/*.spec.ts', 'src/**/*.test.ts'],
    setupFiles: './src/test-setup.ts',
    coverage: {
      reporter: ['text', 'json', 'html'],
    },
  },
});                