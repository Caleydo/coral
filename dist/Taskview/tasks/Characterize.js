import * as aq from 'arquero';
import { format } from 'd3-format';
import * as LineUpJS from 'lineupjs';
import tippy from 'tippy.js';
import vegaEmbed from 'vega-embed';
import { getCohortLabel } from '../../Cohort';
import { colors } from '../../colors';
import { ServerColumnAttribute } from '../../data/Attribute';
import { getAnimatedLoadingText } from '../../util';
import { DATA_LABEL } from '../visualizations';
import { ATask } from './ATask';
export class Characterize extends ATask {
    constructor() {
        super(...arguments);
        this.label = `Characterize`;
        this.id = `characterize`;
        this.hasOutput = false;
        this.eventID = 0;
    }
    supports(attributes, cohorts) {
        return cohorts.length >= 2;
    }
    showSearchBar() {
        return false;
    }
    async show(columnHeader, container, attributes, cohorts) {
        super.show(columnHeader, container, attributes, cohorts);
        const eventId = ++this.eventID; // get new eventID, we will compare it with the field again to see if it is still up to date
        this.cohorts = cohorts;
        if (this.cohorts.length >= 2) {
            this.$container = this.body
                .append('div')
                .classed('characterize-container', true)
                .node();
            this.$container.insertAdjacentElement('beforeend', getAnimatedLoadingText('data'));
            const attrCohort = (this.cohorts[0]);
            attributes = [
                new ServerColumnAttribute(attrCohort.idColumn.column, attrCohort.view, attrCohort.database, attrCohort.idColumn),
            ];
            this.ids = await this.getData(attributes, this.cohorts);
            if (eventId !== this.eventID) {
                return;
            }
            this.createView();
        }
    }
    createView() {
        this.$container.innerHTML = `
      <div class="custom-upset-container"></div>
      <div>
        <h1>Cohort Differences</h1>
        <button class="btn btn-coral" id="meta">Compare by <i>Meta-Data</i></button>
        <button class="btn btn-coral" id="mutated">Compare by <i>AA Mutated</i></button>
        <input type="checkbox" id="exclude-attributes" checked> Exclude the cohorts' <span class="hint">defining attributes</span></input>
        <div class="params">
          <label for="max-depth">Max Attributes</label>
          <input type="range" id="max-depth" name="max-depth" min="1" max="100" value="40" oninput="this.nextElementSibling.value = this.value">
          <output for="max-depth">40</output>

          <span>&emsp;</span>

          <label for="min-group-size">Min Group Size</label>
          <input type="range" id="min-group-size" name="min-group-size" min="1" max="100" value="5" oninput="this.nextElementSibling.value = this.value">
          <output for="min-group-size">5</output>
        </div>
      </div>

      <div class="progress-wrapper"></div>
      <div class="accuracy-container"></div>

      <div class="classifier-result">
        <div class="lineup-container"></div>
        <div class="chart-container"></div>
      </div>
    `;
        this.$container.querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => {
            var _a, _b;
            (_a = this.lineup) === null || _a === void 0 ? void 0 : _a.destroy();
            this.$container.querySelector('.lineup-container').innerHTML = '';
            (_b = this.chart) === null || _b === void 0 ? void 0 : _b.forEach((view) => view.finalize());
            this.chart = [];
            this.$container.querySelector('.chart-container').innerHTML = '';
            this.$container.querySelector('.accuracy-container').innerHTML = '';
            this.addProgressBar();
            this.compare(`cmp_${btn.id}`);
        }));
        this.showOverlap(this.$container.querySelector('div.custom-upset-container'));
        this.setDefiningAttributeTooltip(this.$container.querySelector('.hint'));
    }
    showOverlap(container) {
        container.insertAdjacentHTML('beforeend', `
      <h1 style="display: inline">Overlap of Cohorts</h1>
    `); //in line to display "no overlap" note on the same line
        let localChtCopy = this.cohorts.slice();
        const aqData = this.ids.flat();
        const idsAndTheirCohorts = aq.from(aqData)
            .groupby('tissuename')
            .pivot('Cohort', 'Cohort');
        const intersections = new Map();
        let maxJaccard = 0;
        let i = 0;
        while (localChtCopy.length > 1) {
            const drawCht = localChtCopy.shift();
            for (const [j, remainingCht] of localChtCopy.entries()) {
                const uniqueCohortIds = idsAndTheirCohorts.filter(aq.escape((d) => d[drawCht.label] !== undefined || d[remainingCht.label] !== undefined));
                const uniqueIds = uniqueCohortIds.count().object().count;
                const intersectingItems = uniqueCohortIds // cmp: https://observablehq.com/d/59236004518c5729
                    .filter(aq.escape((d) => d[drawCht.label] !== undefined && d[remainingCht.label] !== undefined))
                    .count() // still a aq table
                    .object().count;
                const jaccardIndex = intersectingItems / uniqueIds;
                const onlyAItems = uniqueCohortIds // cmp: https://observablehq.com/d/59236004518c5729
                    .filter(aq.escape((d) => d[drawCht.label] !== undefined && d[remainingCht.label] === undefined))
                    .count() // still a aq table
                    .object().count;
                const exclusiveInA = onlyAItems / uniqueIds;
                const onlyBItems = uniqueCohortIds // cmp: https://observablehq.com/d/59236004518c5729
                    .filter(aq.escape((d) => d[drawCht.label] === undefined && d[remainingCht.label] !== undefined))
                    .count() // still a aq table
                    .object().count;
                const exclusiveInB = onlyBItems / uniqueIds;
                intersections.set(`${drawCht.id}-${remainingCht.id}`, {
                    intersection: jaccardIndex,
                    exclusiveInA,
                    exclusiveInB
                });
                if (jaccardIndex > maxJaccard) {
                    maxJaccard = jaccardIndex;
                }
            }
            i++;
        }
        let noOverlapCounter = 0;
        if (maxJaccard === 0) { // still zero --> no intersection
            container.insertAdjacentHTML('beforeend', `Cohorts do not overlap.`);
        }
        else {
            const intersectArr = [...intersections]
                .sort((cmp1, cmp2) => cmp2[1].intersection - cmp1[1].intersection); // sort by decreasing overlap
            for (const [chtKey, { intersection, exclusiveInA, exclusiveInB }] of intersectArr) {
                if (intersection > 0) {
                    const [chtA, chtB] = chtKey.split('-');
                    const drawCht = this.cohorts.find((cht) => cht.id === chtA);
                    const remainingCht = this.cohorts.find((cht) => cht.id === chtB);
                    container.insertAdjacentHTML('beforeend', `
            <div style="display: flex;align-items: center; margin: 1em">
              <div class="cht-icon up" style="background-color: ${drawCht.colorTaskView}"></div>
              <div class="cht-icon down left" style="background-color: ${remainingCht.colorTaskView}"></div>
              <div class="cht-overlap">
                <div class="cht-bar" style="width: ${100 * (exclusiveInA + intersection)}%; background: ${drawCht.colorTaskView}"></div>
                <div class="cht-bar" style="width: ${100 * (exclusiveInB + intersection)}%; margin-left: ${100 * (exclusiveInA)}%;background: ${remainingCht.colorTaskView}"></div>
              </div>
              <div class="cht-bar-label">&ensp;${Characterize.jaccardFormat(intersection)}</div>
            </div>
          `);
                }
                else {
                    noOverlapCounter++;
                }
            }
            if (noOverlapCounter > 0) {
                container.insertAdjacentHTML('beforeend', `
        <p class="note" style="margin: 1rem">
          <i class="fa fa-info-circle" style="color: ${colors.barColor}"></i>
          <span>
            ${noOverlapCounter} other cohort combinations have no overlap.
          </span>
        </p>
      `);
            }
        }
    }
    setDefiningAttributeTooltip(hintText) {
        const attributes = [];
        for (const cht of this.cohorts) {
            const bloodline = cht.getBloodline();
            // get all tasks from the bloodline
            // fist task is the one before the cohort
            let tasks = bloodline.filter((elem) => elem.elemType === 'task').map((elem) => elem.obj);
            // reverse order of tasks -> now the first element is the first task after root cohort
            tasks = tasks.reverse();
            tasks.forEach((task) => attributes.push(...task.attributes));
        }
        this.definingAttributes = attributes.filter((attr, i, arr) => arr.findIndex((attr2) => (attr2.id === attr.id)) === i // if there are multiple attributes with the same id, keep the first
        );
        const attributeList = this.definingAttributes
            .map((attr) => attr.label)
            .reduce((text, attr) => text + `<li>${attr}</li>`, '<ol style="margin: 0.25em; padding-right: 1em;">') + '</ol>';
        tippy(hintText, { content: attributeList });
    }
    async compare(endpoint) {
        const excludeChechbox = this.$container.querySelector('input#exclude-attributes');
        const excludeBloodline = excludeChechbox.checked;
        const excludeAttributes = !excludeBloodline ? [] : this.definingAttributes
            .filter((attr) => {
            if (endpoint === 'cmp_meta') {
                return 'serverColumn' in attr;
            }
            else if (endpoint === 'cmp_mutated') {
                return 'gene' in attr;
            }
            return true;
        })
            .map((attr) => 'gene' in attr ? attr.gene : attr.id);
        const maxDepth = parseInt(this.$container.querySelector('input#max-depth').value);
        const minGroupSize = parseInt(this.$container.querySelector('input#min-group-size').value);
        const url = new URL(`/kokiri/${endpoint}/`, location.href);
        url.protocol = url.protocol.replace('http', 'ws');
        console.log('url', url);
        this.ws = new WebSocket(url);
        this.ws.onopen = async () => {
            const data = JSON.stringify({
                exclude: excludeAttributes,
                n_estimators: Characterize.TREES,
                max_depth: maxDepth,
                min_samples_leaf: minGroupSize,
                ids: this.ids,
            });
            console.log('Socket is open');
            try {
                this.ws.send(data);
            }
            catch {
                console.error('error sending data');
            }
            console.log('sent comparison data');
        };
        let first = true;
        this.ws.onmessage = async (message) => {
            console.log('response', message);
            const responseData = JSON.parse(message.data);
            if (responseData.trees) {
                try {
                    console.log(responseData.trees);
                    this.setProgress(responseData.trees);
                    if (first) {
                        const showCategoryColumn = endpoint === 'cmp_meta';
                        await this.createLineUp(responseData.importances, showCategoryColumn); // await so its ready for the next response
                        first = false;
                    }
                    else {
                        this.updateLineUp(responseData.importances);
                    }
                    this.$container.querySelector('.accuracy-container').innerHTML =
                        `
            <h1 style="display: inline">Accuracy:</h1> ${Characterize.jaccardFormat(responseData.accuracy)}
            <h1 style="display: inline">OOB Error:</h1> ${Characterize.jaccardFormat(responseData.oobError)}
          
          `;
                }
                catch (e) {
                    console.error('could not read JSON data', e);
                }
            }
            else if (responseData.embedding) {
                console.log('create plot');
                const vegaContainer = this.$container
                    .querySelector('.chart-container');
                const result = await vegaEmbed(vegaContainer, {
                    "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
                    "title": `${responseData.data} Data Embedding`,
                    "data": {
                        "values": responseData.embedding
                    },
                    "transform": [
                        { "calculate": "'#'+datum.cht", "as": "chts" }
                    ],
                    "width": "container",
                    "height": "container",
                    "mark": { "type": "point" },
                    "encoding": {
                        "x": { "field": "x", "type": "quantitative", axis: null },
                        "y": { "field": "y", "type": "quantitative", axis: null },
                        "color": { "field": "chts", "type": "nominal" },
                        "opacity": { "condition": { "param": "cohort", "value": 0.9 }, "value": 0.01 }
                    },
                    "params": [{
                            "name": "cohort",
                            "select": { "type": "point", "fields": ["chts"] },
                            "bind": "legend"
                        }],
                    config: {
                        range: { category: this.cohorts.map((cht) => cht.colorTaskView) }
                    }
                }, { actions: false, renderer: 'svg' });
                this.chart.push(result.view);
            }
        };
        this.ws.onclose = () => {
            console.log('the socket is done');
            this.setProgressDone();
        };
    }
    async createLineUp(data, showCategoryColumn = true) {
        const builder = LineUpJS.builder(data);
        const categoryCol = LineUpJS.buildStringColumn('category').label('Category').width(200);
        if (!showCategoryColumn) {
            categoryCol.hidden();
        }
        this.lineup = builder
            .column(showCategoryColumn ?
            LineUpJS.buildCategoricalColumn('attribute').label('Attribute').width(200) :
            LineUpJS.buildStringColumn('attribute').label('Attribute').width(200))
            .column(categoryCol)
            .column(LineUpJS.buildNumberColumn('importance', [0, 1]).label('Importance').width(150))
            .deriveColors()
            .ranking(LineUpJS.buildRanking()
            .supportTypes()
            .allColumns()
            .sortBy('Importance', 'desc')
            // .groupBy('Attribute')
            .groupSortBy('Importance', 'desc'))
            .sidePanel(false)
            .buildTaggle(this.$container.querySelector('.lineup-container'));
        this.dataProv = this.lineup.data;
        const children = this.lineup.data.getFirstRanking().children; // alternative: builder.buildData().getFirstRanking(),...
        children[children.length - 1].setFilter({
            filterMissing: true,
            min: 0.001,
            max: Infinity
        });
    }
    updateLineUp(importances) {
        var _a;
        (_a = this.dataProv) === null || _a === void 0 ? void 0 : _a.setData(importances);
    }
    addProgressBar() {
        const wrapper = this.$container.querySelector('.progress-wrapper');
        wrapper.innerHTML = '';
        wrapper.insertAdjacentHTML('beforeend', `
      <div class="progress-ctrl">
        <a class="run" role="button"><i class="fas fa-fw fa-stop-circle"></i></a>
      </div>
      <div  class="progress">
        <div class="progress-bar" role="progressbar">
          0/${Characterize.TREES}
        </div>
      </div>
    `);
        this.progressBar = wrapper.querySelector('.progress .progress-bar');
        wrapper
            .querySelector(('a.run'))
            .addEventListener('click', () => {
            var _a;
            (_a = this.ws) === null || _a === void 0 ? void 0 : _a.close();
            wrapper.querySelector('.progress-ctrl').remove();
            this.progressBar.textContent = 'Stopped';
            this.fadeOutProgressBar();
        });
    }
    setProgress(iteration, done = false) {
        this.progressBar.textContent = `${iteration}/${Characterize.TREES}`;
        this.progressBar.style.width = `${100 * iteration / Characterize.TREES}%`;
        if (iteration === Characterize.TREES) {
            this.setProgressIndefinite();
        }
    }
    setProgressIndefinite() {
        this.progressBar.textContent = 'Summarizing';
        this.progressBar.classList.toggle('progress-bar-animated', true);
        this.progressBar.classList.toggle('progress-bar-striped', true);
    }
    setProgressDone() {
        this.progressBar.textContent = 'Done';
        this.fadeOutProgressBar();
    }
    async fadeOutProgressBar(delay = 2500) {
        return setTimeout(() => {
            const wrapper = this.$container.querySelector('.progress-wrapper');
            wrapper.innerHTML = '';
        }, delay);
    }
    async getData(attributes, cohorts) {
        const dataPromises = cohorts
            .map((cht, chtIndex) => {
            const promise = new Promise(async (resolve, reject) => {
                const chtDataPromises = attributes.map((attr) => attr.getData(cht.dbId));
                try {
                    const chtData = await Promise.all(chtDataPromises); // array with one entry per attribute, which contains an array with one value for every item in the cohort
                    let joinedData = aq.from(chtData[0]);
                    for (let i = 1; i < chtData.length; i++) {
                        joinedData = joinedData.join_full(aq.from(chtData[i]));
                    }
                    const labelTable = aq.table({ [DATA_LABEL]: [getCohortLabel(cht)] });
                    joinedData = joinedData.join_left(labelTable, (data, label) => true);
                    resolve(joinedData.objects());
                }
                catch (e) {
                    reject(e);
                }
            });
            return promise;
        });
        const data = await Promise.all(dataPromises);
        return data;
    }
    // Example POST method implementation:
    async postData(endpoint, data = {}) {
        const url = '/kokiri/' + endpoint + '/';
        // Default options are marked with *
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(data), // body data type must match "Content-Type" header
            //TODO abortController
        });
        return response;
    }
}
Characterize.TREES = 500;
Characterize.jaccardFormat = format('.1~%');
//# sourceMappingURL=Characterize.js.map