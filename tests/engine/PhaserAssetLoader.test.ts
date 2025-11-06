import { describe, it, expect, vi } from "vitest";
import { PhaserAssetLoader } from "../../src/engine/phaser/PhaserAssetLoader";

vi.mock("phaser", () => ({
  default: { Scene: class {} },
}));

describe("PhaserAssetLoader", () => {
  it("should load image if not existing", () => {
    const mockScene = {
      textures: { exists: vi.fn().mockReturnValue(false) },
      load: { image: vi.fn(), start: vi.fn(), on: vi.fn(), once: vi.fn() },
      events: { once: vi.fn(), emit: vi.fn() },
    } as any;

    const loader = new PhaserAssetLoader(mockScene);
    loader.loadImage("pipe", "path.png");

    expect(mockScene.load.image).toHaveBeenCalledWith("pipe", "path.png");
  });

  it("should skip duplicate textures", () => {
    const mockScene = {
      textures: { exists: vi.fn().mockReturnValue(true) },
      load: { image: vi.fn(), start: vi.fn(), on: vi.fn(), once: vi.fn() },
      events: { once: vi.fn(), emit: vi.fn() },
    } as any;

    const loader = new PhaserAssetLoader(mockScene);
    loader.loadImage("pipe", "path.png");

    expect(mockScene.load.image).not.toHaveBeenCalled();
  });

  it("should call load.start on startLoading", () => {
    const mockScene = {
      textures: { exists: vi.fn().mockReturnValue(false) },
      load: { image: vi.fn(), start: vi.fn(), on: vi.fn(), once: vi.fn() },
      events: { once: vi.fn(), emit: vi.fn() },
    } as any;

    const loader = new PhaserAssetLoader(mockScene);
    loader.startLoading();

    expect(mockScene.load.start).toHaveBeenCalled();
  });
});