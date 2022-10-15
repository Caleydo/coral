import { format } from 'd3v7';
import { IEqualsList, INumRange, isEqualsList, isNumRangeFilter, NumRangeOperators } from '../base/rest';

export function niceName(label: string): string {
  return label
    .split('_')
    .map((l) => l[0].toUpperCase() + l.slice(1))
    .join(' ');
}

// TODO label
// export function labelFromRanges(lowerOperator: '(' | '[', lowerBound: number, upperBound: number, upperOperator: ')' | ']', attr: IAttribute): string {
export function labelFromRanges(lowerOperator: '(' | '[', lowerBound: number, upperBound: number, upperOperator: ')' | ']', attrLabel: string): string {
  // const attribute = attr && attr.label ? attr.label : 'x';
  const attribute = attrLabel || 'x';
  const htmlLte = '&#8804';
  const htmlLt = '&#60';
  const htmlGte = '&#8805';
  const htmlGt = '&#62';
  const formatter = format('.4~f');

  if (lowerOperator === null) {
    // const up = upperOperator === ')' ? htmlLt : htmlLte;
    // return `${attribute} ${up} ${formatter(upperBound as number)}`;
    const up = upperOperator === ')' ? htmlLt : htmlLte;
    return `${up} ${formatter(upperBound as number)}`;
  }
  if (upperOperator === null) {
    // const low = lowerOperator === '(' ? htmlLt : htmlLte;
    // return `${formatter(lowerBound as number)} ${low} ${attribute}`;
    const low = lowerOperator === '(' ? htmlGt : htmlGte;
    return `${low} ${formatter(lowerBound as number)}`;
  }
  if (formatter(lowerBound) === formatter(upperBound)) {
    return `${formatter(lowerBound)}`;
  }
  // const low = lowerOperator === '(' ? htmlLt : htmlLte;
  // const up = upperOperator === ')' ? htmlLt : htmlLte;
  // return `${formatter(lowerBound as number)} ${low} ${attribute} ${up} ${formatter(upperBound as number)}`;
  const low = lowerOperator === '(' ? htmlGt : htmlGte;
  const up = upperOperator === ')' ? htmlLt : htmlLte;
  return ` ${low} ${formatter(lowerBound as number)} to ${up} ${formatter(upperBound as number)}`;
}

export function labelForCategories(categories: Array<any>): string {
  return categories.map((cat) => niceName(`${cat}`)).join('/');
}

export function easyLabelFromFilter(filter: INumRange | IEqualsList, attrLabel: string = null): string {
  const formatter = format('.1~f');
  if (isNumRangeFilter(filter)) {
    // INumRange Type Guard 💂‍♂️
    if (filter.valueOne === 'null' || filter.valueTwo === 'null' || filter.valueOne === null || filter.valueTwo === null) {
      return attrLabel === null ? `Missing Values` : `Missing ${attrLabel} Values`;
    }
    return `${formatter(filter.valueOne as number)} to ${formatter(filter.valueTwo as number)}`;
  }
  if (isEqualsList(filter)) {
    // for number of categories uncomment next line.
    // check if more than one category
    // return filter.values.length > 1 ? `${filter.values.length} Categories` : niceName(`${filter.values[0]}`);
    return labelForCategories(filter.values);
  }

  throw new Error('not implemented ☠');
}

export function easyLabelFromFilterArray(filter: INumRange[] | IEqualsList, attrLabel: string = null): string {
  let label = '';
  if (Array.isArray(filter)) {
    label = filter.map((a) => easyLabelFromFilter(a, attrLabel)).join(' / ');
  } else {
    label = easyLabelFromFilter(filter, attrLabel);
  }
  return label;
}

// -----

// export function labelFromFilterArray(filter: INumRange[] | IEqualsList, attr: IAttribute): string {
//   if (Array.isArray(filter)) {
//     const labels = [];
//     for (const f of filter) {
//       labels.push(labelFromFilter(f, attr));
//     }
//     return labels.join('/');
//   } else {
//     return labelFromFilter(filter, attr);
//   }
// }

// TODO label
// export function labelFromFilter(filter: INumRange | IEqualsList, attr: IAttribute): string {
export function labelFromFilter(filter: INumRange | IEqualsList, attrLabel: string): string {
  if (isNumRangeFilter(filter)) {
    // INumRange Type Guard 💂‍♂️
    const opOne = filter.operatorOne.indexOf('=') === -1 ? ')' : ']';
    const lowerOperator = filter.operatorOne === NumRangeOperators.gte ? '[' : '(';
    const upperOperator = filter.operatorTwo === NumRangeOperators.lte ? ']' : ')';

    if (filter.valueOne === 'null' || filter.valueTwo === 'null' || filter.valueOne === null || filter.valueTwo === null) {
      // return `Missing ${attr.label} Values`;
      return `Missing ${attrLabel} Values`;
    }
    // return labelFromRanges(lowerOperator, filter.valueOne as number, filter.valueTwo as number, upperOperator, attr);
    return labelFromRanges(lowerOperator, filter.valueOne as number, filter.valueTwo as number, upperOperator, attrLabel);
  }
  if (isEqualsList(filter)) {
    return labelForCategories(filter.values);
  }

  throw new Error('not implemented ☠');
}

// plural and sigular functions from: https://stackoverflow.com/a/57129703
// licensed under CC-BY-SA 4.0, see https://stackoverflow.com/help/licensing
/**
 * Returns the plural of an English word.
 *
 * @export
 * @param {string} word
 * @param {number} [amount]
 * @returns {string}
 */
