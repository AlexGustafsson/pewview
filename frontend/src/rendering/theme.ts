type ThemeColors = {
  background: number,
  globe: {
    frontHighlight: number,
    water: number,
    landFront: number,
    landBack: number,
    highlight: number
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
        landFront: 0xffffff,
        landBack: 0xffffff,
        highlight: 0x517966
      }
    }
  }
}
