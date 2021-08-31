type ThemeColors = {
  // The background color controls the clear color
  background: number,
  globe: {
    // The front highlight color controls the edge of the globe
    frontHighlight: number,
    // The water color controls the main tint of the globe
    water: number,
    // The highlight color controls the edge of the globe
    highlight: number
  },
  halo: {
    // The glow color controls the halo's main color
    glow: number
  }
};

export default class Theme {
  colors: ThemeColors;

  constructor() {
    this.colors = {
      background: 0x040d21,
      globe: {
        frontHighlight: 0x27367d,
        water: 0x171634,
        highlight: 0x517966
      },
      halo: {
        glow: 0x1c2462
      },
    }
  }
}
