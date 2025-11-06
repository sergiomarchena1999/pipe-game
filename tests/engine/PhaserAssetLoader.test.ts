import { describe, it, expect, vi, beforeEach } from "vitest";
import { PhaserAssetLoader } from "../../src/engine/phaser/PhaserAssetLoader";
import type { IPhaserScene } from "../../src/engine/phaser/IPhaserScene";

describe("PhaserAssetLoader", () => {
  let mockScene: IPhaserScene;
  let loader: PhaserAssetLoader;

  beforeEach(() => {
    vi.clearAllMocks();

    mockScene = {
      textures: { exists: vi.fn().mockReturnValue(false) },
      load: { image: vi.fn(), start: vi.fn(), on: vi.fn(), once: vi.fn() },
      events: { once: vi.fn(), emit: vi.fn() },
    };

    loader = new PhaserAssetLoader(mockScene, globalThis.mockLogger);
  });

  it("should load image if not existing", () => {
    loader.loadImage("pipe", "pipe-straight.png");

    expect(mockScene.textures.exists).toHaveBeenCalledWith("pipe");
    expect(mockScene.load.image).toHaveBeenCalledWith("pipe", "pipe-straight.png");
  });

  it("should skip duplicate textures and log debug", () => {
    (mockScene.textures.exists as any).mockReturnValue(true);

    loader.loadImage("pipe", "pipe-straight.png");

    expect(mockScene.load.image).not.toHaveBeenCalled();
    expect(globalThis.mockLogger.debug).toHaveBeenCalledWith(
      "[AssetLoader] Skipped duplicate texture: pipe"
    );
  });

  it("should call load.start on startLoading", () => {
    loader.startLoading();
    expect(mockScene.load.start).toHaveBeenCalled();
  });

  it("should load multiple images via loadImages", () => {
    const assets = {
      "pipe-cross": "pipe-cross.png",
      "pipe-straight": "pipe-straight.png",
    };

    loader.loadImages(assets);

    for (const [key, path] of Object.entries(assets)) {
      expect(mockScene.load.image).toHaveBeenCalledWith(key, path);
    }
  });
});