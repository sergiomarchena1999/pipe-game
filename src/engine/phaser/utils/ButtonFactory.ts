import Phaser from "phaser";
import { UIConfig } from "../../../config/UIConfig";


export interface ButtonOptions {
  spriteKey?: string;
  fontSize?: string;
  scale?: { x: number; y: number };
}

/**
 * Factory for creating consistent UI buttons with hover effects.
 * Centralizes button creation logic and styling.
 */
export class ButtonFactory {
  constructor(private readonly scene: Phaser.Scene) {}

  /** Create a panel button with sprite background and text */
  createPanelButton(
    x: number,
    y: number,
    text: string,
    onClick: () => void,
    options: ButtonOptions = {}
  ): Phaser.GameObjects.Container {
    const {
      spriteKey = UIConfig.BUTTON.DEFAULT_SPRITE,
      fontSize = UIConfig.BUTTON.FONT_SIZE,
      scale = UIConfig.BUTTON.SCALE
    } = options;

    // Create button sprite
    const sprite = this.scene.add.image(0, 0, spriteKey)
      .setOrigin(0.5)
      .setScale(scale.x, scale.y);

    // Create button text
    const label = this.scene.add.text(0, 0, text, {
      fontSize,
      color: UIConfig.TEXT.COLOR_WHITE,
      fontFamily: UIConfig.TEXT.FONT_FAMILY
    }).setOrigin(0.5);

    // Create container
    const container = this.scene.add.container(x, y, [sprite, label])
      .setSize(sprite.width, sprite.height)
      .setInteractive({ useHandCursor: true });

    // Add interactive effects
    this.addButtonEffects(container, onClick);

    return container;
  }

  /** Create a simple start button with hover texture change */
  createStartButton(
    x: number,
    y: number,
    onClick: () => void
  ): Phaser.GameObjects.Sprite {
    const button = this.scene.add
      .sprite(x, y, "button-start")
      .setInteractive({ useHandCursor: true })
      .setOrigin(0.5);

    button.on("pointerover", () => {
      button.setTexture("button-start-hover");
      this.scene.tweens.add({
        targets: button,
        scale: UIConfig.BUTTON.HOVER_SCALE,
        duration: UIConfig.BUTTON.ANIMATION_DURATION
      });
    });

    button.on("pointerout", () => {
      button.setTexture("button-start");
      this.scene.tweens.add({
        targets: button,
        scale: UIConfig.BUTTON.NORMAL_SCALE,
        duration: UIConfig.BUTTON.ANIMATION_DURATION
      });
    });

    button.on("pointerdown", onClick);

    return button;
  }

  /** Add standard hover and click effects to a button container */
  private addButtonEffects(
    container: Phaser.GameObjects.Container,
    onClick: () => void
  ): void {
    container.on("pointerover", () => {
      this.scene.tweens.add({
        targets: container,
        scale: UIConfig.BUTTON.HOVER_SCALE,
        duration: UIConfig.BUTTON.ANIMATION_DURATION,
        ease: "Power2"
      });
    });

    container.on("pointerout", () => {
      this.scene.tweens.add({
        targets: container,
        scale: UIConfig.BUTTON.NORMAL_SCALE,
        duration: UIConfig.BUTTON.ANIMATION_DURATION,
        ease: "Power2"
      });
    });

    container.on("pointerdown", onClick);
  }

  /** Update button sprite (useful for selection states) */
  updateButtonSprite(
    container: Phaser.GameObjects.Container,
    spriteKey: string
  ): void {
    const sprite = container.list.find(
      child => child instanceof Phaser.GameObjects.Image
    ) as Phaser.GameObjects.Image | undefined;

    if (sprite) {
      sprite.setTexture(spriteKey);
    }
  }
}