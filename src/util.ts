import { select, Selection } from 'd3v7';
import * as logger from 'loglevel';
import { IAllFilters, IParams, NotificationHandler } from 'tdp_core';
import { ICohort } from './app/interfaces';
import { INumRange, IEqualsList } from './base/interfaces';
import type { IAttribute } from './data/IAttribute';

enum FilterType {
  normal,
  lt,
  lte,
  gt,
  gte,
}

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
  // not empty object
  if (typeof target === 'object' && Object.keys(target).length > 0) {
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
  newCohortId?: number;
}

export function getAnimatedText(thingToLoad = '', large = true) {
  const span = document.createElement('p');
  span.classList.add('loading');
  span.classList.toggle('large', large);
  span.innerHTML = `${thingToLoad} <span class="one">.</span><span class="two">.</span><span class="three">.</span>`;
  return span;
}

export function getAnimatedLoadingText(thingToLoad = '', large = true) {
  return getAnimatedText(`Loading ${thingToLoad}`, large);
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
    return new Promise((resolve) => {
      setTimeout(resolve, millis);
    });
  }
}

function mergerAllFilterPart(filterType: FilterType, existingFilter: IParams, newFilter: IParams): IParams {
  let mergedFilter = deepCopy(existingFilter);
  // const currType : FilterType = FilterType.normal;
  let filterContradiction = false;
  // go through all attribuets of the new filter
  for (const attr in newFilter) {
    // check if attribute exists in the new filter
    if (Object.prototype.hasOwnProperty.call(newFilter, attr)) {
      // check if attribute exists in the existing filter
      if (Object.prototype.hasOwnProperty.call(existingFilter, attr)) {
        const newVal = newFilter[attr]; // current value for attribute
        const existVal = existingFilter[attr]; // current value for attribute

        if (filterType === FilterType.normal) {
          // convert newVal to an array of values
          const newValArray = Array.isArray(newVal) ? (newVal as string[] | number[] | boolean[]) : new Array(newVal as string | number | boolean);
          // convert existVal to an array of values
          const existValArray = Array.isArray(existVal) ? (existVal as string[] | number[] | boolean[]) : new Array(existVal as string | number | boolean);
          // if all new values are part of the existing values, then the filter is OK
          for (const nv of newValArray) {
            if (!existValArray.includes(nv)) {
              filterContradiction = true;
            }
          }
          // no filter contradiction -> new filter values can be used
          if (!filterContradiction) {
            // outside of for-loop
            mergedFilter[attr] = newFilter[attr];
          }
        } else if (filterType === FilterType.lt || filterType === FilterType.lte) {
          // smaller is OK
          if (newVal <= existVal) {
            mergedFilter[attr] = newFilter[attr];
          } else {
            filterContradiction = true;
          }
        } else if (filterType === FilterType.gt || filterType === FilterType.gte) {
          // bigger is OK
          if (newVal >= existVal) {
            mergedFilter[attr] = newFilter[attr];
          } else {
            filterContradiction = true;
          }
        }
      } else {
        // the new filter attribute is not existing -> add to the resulting filter
        mergedFilter[attr] = newFilter[attr];
      }
    }
  }

  if (filterContradiction) {
    mergedFilter = null;
  }
  log.debug('Filter Contradiction: ', filterContradiction);
  return mergedFilter;
}

export function mergeTwoAllFilters(existingFilter: IAllFilters, newFilter: IAllFilters): IAllFilters {
  let mergerAllFilter: IAllFilters = null;
  if (existingFilter !== null) {
    const normal: IParams = mergerAllFilterPart(FilterType.normal, existingFilter.normal, newFilter.normal);
    const lt: IParams = mergerAllFilterPart(FilterType.lt, existingFilter.lt, newFilter.lt);
    const lte: IParams = mergerAllFilterPart(FilterType.lte, existingFilter.lte, newFilter.lte);
    const gt: IParams = mergerAllFilterPart(FilterType.gt, existingFilter.gt, newFilter.gt);
    const gte: IParams = mergerAllFilterPart(FilterType.gte, existingFilter.gte, newFilter.gte);

    // if the filters are all !== null, that means there is no filter contradiction -> set all filters of mergerAllFilter
    // otherwise the mergerAllFilter stays null
    if (normal !== null && lte !== null && lte !== null && gt !== null && gte !== null) {
      mergerAllFilter = {
        normal,
        lt,
        lte,
        gt,
        gte,
      };
    }
  }

  return mergerAllFilter;
}
