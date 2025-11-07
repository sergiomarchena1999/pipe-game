import { Game } from "./core/Game";
import { Logger } from "./core/logging/Logger";

/**
 * Application entry point.
 * Initializes the logging system and bootstraps the game.
 */
function initializeApplication(): void {
  const logLevel = import.meta.env.VITE_LOG_LEVEL ?? "info";
  const logger = new Logger(logLevel);

  try {
    const game = new Game(logger);
    game.start();

    // Expose game instance for debugging in development
    if (import.meta.env.DEV) {
      (window as any).game = game;
    }

    // --- GAME LOOP ---
    let lastTime = performance.now();
    const loop = (time: number) => {
      const delta = time - lastTime;
      lastTime = time;

      if (game.running) {
        game.update(delta);
      }

      requestAnimationFrame(loop);
    };

    requestAnimationFrame(loop);
    // --- END LOOP ---

    logger.info("Application initialized successfully");
  } catch (error) {
    logger.error("Failed to initialize application", error);
    throw error;
  }
}

window.addEventListener("DOMContentLoaded", initializeApplication);