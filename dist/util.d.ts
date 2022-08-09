import { Selection } from 'd3v7';
import * as logger from 'loglevel';
import { ICohort } from './CohortInterfaces';
import { IAttribute } from './data/Attribute';
import { IEqualsList, INumRange } from './rest';
export declare const log: logger.RootLogger;
/**
 * Deep copy function for TypeScript.
 * SOURCE: https://stackoverflow.com/a/51592360/2549748
 * Function licensed under CC-BY-SA 4.0, see https://stackoverflow.com/help/licensing
 * License is available at https://creativecommons.org/licenses/by-sa/4.0/
 * @param T Generic type of target/copied value.
 * @param target Target value to be copied.
 * @see Source project, ts-deepcopy https://github.com/ykdr2017/ts-deepcopy
 * @see Code pen https://codepen.io/erikvullings/pen/ejyBYg
 */
export declare const deepCopy: <T>(target: T) => T;
export declare function handleDataLoadError(e: any): void;
export declare function handleDataSaveError(e: any): void;
export declare class ScrollLinker {
    private divA;
    private divB;
    private enabled;
    isSyncingScrollA: boolean;
    isSyncingScrollB: boolean;
    constructor(divA: HTMLDivElement, divB: HTMLDivElement, enabled?: boolean);
    private handleScrollA;
    private handleScrollB;
    enable(): void;
    disable(): void;
    destroy(): void;
}
/**
 * Returns true if removed, false if it didn't contain the element
 * @param array array to remove from
 * @param toRemove element to remove
 */
export declare function removeFromArray<T>(array: Array<T>, toRemove: T): boolean;
/**
 * Returns true if added to array, false if it already contained the element
 * @param array array to push to
 * @param toPush element to push
 */
export declare function pushUnique<T>(array: Array<T>, toPush: T): boolean;
export declare enum SortType {
    Default = "default",
    Alpha_AZ = "alpha_az",
    Alpha_ZA = "alpha_za",
    Size_19 = "size_19",
    Size_91 = "size_91"
}
export interface IFilterDesc {
    cohort: ICohort;
    filter: IAttributeFilter[];
}
export interface IAttributeFilter {
    attr: IAttribute;
    range: INumRange[] | IEqualsList;
}
export declare function getAnimatedLoadingText(thingToLoad?: string, large?: boolean): HTMLParagraphElement;
export declare function getAnimatedText(thingToLoad?: string, large?: boolean): HTMLParagraphElement;
export declare function getAnimatedLoadingBars(): HTMLDivElement;
export declare class CohortColorSchema {
    static readonly COLOR_SCHEME: string[];
    static get(index: number): string;
}
export declare function setSessionStorageItem(key: string, value: any): void;
export declare function getSessionStorageItem(key: string): any;
export declare function selectLast(d3Elem: Selection<HTMLDivElement, any, null, undefined>, query: string): Selection<import("d3-selection").BaseType, unknown, null, undefined>;
export declare function inRange(value: any, interval: any): boolean;
export declare function hasCookie(cookieID: any): boolean;
export declare function createHTMLElementWithClasses(htmlElem: string, classes: string[]): HTMLElement;
export declare class DebugTools {
    /**
     * lets the execution pause for the given amount of milliseconds.
     * Use with await keyword.
     * @param millis time to wait
     */
    static sleep(millis: number): Promise<void>;
}
