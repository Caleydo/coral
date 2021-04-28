import { IEqualsList, INumRange } from './rest';
export declare function niceName(label: string): string;
export declare function easyLabelFromFilterArray(filter: INumRange[] | IEqualsList, attrLabel?: string): string;
export declare function easyLabelFromFilter(filter: INumRange | IEqualsList, attrLabel?: string): string;
export declare function labelFromFilter(filter: INumRange | IEqualsList, attrLabel: string): string;
export declare function labelFromRanges(lowerOperator: '(' | '[', lowerBound: number, upperBound: number, upperOperator: ')' | ']', attrLabel: string): string;
export declare function labelForCategories(categories: Array<any>): string;
/**
 * Returns the plural of an English word.
 *
 * @export
 * @param {string} word
 * @param {number} [amount]
 * @returns {string}
 */
export declare function plural(word: string, amount?: number): string;
/**
 * Returns the singular of an English word.
 *
 * @export
 * @param {string} word
 * @param {number} [amount]
 * @returns {string}
 */
export declare function singular(word: string, amount?: number): string;
