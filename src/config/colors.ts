// equals colors in src/scss/abstracts/_variables.scss
export const colors = {
  selectedColor: '#FFC340',
  hoverColor: '#52C0CC',
  searchbarHoverColor: '#D4D4D4',

  barColor: '#595959',
  barBackgroundColor: '#FFF',
  cohortBackgroundColor: '#EFEFEF',

  lighterTextColor: '#737373',
  textColor: ' #333333',
  backgroundColor: '#FFF',

  lightBorder: '#d4d4d4',
  mediumBorder: '#AAA',
  darkBorder: '#333',
};

export class CoralColorSchema {
  static readonly COLOR_SCHEME = [
    // based on set3: https://vega.github.io/vega/docs/schemes/#set3
    // -> rearranged and without orange, turquose, and grey
    '#8dd3c7' /* set3:turquose */,
    '#fdb462' /* set3:orange */,
    '#b3de69' /* set3:green */,
    '#fb8072' /* set3:red */,
    '#ffed6f' /* set3:yellow */,
    '#bc80bd' /* set3:lila */,
    '#80b1d3' /* set3:blue */,
    '#fccde5' /* set3:pink */,
    '#ccebc5' /* set3:mint */,
    '#bebada' /* set3:light lila */,
    '#d8b5a5' /* t20: light brown */,
    // '#ffffb3' /* set3:light yellow */,
    // '#d9d9d9' /* set3:grey */,
  ];

  static get(index: number): string {
    const moduloIndex = index % CoralColorSchema.COLOR_SCHEME.length;
    return CoralColorSchema.COLOR_SCHEME[moduloIndex];
  }
}
