import { select } from 'd3-selection';
import * as logger from 'loglevel';
import { NotificationHandler } from 'tdp_core';
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
export const deepCopy = (target) => {
    if (target === null) {
        return target;
    }
    if (target instanceof Date) {
        return new Date(target.getTime());
    }
    if (target instanceof Array) {
        const cp = [];
        target.forEach((v) => { cp.push(v); });
        return cp.map((n) => deepCopy(n));
    }
    if (typeof target === 'object' && target !== {}) {
        const cp = { ...target };
        Object.keys(cp).forEach((k) => {
            cp[k] = deepCopy(cp[k]);
        });
        return cp;
    }
    return target;
};
export function handleDataLoadError(e) {
    let msg = 'Data could not be loaded.';
    if (e instanceof Error && e.message.toUpperCase() === 'UNAUTHORIZED') {
        msg = 'You need to login first.';
    }
    log.error(msg, e);
    NotificationHandler.pushNotification('error', msg, 4000);
}
export function handleDataSaveError(e) {
    let msg = 'Data could not be saved.';
    if (e instanceof Error && e.message.toUpperCase() === 'UNAUTHORIZED') {
        msg = 'You need to login first.';
    }
    log.error(msg, e);
    NotificationHandler.pushNotification('error', msg, 4000);
}
export class ScrollLinker {
    constructor(divA, divB, enabled = true) {
        this.divA = divA;
        this.divB = divB;
        this.enabled = enabled;
        divA.addEventListener('scroll', (e) => this.handleScrollA(e));
        divB.addEventListener('scroll', (e) => this.handleScrollB(e));
    }
    handleScrollA(e) {
        if (!this.isSyncingScrollA && this.enabled) {
            this.isSyncingScrollB = true;
            this.divB.scrollTop = e.target.scrollTop;
        }
        this.isSyncingScrollA = false;
    }
    handleScrollB(e) {
        if (!this.isSyncingScrollB && this.enabled) {
            this.isSyncingScrollA = true;
            this.divA.scrollTop = e.target.scrollTop;
        }
        this.isSyncingScrollB = false;
    }
    enable() {
        this.enabled = true;
        this.divB.scrollTop = this.divA.scrollTop; // sync position
    }
    disable() {
        this.enabled = false;
    }
    destroy() {
        this.divA.removeEventListener('scroll', (e) => this.handleScrollA(e));
        this.divA.removeEventListener('scroll', (e) => this.handleScrollA(e));
        this.divB.addEventListener('scroll', (e) => this.handleScrollB(e));
    }
}
/**
 * Returns true if removed, false if it didn't contain the element
 * @param array array to remove from
 * @param toRemove element to remove
 */
export function removeFromArray(array, toRemove) {
    const index = array.indexOf(toRemove);
    if (index > -1) {
        array.splice(index, 1); //remove one element at <index>
        return true;
    }
    return false;
}
/**
 * Returns true if added to array, false if it already contained the element
 * @param array array to push to
 * @param toPush element to push
 */
export function pushUnique(array, toPush) {
    const index = array.indexOf(toPush);
    if (index === -1) {
        array.push(toPush);
        return true;
    }
    return false;
}
export var SortType;
(function (SortType) {
    SortType["Default"] = "default";
    SortType["Alpha_AZ"] = "alpha_az";
    SortType["Alpha_ZA"] = "alpha_za";
    SortType["Size_19"] = "size_19";
    SortType["Size_91"] = "size_91";
})(SortType || (SortType = {}));
export function getAnimatedLoadingText(thingToLoad = '') {
    const span = document.createElement('p');
    span.classList.add('loading');
    span.innerHTML = `Loading ${thingToLoad} <span class="one">.</span><span class="two">.</span><span class="three">.</span>`;
    return span;
}
const category20 = [
    //Based on Category20: https://vega.github.io/vega/docs/schemes/#category20
    //Saturated
    '#1f77b4', '#2ca02c', '#d62728', '#9467bd', '#8c564b', '#e377c2', '#7f7f7f', '#bcbd22',
    //unsaturated
    '#aec7e8', '#98df8a', '#ff9896', '#c5b0d5', '#c49c94', '#f7b6d2', '#c7c7c7', '#dbdb8d',
];
const tableau20 = [
    //Based on Tableau20: https://vega.github.io/vega/docs/schemes/#tableau20
    //Saturated
    '#4c78a8', '#54a24b', '#e45756', '#79706e', '#d67195', '#b279a2', '#9e765f',
    //unsaturated
    '#9ecae9', '#88d27a', '#ff9d98', '#bab0ac', '#fcbfd2', '#d6a5c9', '#d8b5a5'
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
    '#e6f5c9' /* p2:light green*/,
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
];
const set3 = [
    // based on set3: https://vega.github.io/vega/docs/schemes/#set3
    // -> rearranged and without orange, turquose, and grey
    '#80b1d3' /* set3:blue */, '#fb8072' /* set3:red */, '#b3de69' /* set3:green */, '#bc80bd' /* set3:lila */, '#ffed6f' /* set3:yellow */,
    '#fccde5' /* set3:pink */, '#ccebc5' /* set3:mint */, '#bebada' /* set3:light lila */, '#f1e2cc' /* p2:brown */,
];
const combination = [
    // combination of different set: set3, tableau20, pastel1 & 2
    '#80b1d3' /* set3:blue */, '#fb8072' /* set3:red */,
    '#b3de69' /* set3:green */, '#bc80bd' /* set3:lila */, '#ffed6f' /* set3:yellow */, '#fcbfd2' /* t20:light pink */, '#d8b5a5' /* t20: light brown */,
    '#e6f5c9' /* p2:light green*/, '#decbe4' /* p1:lila */, '#ffffb3' /* set3:light yellow */, '#fddaec' /* p1:pink */, '#f1e2cc' /* p2:brown */,
];
export class CohortColorSchema {
    static get(index) {
        const moduloIndex = index % CohortColorSchema.COLOR_SCHEME.length;
        return CohortColorSchema.COLOR_SCHEME[moduloIndex];
    }
}
CohortColorSchema.COLOR_SCHEME = set3;
export function setSessionStorageItem(key, value) {
    const strValue = JSON.stringify(value);
    sessionStorage.setItem(key, strValue);
}
// returns null if key does not exist
export function getSessionStorageItem(key) {
    const value = sessionStorage.getItem(key);
    return JSON.parse(value);
}
export function selectLast(d3Elem, query) {
    const queryHits = d3Elem.selectAll(query).nodes();
    const queryHitsNo = queryHits.length;
    return select(queryHits[queryHitsNo - 1]);
}
export function inRange(value, interval) {
    const lower = Math.min(...interval), upper = Math.max(...interval);
    return value >= lower && value <= upper;
}
export function hasCookie(cookieID) {
    return document.cookie.split(';')
        .some((item) => item.trim().startsWith(`${cookieID}=`));
}
export function createHTMLElementWithClasses(htmlElem, classes) {
    const element = document.createElement(htmlElem);
    element.classList.add(...classes);
    return element;
}
export class DebugTools {
    static async sleep(millis) {
        log.info('taking a little nap');
        return new Promise((resolve) => setTimeout(resolve, millis));
    }
}
//# sourceMappingURL=util.js.map