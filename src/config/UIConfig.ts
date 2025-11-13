/**
 * Centralized UI configuration constants.
 * All magic numbers and UI-related values should be defined here.
 */
export const UIConfig = {
  BUTTON: {
    DEFAULT_SPRITE: "button-orange",
    SELECTED_SPRITE: "button-blue",
    HOVER_SPRITE_SUFFIX: "-hover",
    HOVER_SCALE: 1.1,
    NORMAL_SCALE: 1.0,
    ANIMATION_DURATION: 100,
    FONT_SIZE: "22px",
    SCALE: { x: 1.1, y: 1.3 }
  },
  
  ANIMATION: {
    FADE_IN_DURATION: 500,
    FADE_OUT_DURATION: 500,
    FADE_OUT_QUICK: 300,
    PANEL_SCALE_DURATION: 400,
    STATS_DELAY: 200,
    MENU_TITLE_FRAME_RATE: 3,
    CURSOR_FRAME_RATE: 2
  },
  
  DEPTH: {
    BACKGROUND: -10,
    GRID_BORDER: 1,
    GRID_CELL: 2,
    PIPE: 5,
    CURSOR: 10,
    BOMB: 10,
    FLOW: 50,
    QUEUE_BORDER: 97,
    QUEUE_SELECTED: 97,
    QUEUE_SIDE: 98,
    QUEUE_CORNER: 99,
    QUEUE_ITEMS: 100,
    UI_BASE: 1000,
    OVERLAY: 2000,
    PANEL: 2001
  },
  
  TEXT: {
    FONT_FAMILY: "Jersey10",
    SCORE_SIZE: "30px",
    STATS_SIZE: "30px",
    CREDIT_SIZE: "30px",
    COLOR_WHITE: "#fff",
    COLOR_ERROR: "#ff0000",
    COLOR_LIGHT: "#e0e0e0",
    STROKE_COLOR: "#000",
    STROKE_THICKNESS: 4
  },
  
  LAYOUT: {
    PADDING: 20,
    DIFFICULTY_SPACING: 300,
    TITLE_OFFSET_Y: -130,
    START_BUTTON_OFFSET_Y: 50,
    DIFFICULTY_OFFSET_Y: 130,
    GAME_OVER_PANEL_OFFSET_Y: -100,
    STATS_OFFSET_Y: -10,
    BUTTON_ROW_OFFSET_Y: 100,
    BUTTON_SPACING: 200
  },

  RESPONSIVE: {
    DESIGN_WIDTH: 640,
    DESIGN_HEIGHT: 480,
    MIN_SCALE: 0.5,   // Smallest UI scale when window shrinks
    MAX_SCALE: 1.0,   // Prevents upscaling beyond design size
    SCALE_TWEEN_DURATION: 300
  },
} as const;

/** Animation configuration presets */
export const AnimationPresets = {
  MENU_TITLE: {
    key: "menu-anim",
    frames: [
      { key: "menu-title-1" },
      { key: "menu-title-2" }
    ] as Phaser.Types.Animations.AnimationFrame[],
    frameRate: UIConfig.ANIMATION.MENU_TITLE_FRAME_RATE,
    repeat: -1
  },
  
  GRID_CURSOR: {
    key: "grid-cursor-anim",
    frames: [
      { key: "grid-cursor" },
      { key: "grid-cursor-alt" }
    ] as Phaser.Types.Animations.AnimationFrame[],
    frameRate: UIConfig.ANIMATION.CURSOR_FRAME_RATE,
    repeat: -1
  }
} as const;