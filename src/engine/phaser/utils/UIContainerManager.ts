import { UIConfig } from "../../../config/UIConfig";


/**
 * UIContainerManager — small helper for scenes that need separated UI layers.
 * - uiFixed: elements that should not scale/move (credits, overlays)
 * - uiDynamic: elements that may be scaled/centered (panels, buttons)
 */
export class UIContainerManager {
  public uiFixedContainer: Phaser.GameObjects.Container;
  public uiDynamicContainer: Phaser.GameObjects.Container;

  private scene: Phaser.Scene;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.uiFixedContainer = scene.add.container(0, 0).setScrollFactor(0);
    this.uiDynamicContainer = scene.add.container(0, 0).setScrollFactor(0);

    // ensure containers start at sensible scale
    this.uiDynamicContainer.setScale(1);

    // initial placement
    this.reposition();
  }

  addFixed(obj: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]): void {
    this.uiFixedContainer.add(obj as any);
  }

  addDynamic(obj: Phaser.GameObjects.GameObject | Phaser.GameObjects.GameObject[]): void {
    this.uiDynamicContainer.add(obj as any);
  }

  getCenter(): { centerX: number; centerY: number } {
    const { width, height } = this.scene.scale;
    return { centerX: width / 2, centerY: height / 2 };
  }

  reposition(): void {
    const { width, height } = this.scene.scale;
    const centerX = width / 2;
    const centerY = height / 2;

    // Responsive scale (similar logic to UIRenderer)
    const scaleX = width / UIConfig.RESPONSIVE.DESIGN_WIDTH;
    const scaleY = height / UIConfig.RESPONSIVE.DESIGN_HEIGHT;
    const targetScale = Phaser.Math.Clamp(
      Math.min(scaleX, scaleY),
      UIConfig.RESPONSIVE.MIN_SCALE,
      UIConfig.RESPONSIVE.MAX_SCALE
    );

    // Direct set for immediate layout (MenuScene is light-weight)
    this.uiDynamicContainer.setScale(targetScale);
    this.uiDynamicContainer.setPosition(centerX, centerY);
    
    // Fixed elements stay in top-left coordinate space
    this.uiFixedContainer.setScale(targetScale);
    this.uiFixedContainer.setPosition(0, 0);

    // If overlays exist, attempt to resize them
    const children = this.uiFixedContainer.getAll();
    for (const child of children) {
      if (child instanceof Phaser.GameObjects.Rectangle) {
        child.setSize(width, height);
      }
    }
  }

  destroy(): void {
    this.uiFixedContainer.destroy(true);
    this.uiDynamicContainer.destroy(true);
  }
}