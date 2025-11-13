import Phaser from "phaser";
import { MenuScene } from "./engine/phaser/menu-scene/MenuScene";


/**
 * Application entry point.
 * Initializes logging and starts the Phaser engine with the menu scene.
 */
function initializeApplication(): void {
  const phaserConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: "app",
    scene: [MenuScene], // Only load MenuScene initially
    physics: { default: "arcade", arcade: { debug: false } },
    render: { antialias: true, pixelArt: true },
    scale: { mode: Phaser.Scale.RESIZE, autoCenter: Phaser.Scale.CENTER_BOTH, width: "100%", height: "100%" },
  };

  // Start Phaser - it will automatically launch MenuScene
  const game = new Phaser.Game(phaserConfig);

  // Expose for debugging
  if (import.meta.env.DEV) {
    (window as any).game = game;
  }

  // Dynamically import MainScene only when starting game
  (window as any).loadMainScene = async () => {
    const { MainScene } = await import("./engine/phaser/main-scene/MainScene");
    game.scene.add("MainScene", MainScene, false);
    return MainScene;
  };
}

window.addEventListener("DOMContentLoaded", initializeApplication);