import { select, Selection } from 'd3v7';
import * as logger from 'loglevel';
import { NotificationHandler } from 'tdp_core';
import { ICohort } from './CohortInterfaces';
import { IAttribute } from './data/Attribute';
import { IEqualsList, INumRange } from './base/rest';

logger.setDefaultLevel(logger.levels.INFO);
export const log = logger;

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
export const deepCopy = <T>(target: T): T => {
  if (target === null) {
    return target;
  }
  if (target instanceof Date) {
    return new Date(target.getTime()) as any;
  }
  if (target instanceof Array) {
    const cp = [] as any[];
    (target as any[]).forEach((v) => {
      cp.push(v);
    });
    return cp.map((n: any) => deepCopy<any>(n)) as any;
  }
  if (typeof target === 'object' && target !== {}) {
    const cp = { ...(target as { [key: string]: any }) } as { [key: string]: any };
    Object.keys(cp).forEach((k) => {
      cp[k] = deepCopy<any>(cp[k]);
    });
    return cp as T;
  }
  return target;
};

export function handleDataLoadError(e): void {
  let msg = 'Data could not be loaded.';
  if (e instanceof Error && e.message.toUpperCase() === 'UNAUTHORIZED') {
    msg = 'You need to login first.';
  }
  log.error(msg, e);
  NotificationHandler.pushNotification('error', msg, 4000);
}

export function handleDataSaveError(e): void {
  let msg = 'Data could not be saved.';
  if (e instanceof Error && e.message.toUpperCase() === 'UNAUTHORIZED') {
    msg = 'You need to login first.';
  }
  log.error(msg, e);
  NotificationHandler.pushNotification('error', msg, 4000);
}

/**
 * Returns true if removed, false if it didn't contain the element
 * @param array array to remove from
 * @param toRemove element to remove
 */
export function removeFromArray<T>(array: Array<T>, toRemove: T): boolean {
  const index = array.indexOf(toRemove);
  if (index > -1) {
    array.splice(index, 1); // remove one element at <index>
    return true;
  }

  return false;
}

/**
 * Returns true if added to array, false if it already contained the element
 * @param array array to push to
 * @param toPush element to push
 */
export function pushUnique<T>(array: Array<T>, toPush: T): boolean {
  const index = array.indexOf(toPush);
  if (index === -1) {
    array.push(toPush);
    return true;
  }

  return false;
}

export enum SortType {
  Default = 'default',
  Alpha_AZ = 'alpha_az',
  Alpha_ZA = 'alpha_za',
  Size_19 = 'size_19',
  Size_91 = 'size_91',
}

export interface IFilterDesc {
  cohort: ICohort;
  filter: IAttributeFilter[];
}

export interface IAttributeFilter {
  attr: IAttribute;
  range: INumRange[] | IEqualsList;
}

export function getAnimatedLoadingText(thingToLoad = '', large = true) {
  const span = document.createElement('p');
  span.classList.add('loading');
  span.classList.toggle('large', large);
  span.innerHTML = `Loading ${thingToLoad} <span class="one">.</span><span class="two">.</span><span class="three">.</span>`;
  return span;
}

export function getAnimatedLoadingBars(): HTMLDivElement {
  const loadingContainer = document.createElement('div');
  loadingContainer.classList.add('loading-bars');
  const numBars = 5;
  for (let i = 0; i < numBars; i++) {
    const spanBar = document.createElement('div');
    spanBar.style.setProperty('--n', `${i}`);
    loadingContainer.appendChild(spanBar);
  }
  return loadingContainer;
}

const category20 = [
  // Based on Category20: https://vega.github.io/vega/docs/schemes/#category20
  // Saturated
  '#1f77b4',
  '#2ca02c',
  '#d62728',
  '#9467bd',
  '#8c564b',
  '#e377c2',
  '#7f7f7f',
  '#bcbd22',
  // unsaturated
  '#aec7e8',
  '#98df8a',
  '#ff9896',
  '#c5b0d5',
  '#c49c94',
  '#f7b6d2',
  '#c7c7c7',
  '#dbdb8d',
];

