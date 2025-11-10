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

  it("should call load.image for all assets in loadAll", () => {
    loader.loadAll();

    expect(mockScene.textures.exists).toHaveBeenCalledTimes(5);
    expect(mockScene.load.image).toHaveBeenCalledTimes(5);

    expect(mockScene.load.image).toHaveBeenCalledWith("grid-cell", expect.any(String));
    expect(mockScene.load.image).toHaveBeenCalledWith("pipe-straight", expect.any(String));
    expect(mockScene.load.image).toHaveBeenCalledWith("pipe-corner", expect.any(String));
    expect(mockScene.load.image).toHaveBeenCalledWith("pipe-cross", expect.any(String));
    expect(mockScene.load.image).toHaveBeenCalledWith("pipe-start", expect.any(String));
  });

  it("should not call load.image if texture already exists", () => {
    (mockScene.textures.exists as any).mockReturnValue(true);

    loader.loadAll();

    expect(mockScene.load.image).not.toHaveBeenCalled();
    expect(globalThis.mockLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining("Skipped duplicate texture")
    );
  });

  it("startLoading should call scene.load.start", () => {
    loader.startLoading();
    expect(mockScene.load.start).toHaveBeenCalled();
    expect(globalThis.mockLogger.debug).toHaveBeenCalledWith("[AssetLoader] Loader started");
  });
});