import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Math.random for deterministic tests when needed
export const mockMathRandom = (value: number) => {
  const originalRandom = Math.random;
  Math.random = () => value;
  return () => {
    Math.random = originalRandom;
  };
};

// Helper to advance time in tests
export const advanceTime = (ms: number) => {
  vi.advanceTimersByTime(ms);
};