const tableau20 = [
  // Based on Tableau20: https://vega.github.io/vega/docs/schemes/#tableau20
  // Saturated
  '#4c78a8',
  '#54a24b',
  '#e45756',
  '#79706e',
  '#d67195',
  '#b279a2',
  '#9e765f',
  // unsaturated
  '#9ecae9',
  '#88d27a',
  '#ff9d98',
  '#bab0ac',
  '#fcbfd2',
  '#d6a5c9',
  '#d8b5a5',
];

const pastel1 = [
  // based on patel1: https://vega.github.io/vega/docs/schemes/#pastel1
  '#fbb4ae' /* p1:red */,
  '#b3cde3' /* p1:blue */,
  '#ccebc5' /* p1:green */,
  '#decbe4' /* p1:lila */,
  '#fed9a6' /* p1:orange */,
  '#ffffcc' /* p1:yellow */,
  '#e5d8bd' /* p1:brown */,
  '#fddaec' /* p1:pink */,
  '#f2f2f2' /* p1:grey */,
];

const pastel2 = [
  // based on pastel2: https://vega.github.io/vega/docs/schemes/#pastel2
  '#b3e2cd' /* p2:dark green */,
  '#fdcdac' /* p2:orange */,
  '#cbd5e8' /* p2:blue */,
  '#f4cae4' /* p2:pink */,
  '#e6f5c9' /* p2:light green */,
  '#fff2ae' /* p2:yellow */,
  '#f1e2cc' /* p2:brown */,
  '#cccccc' /* p2:grey */,
];

const set2 = [
  // based on set3: https://vega.github.io/vega/docs/schemes/#set2
  // -> rearranged and without turquose, and grey
  '#fc8d62' /* red */,
  '#8da0cb' /* blue */,
  '#e78ac3' /* pink */,
  '#a6d854' /* green */,
  '#ffd92f' /* yellow */,
  '#e5c494' /* brown */,
  // '#66c2a5' /* turquose */,
  // '#b3b3b3' /* grey*/,
];

const set3 = [
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

const combination = [
  // combination of different set: set3, tableau20, pastel1 & 2
  '#80b1d3' /* set3:blue */,
  '#fb8072' /* set3:red */,
  '#b3de69' /* set3:green */,
  '#bc80bd' /* set3:lila */,
  '#ffed6f' /* set3:yellow */,
  '#fcbfd2' /* t20:light pink */,
  '#d8b5a5' /* t20: light brown */,
  '#e6f5c9' /* p2:light green */,
  '#decbe4' /* p1:lila */,
  '#ffffb3' /* set3:light yellow */,
  '#fddaec' /* p1:pink */,
  '#f1e2cc' /* p2:brown */,
];

export class CohortColorSchema {
  static readonly COLOR_SCHEME = set3;

  static get(index: number): string {
    const moduloIndex = index % CohortColorSchema.COLOR_SCHEME.length;
    return CohortColorSchema.COLOR_SCHEME[moduloIndex];
  }
}

export function setSessionStorageItem(key: string, value: any) {
  const strValue = JSON.stringify(value);
  sessionStorage.setItem(key, strValue);
}

// returns null if key does not exist
export function getSessionStorageItem(key: string) {
  const value = sessionStorage.getItem(key);
  return JSON.parse(value);
}

export function selectLast(d3Elem: Selection<HTMLDivElement, any, null, undefined>, query: string) {
  const queryHits = d3Elem.selectAll(query).nodes();
  const queryHitsNo = queryHits.length;
  return select(queryHits[queryHitsNo - 1]);
}

export function inRange(value, interval) {
  const lower = Math.min(...interval);
  const upper = Math.max(...interval);

  return value >= lower && value <= upper;
}

export function hasCookie(cookieID) {
  return document.cookie.split(';').some((item) => item.trim().startsWith(`${cookieID}=`));
}

export function createHTMLElementWithClasses(htmlElem: string, classes: string[]): HTMLElement {
  const element = document.createElement(htmlElem);
  element.classList.add(...classes);
  return element;
}

export class DebugTools {
  /**
   * lets the execution pause for the given amount of milliseconds.
   * Use with await keyword.
   * @param millis time to wait
   */
  static async sleep(millis: number): Promise<void> {
    log.info('taking a little nap');
    return new Promise((resolve) => setTimeout(resolve, millis));
  }
}
