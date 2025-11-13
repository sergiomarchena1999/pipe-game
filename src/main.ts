import Phaser from "phaser";
import { MenuScene } from "./engine/phaser/menu-scene/MenuScene";
import { MainScene } from "./engine/phaser/main-scene/MainScene";
import { Logger } from "./core/logging/Logger";


/**
 * Application entry point.
 * Initializes logging and starts the Phaser engine with the menu scene.
 */
function initializeApplication(): void {
  const logLevel = import.meta.env.VITE_LOG_LEVEL ?? "info";
  const logger = new Logger(logLevel);

  // Create Phaser game config - MenuScene is the initial scene
  const phaserConfig: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    parent: "app",
    scene: [MenuScene, MainScene],
    physics: {
      default: "arcade",
      arcade: { debug: false }
    },
    render: { 
      antialias: true, 
      pixelArt: true 
    },
    scale: {
      mode: Phaser.Scale.RESIZE,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: "100%",
      height: "100%",
    },
  };

  // Start Phaser - it will automatically launch MenuScene
  const game = new Phaser.Game(phaserConfig);

  // Expose for debugging
  if (import.meta.env.DEV) {
    (window as any).game = game;
    (window as any).logger = logger;
  }

  logger.info("Application initialized successfully");
}

window.addEventListener("DOMContentLoaded", initializeApplication);