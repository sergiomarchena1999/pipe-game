import Phaser from "phaser";
import type { ILogger } from "../../../../core/logging/ILogger";
import type { GameState } from "../../../../core/GameState";

/**
 * Handles all UI elements in the MainScene: score, panels, and buttons.
 * Decouples UI creation and animations from MainScene logic.
 */
export class UIRenderer {
  private scoreText?: Phaser.GameObjects.Text;
  private gameOverPanel?: Phaser.GameObjects.Image;
  private overlay?: Phaser.GameObjects.Rectangle;
  private backButton?: Phaser.GameObjects.Text;
  private uiContainer: Phaser.GameObjects.Container;

  constructor(
    private readonly scene: Phaser.Scene,
    private readonly state: GameState,
    private readonly logger: ILogger
  ) {
    // Create dedicated UI container (fixed to screen)
    this.uiContainer = this.scene.add.container(0, 0);
    this.uiContainer.setScrollFactor(0);

    // Listen for resize
    this.scene.scale.on("resize", this.handleResize, this);
  }

  /** Creates the persistent UI (score, back button, etc.) */
  createBaseUI(): void {
    this.createScoreDisplay();
    this.createBackButton();
    this.repositionUI();
  }

  /** Creates and initializes the score display text */
  private createScoreDisplay(): void {
    const targetScore = this.state.scoreController.targetScore;

    this.scoreText = this.scene.add.text(
      20,
      20,
      `Pipes: 0/${targetScore} | Score: 0`,
      {
        fontSize: "24px",
        color: "#ffffff",
        backgroundColor: "#000000",
        padding: { x: 12, y: 8 },
        fontStyle: "bold",
      }
    )
      .setOrigin(0, 0)
      .setDepth(1000)
      .setScrollFactor(0);

    this.uiContainer.add(this.scoreText);
  }

  /** Updates score display whenever score or flow count changes */
  updateScoreDisplay(score: number, pipesFlowed: number): void {
    if (!this.scoreText) return;

    const targetScore = this.state.scoreController.targetScore;
    const progress = this.state.scoreController.progressPercent.toFixed(0);

    this.scoreText.setText(
      `Pipes: ${pipesFlowed}/${targetScore} (${progress}%) | Score: ${score}`
    );
  }

  /** Displays the game over panel (win or lose) with animation */
  showGameOverPanel(
    panelKey: "winner-panel" | "loser-panel",
    score: number,
    pipesFlowed: number,
    onPlayAgain: () => void,
    onReturnToMenu: () => void
  ): void {
    const { width, height } = this.scene.scale;

    const centerX = width / 2;
    const centerY = height / 2;

    // Overlay
    this.overlay = this.scene.add.rectangle(0, 0, width, height, 0x000000, 0.7)
      .setOrigin(0)
      .setDepth(2000)
      .setScrollFactor(0)
      .setInteractive();

    this.uiContainer.add(this.overlay);

    // Panel
    this.gameOverPanel = this.scene.add.image(centerX, centerY, panelKey)
      .setDepth(2001)
      .setScrollFactor(0)
      .setScale(0);

    const statsText = this.scene.add.text(
      centerX,
      centerY + 80,
      `Final Score: ${score}\nPipes Connected: ${pipesFlowed}`,
      {
        fontSize: "28px",
        color: "#ffffff",
        align: "center",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 4,
      }
    )
      .setOrigin(0.5)
      .setDepth(2002)
      .setAlpha(0);

    const buttonY = centerY + 160;
    const playAgainButton = this.createPanelButton(centerX - 100, buttonY, "Play Again", onPlayAgain);
    const menuButton = this.createPanelButton(centerX + 100, buttonY, "Main Menu", onReturnToMenu);

    this.uiContainer.add([
      this.gameOverPanel,
      statsText,
      playAgainButton,
      menuButton,
    ]);

    // Animate in
    this.scene.tweens.add({
      targets: this.gameOverPanel,
      scale: 1,
      duration: 400,
      ease: "Back.easeOut",
    });

    this.scene.tweens.add({
      targets: [statsText, playAgainButton, menuButton],
      alpha: 1,
      duration: 300,
      delay: 200,
      ease: "Power2",
    });

    this.logger.info(`GameOverPanel displayed: ${panelKey}`);
  }

  private createPanelButton(x: number, y: number, text: string, onClick: () => void): Phaser.GameObjects.Text {
    const button = this.scene.add.text(x, y, text, {
      fontSize: "22px",
      color: "#ffffff",
      backgroundColor: "#333333",
      padding: { x: 20, y: 10 },
    })
      .setOrigin(0.5)
      .setDepth(2002)
      .setAlpha(0)
      .setInteractive({ useHandCursor: true });

    button.on("pointerover", () => {
      button.setStyle({ backgroundColor: "#555555" });
      this.scene.tweens.add({ targets: button, scale: 1.1, duration: 100 });
    });

    button.on("pointerout", () => {
      button.setStyle({ backgroundColor: "#333333" });
      this.scene.tweens.add({ targets: button, scale: 1, duration: 100 });
    });

    button.on("pointerdown", onClick);
    return button;
  }

  /** Creates the top-right back button */
  private createBackButton(): void {
    this.backButton = this.scene.add.text(0, 0, "Back to Menu", {
      fontSize: "20px",
      color: "#ffffff",
      backgroundColor: "#000000",
      padding: { x: 12, y: 6 },
    })
      .setOrigin(1, 0)
      .setDepth(1000)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.backButton.on("pointerdown", () => {
      this.scene.events.emit("ui:backToMenu");
    });

    this.uiContainer.add(this.backButton);
  }

  /** Handle viewport resize */
  private handleResize(): void {
    this.repositionUI();
  }

  /** Adjust UI positions relative to new screen size */
  private repositionUI(): void {
    const { width, height } = this.scene.scale;

    // Reposition top-right back button
    if (this.backButton) {
			this.backButton.setPosition(width - 20, 20);
    }

    // Recenter Game Over Panel & its elements
    if (this.gameOverPanel || this.overlay) {
			const centerX = width / 2;
			const centerY = height / 2;

			if (this.overlay) {
        this.overlay.setSize(width, height);
			}

			if (this.gameOverPanel) {
        this.gameOverPanel.setPosition(centerX, centerY);
			}

        // Find other panel-related UI in the container
			const statsText = this.uiContainer.getAll().find(obj =>
        obj instanceof Phaser.GameObjects.Text &&
        obj.text?.startsWith("Final Score:")
			) as Phaser.GameObjects.Text | undefined;

			if (statsText) {
        statsText.setPosition(centerX, centerY + 80);
			}

        // Buttons: “Play Again” and “Main Menu”
			const buttons = this.uiContainer.list.filter(
        (obj) =>
            obj instanceof Phaser.GameObjects.Text &&
            (obj.text === "Play Again" || obj.text === "Main Menu")
        ) as Phaser.GameObjects.Text[];

			if (buttons.length === 2) {
        const [playAgain, mainMenu] = buttons;
        const buttonY = centerY + 160;
        playAgain.setPosition(centerX - 100, buttonY);
        mainMenu.setPosition(centerX + 100, buttonY);
			}
    }
  }

  /** Clean up UI */
  destroy(): void {
    this.scene.scale.off("resize", this.handleResize, this);
    this.uiContainer.destroy(true);
  }
}