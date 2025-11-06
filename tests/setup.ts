import { vi, beforeEach } from "vitest";
import type { ILogger } from "../src/core/logging/ILogger";

export const initializeMock = vi.fn().mockResolvedValue(undefined);
export const destroyMock = vi.fn();

const loggerMock: ILogger = {
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn(),
};

declare global {
  var mockLogger: ILogger;
}

globalThis.mockLogger = loggerMock;

vi.mock("../src/engine/phaser/PhaserEngine", () => {
  return {
    PhaserEngine: class {
      initialize = initializeMock;
      destroy = destroyMock;
    },
  };
});

beforeEach(() => {
  vi.clearAllMocks();
});