export function plural(word: string, amount?: number): string {
  if (amount !== undefined && amount === 1) {
    return word;
  }
  const pluralWords: { [key: string]: string } = {
    '(quiz)$': '$1zes',
    '^(ox)$': '$1en',
    '([m|l])ouse$': '$1ice',
    '(matr|vert|ind)ix|ex$': '$1ices',
    '(x|ch|ss|sh)$': '$1es',
    '([^aeiouy]|qu)y$': '$1ies',
    '(hive)$': '$1s',
    '(?:([^f])fe|([lr])f)$': '$1$2ves',
    '(shea|lea|loa|thie)f$': '$1ves',
    sis$: 'ses',
    '([ti])um$': '$1a',
    '(tomat|potat|ech|her|vet)o$': '$1oes',
    '(bu)s$': '$1ses',
    '(alias)$': '$1es',
    '(octop)us$': '$1i',
    '(ax|test)is$': '$1es',
    '(us)$': '$1es',
    '([^s]+)$': '$1s',
  };

  const irregular: { [key: string]: string } = {
    move: 'moves',
    foot: 'feet',
    goose: 'geese',
    sex: 'sexes',
    child: 'children',
    man: 'men',
    tooth: 'teeth',
    person: 'people',
  };

  const uncountable: string[] = [
    'sheep',
    'fish',
    'deer',
    'moose',
    'series',
    'species',
    'money',
    'rice',
    'information',
    'equipment',
    'bison',
    'cod',
    'offspring',
    'pike',
    'salmon',
    'shrimp',
    'swine',
    'trout',
    'aircraft',
    'hovercraft',
    'spacecraft',
    'sugar',
    'tuna',
    'you',
    'wood',
  ];

  // save some time in the case that singular and plural are the same
  if (uncountable.indexOf(word.toLowerCase()) >= 0) {
    return word;
  }
  // check for irregular forms
  for (const w in irregular) {
    if (irregular.hasOwnProperty(w)) {
      const pattern = new RegExp(`${w}$`, 'i');
      const replace = irregular[w];
      if (pattern.test(word)) {
        return word.replace(pattern, replace);
      }
    }
  }
  // check for matches using regular expressions
  for (const reg in pluralWords) {
    if (pluralWords.hasOwnProperty(reg)) {
      const pattern = new RegExp(reg, 'i');
      if (pattern.test(word)) {
        return word.replace(pattern, pluralWords[reg]);
      }
    }
  }
  return word;
}

/**
 * Returns the singular of an English word.
 *
 * @export
 * @param {string} word
 * @param {number} [amount]
 * @returns {string}
 */
export function singular(word: string, amount?: number): string {
  if (amount !== undefined && amount !== 1) {
    return word;
  }
  const singularWords: { [key: string]: string } = {
    '(quiz)zes$': '$1',
    '(matr)ices$': '$1ix',
    '(vert|ind)ices$': '$1ex',
    '^(ox)en$': '$1',
    '(alias)es$': '$1',
    '(octop|vir)i$': '$1us',
    '(cris|ax|test)es$': '$1is',
    '(shoe)s$': '$1',
    '(o)es$': '$1',
    '(bus)es$': '$1',
    '([m|l])ice$': '$1ouse',
    '(x|ch|ss|sh)es$': '$1',
    '(m)ovies$': '$1ovie',
    '(s)eries$': '$1eries',
    '([^aeiouy]|qu)ies$': '$1y',
    '([lr])ves$': '$1f',
    '(tive)s$': '$1',
    '(hive)s$': '$1',
    '(li|wi|kni)ves$': '$1fe',
    '(shea|loa|lea|thie)ves$': '$1f',
    '(^analy)ses$': '$1sis',
    '((a)naly|(b)a|(d)iagno|(p)arenthe|(p)rogno|(s)ynop|(t)he)ses$': '$1$2sis',
    '([ti])a$': '$1um',
    '(n)ews$': '$1ews',
    '(h|bl)ouses$': '$1ouse',
    '(corpse)s$': '$1',
    '(us)es$': '$1',
    s$: '',
  };

  const irregular: { [key: string]: string } = {
    move: 'moves',
    foot: 'feet',
    goose: 'geese',
    sex: 'sexes',
    child: 'children',
    man: 'men',
    tooth: 'teeth',
    person: 'people',
  };

  const uncountable: string[] = [
    'sheep',
    'fish',
    'deer',
    'moose',
    'series',
    'species',
    'money',
    'rice',
    'information',
    'equipment',
    'bison',
    'cod',
    'offspring',
    'pike',
    'salmon',
    'shrimp',
    'swine',
    'trout',
    'aircraft',
    'hovercraft',
    'spacecraft',
    'sugar',
    'tuna',
    'you',
    'wood',
  ];

  // save some time in the case that singular and plural are the same
  if (uncountable.indexOf(word.toLowerCase()) >= 0) {
    return word;
  }
  // check for irregular forms
  for (const w in irregular) {
    if (irregular.hasOwnProperty(w)) {
      const pattern = new RegExp(`${irregular[w]}$`, 'i');
      const replace = w;
      if (pattern.test(word)) {
        return word.replace(pattern, replace);
      }
    }
  }
  // check for matches using regular expressions
  for (const reg in singularWords) {
    if (singularWords.hasOwnProperty(reg)) {
      const pattern = new RegExp(reg, 'i');
      if (pattern.test(word)) {
        return word.replace(pattern, singularWords[reg]);
      }
    }
  }
  return word;
}
