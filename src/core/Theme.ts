export interface Theme {
  name: string;
  /** CSS color for HTML background */
  htmlBg: string;
  /** Phaser scene background color */
  sceneBg: number;
  colors: {
    empty: number;
    emptyAlt: number;
    wall: number;
    wallDetail: number;
    wallHighlight: number;
    trail: number;
    trailDetail: number;
    target: number;
    petalColors: number[];
    snail: number;
    snailShell: number;
    snailHead: number;
    snailEyeWhite: number;
    snailEyePupil: number;
    gridLine: number;
    gridLineAlpha: number;
    uiBackground: number;
    uiBorder: number;
    uiText: string;
    buttonBg: number;
    buttonText: string;
    star: number;
    starEmpty: number;
  };
  /** Optional glow/shadow settings */
  glow?: {
    trail?: { color: number; alpha: number; blur: number };
    target?: { color: number; alpha: number; blur: number };
    snail?: { color: number; alpha: number; blur: number };
  };
  /** Drop shadow for walls and elevated elements */
  shadow?: {
    color: number;
    offsetX: number;
    offsetY: number;
    alpha: number;
  };
  /** Use rounded rects for cells */
  roundedCells?: boolean;
  /** Cell corner radius (fraction of cellSize) */
  cellRadius?: number;
  /** Cell inset/gap (fraction of cellSize) */
  cellGap?: number;
}

export const THEME_NEON: Theme = {
  name: 'Neon',
  htmlBg: '#0a0a1a',
  sceneBg: 0x0a0a1a,
  colors: {
    empty: 0x11112a,
    emptyAlt: 0x101028,
    wall: 0x1a1a3a,
    wallDetail: 0x2a2a5a,
    wallHighlight: 0x3a3a7a,
    trail: 0x003322,
    trailDetail: 0x00ff88,
    target: 0xff00ff,
    petalColors: [0xff00ff, 0xff44ff, 0xcc00ff, 0xff00cc, 0xff66ff],
    snail: 0x00ffff,
    snailShell: 0x0088aa,
    snailHead: 0x00ffcc,
    snailEyeWhite: 0xffffff,
    snailEyePupil: 0xff0066,
    gridLine: 0x00ffff,
    gridLineAlpha: 0.04,
    uiBackground: 0x0a0a2a,
    uiBorder: 0x00ffff,
    uiText: '#00ffff',
    buttonBg: 0x002244,
    buttonText: '#00ffff',
    star: 0xffff00,
    starEmpty: 0x333355,
  },
  glow: {
    trail: { color: 0x00ff88, alpha: 0.3, blur: 8 },
    target: { color: 0xff00ff, alpha: 0.4, blur: 10 },
    snail: { color: 0x00ffff, alpha: 0.4, blur: 12 },
  },
  shadow: {
    color: 0x000011,
    offsetX: 2,
    offsetY: 3,
    alpha: 0.5,
  },
  roundedCells: true,
  cellRadius: 0.08,
  cellGap: 0.02,
};

export const THEME_PIXEL: Theme = {
  name: 'Pixel',
  htmlBg: '#2a1f14',
  sceneBg: 0x2a1f14,
  colors: {
    empty: 0x6b8f3c,
    emptyAlt: 0x678a39,
    wall: 0x8b6914,
    wallDetail: 0x7a5c10,
    wallHighlight: 0x9a7520,
    trail: 0x9ecf5a,
    trailDetail: 0xb5e06e,
    target: 0xffdd44,
    petalColors: [0xff6699, 0xff88aa, 0xff4477, 0xff77aa, 0xff5588],
    snail: 0xff6b35,
    snailShell: 0xc85a28,
    snailHead: 0xffcc88,
    snailEyeWhite: 0xffffff,
    snailEyePupil: 0x333333,
    gridLine: 0x4a6b28,
    gridLineAlpha: 0.06,
    uiBackground: 0x3d2200,
    uiBorder: 0xffd700,
    uiText: '#ffffff',
    buttonBg: 0x4a7c2e,
    buttonText: '#ffffff',
    star: 0xffd700,
    starEmpty: 0x665522,
  },
  shadow: {
    color: 0x1a1000,
    offsetX: 2,
    offsetY: 3,
    alpha: 0.4,
  },
  roundedCells: true,
  cellRadius: 0.08,
  cellGap: 0.02,
};

export const THEME_MODERN: Theme = {
  name: 'Modern',
  htmlBg: '#1a1a2e',
  sceneBg: 0x1a1a2e,
  colors: {
    empty: 0x2d2d4a,
    emptyAlt: 0x2b2b47,
    wall: 0x4a4a6a,
    wallDetail: 0x3a3a5a,
    wallHighlight: 0x5a5a7a,
    trail: 0x3d2d5a,
    trailDetail: 0x7c5cbf,
    target: 0xf0a050,
    petalColors: [0xf0a050, 0xf0b070, 0xe09040, 0xf0c080, 0xe08030],
    snail: 0x5bc0be,
    snailShell: 0x3a8a8a,
    snailHead: 0xa0e0dd,
    snailEyeWhite: 0xffffff,
    snailEyePupil: 0x1a1a2e,
    gridLine: 0x4a4a6a,
    gridLineAlpha: 0.04,
    uiBackground: 0x16162b,
    uiBorder: 0x5bc0be,
    uiText: '#e0e0f0',
    buttonBg: 0x3a8a8a,
    buttonText: '#ffffff',
    star: 0xf0a050,
    starEmpty: 0x3a3a5a,
  },
  shadow: {
    color: 0x0a0a18,
    offsetX: 2,
    offsetY: 3,
    alpha: 0.45,
  },
  roundedCells: true,
  cellRadius: 0.15,
  cellGap: 0.04,
};

export const ALL_THEMES: Theme[] = [THEME_NEON, THEME_PIXEL, THEME_MODERN];

/** Map world names to their themes */
const WORLD_THEMES: Record<string, Theme> = {
  garden: THEME_PIXEL,
  kitchen: THEME_MODERN,
  park: THEME_MODERN,
  city: THEME_MODERN,
  space: THEME_NEON,
};

/** Get the theme for a given world name (defaults to Pixel) */
export function getThemeForWorld(worldName: string): Theme {
  return WORLD_THEMES[worldName] ?? THEME_PIXEL;
}
