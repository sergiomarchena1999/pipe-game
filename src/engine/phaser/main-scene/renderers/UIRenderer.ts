import Phaser from "phaser";
import type { ILogger } from "../../../../core/logging/ILogger";
import type { GameState } from "../../../../core/GameState";
import { createPanelButton } from "../../utils";

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
    this.uiContainer = this.scene.add.container(0, 0).setScrollFactor(0);
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

    this.scoreText = this.createText(
      20,
      20,
      `Pipes: 0/${targetScore} | Score: 0`,
      { fontSize: "30px", color: "#fff", padding: { x: 12, y: 8 } }
    ).setOrigin(0, 0);

    this.uiContainer.add(this.scoreText);
  }

  /** Updates score display */
  updateScoreDisplay(score: number, pipesFlowed: number): void {
    if (!this.scoreText) return;

    const targetScore = this.state.scoreController.targetScore;
    const progress = this.state.scoreController.progressPercent.toFixed(0);

    this.scoreText.setText(`Pipes: ${pipesFlowed}/${targetScore} (${progress}%) | Score: ${score}`);
  }

  /** Displays the game over panel */
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
    this.gameOverPanel = this.scene.add.image(centerX, centerY - 100, panelKey)
      .setDepth(2001)
      .setScrollFactor(0)
      .setScale(0);

    // Stats text
    const statsText = this.createText(centerX, centerY - 10,
      `Final Score: ${score}\nPipes Connected: ${pipesFlowed}`, 
      { fontSize: "30px", color: "#fff", stroke: "#000", strokeThickness: 4, align: "center" }
    ).setOrigin(0.5).setAlpha(0);

    // Buttons
    const buttonY = centerY + 100;
    const playAgainButton = createPanelButton(centerX - 100, buttonY, "Play Again", onPlayAgain, this.scene);
    const menuButton = createPanelButton(centerX + 100, buttonY, "Main Menu", onReturnToMenu, this.scene);

    this.uiContainer.add([this.gameOverPanel, statsText, playAgainButton, menuButton]);

    // Animate panel and buttons
    this.scene.tweens.add({ targets: this.gameOverPanel, scale: 1, duration: 400, ease: "Back.easeOut" });
    this.scene.tweens.add({ targets: [statsText, playAgainButton, menuButton], alpha: 1, duration: 300, delay: 200, ease: "Power2" });

    this.logger.info(`GameOverPanel displayed: ${panelKey}`);
  }

  /** Generic text creation helper with custom font support */
  private createText(
    x: number,
    y: number,
    text: string,
    style: Phaser.Types.GameObjects.Text.TextStyle = {}
  ): Phaser.GameObjects.Text {
    return this.scene.add.text(x, y, text, { fontFamily: "Jersey10", ...style }).setDepth(1000);
  }

  /** Creates top-right back button */
  private createBackButton(): void {
    this.backButton = this.createText(0, 0, "Back to Menu", { fontSize: "30px", color: "#fff", padding: { x: 12, y: 6 } })
      .setOrigin(1, 0)
      .setScrollFactor(0)
      .setInteractive({ useHandCursor: true });

    this.backButton.on("pointerdown", () => this.scene.events.emit("ui:backToMenu"));
    this.uiContainer.add(this.backButton);
  }

  /** Handle resize */
  private handleResize(): void {
    this.repositionUI();
  }

  /** Adjust UI positions */
  private repositionUI(): void {
    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    if (this.backButton) this.backButton.setPosition(width - 20, 20);
    if (this.overlay) this.overlay.setSize(width, height);
    if (this.gameOverPanel) this.gameOverPanel.setPosition(centerX, centerY - 100);

    const statsText = this.uiContainer.getAll().find(
      obj => obj instanceof Phaser.GameObjects.Text && obj.text?.startsWith("Final Score:")
    ) as Phaser.GameObjects.Text | undefined;

    if (statsText) statsText.setPosition(centerX, centerY - 10);

    const buttons = this.uiContainer.list.filter(
      obj => obj instanceof Phaser.GameObjects.Text && ["Play Again", "Main Menu"].includes(obj.text)
    ) as Phaser.GameObjects.Text[];

    if (buttons.length === 2) {
      buttons[0].setPosition(centerX - 100, centerY + 100);
      buttons[1].setPosition(centerX + 100, centerY + 100);
    }
  }

  /** Destroy UI */
  destroy(): void {
    this.scene.scale.off("resize", this.handleResize, this);
    this.uiContainer.destroy(true);
  }
}