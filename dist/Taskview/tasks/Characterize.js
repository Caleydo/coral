import * as aq from 'arquero';
import { format } from 'd3-format';
import * as LineUpJS from 'lineupjs';
import { ERenderMode, renderMissingDOM } from 'lineupjs';
import * as d3 from 'd3v7';
import tippy from 'tippy.js';
import vegaEmbed from 'vega-embed';
import { getCohortLabel } from '../../Cohort';
import { colors } from '../../colors';
import { ServerColumnAttribute } from '../../data/Attribute';
import { getAnimatedLoadingText } from '../../util';
import { DATA_LABEL } from '../visualizations';
import { ATask } from './ATask';
import { LineUpDistributionColumn } from './Characterize/LineUpDistributionColumn';
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
        <span>&emsp;</span>
        <input type="checkbox" id="exclude-attributes" checked> Exclude the cohorts' <span class="hint">defining attributes</span></input>

        <span>&emsp;</span>

        <label for="max-depth">Max Attributes</label>
        <input type="range" id="max-depth" name="max-depth" min="1" max="100" value="100" oninput="this.nextElementSibling.value = this.value">
        <output for="max-depth">100</output>

        <span>&emsp;</span>

        <label for="min-group-size">Min Group Size</label>
        <input type="range" id="min-group-size" name="min-group-size" min="1" max="100" value="1" oninput="this.nextElementSibling.value = this.value"<>
        <output for="min-group-size">1</output>
      </div>

      <div class="progress-wrapper"></div>

      <div class="classifier-result">
        <div class="attribute-ranking"></div>
        <div style="display: flex;flex-direction: column;margin: 1em;">
          <div class="accuracy-container center" style="margin-top: 4em"></div>
          <div class="cohort-confusion"></div>
        </div>
      </div>
      <hr>
      <div class="probabilities">
        <div class="item-ranking">TODO: <i>Items ranked by predicition probability</i></div>
        <div class="chart-container"></div>
      </div>
    `;
        this.$container.querySelectorAll('button').forEach((btn) => btn.addEventListener('click', () => {
            var _a, _b;
            (_a = this.lineup) === null || _a === void 0 ? void 0 : _a.destroy();
            this.$container.querySelector('.attribute-ranking').innerHTML = '';
            (_b = this.chart) === null || _b === void 0 ? void 0 : _b.forEach((view) => view.finalize());
            this.chart = [];
            this.$container.querySelector('.chart-container').innerHTML = '';
            this.$container.querySelector('.accuracy-container').innerHTML = '';
            this.$container.querySelector('.cohort-confusion').innerHTML = '';
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
            <div class="center" style="margin: 1em; justify-content: start;">
              <div class="cht-icon up" style="background-color: ${drawCht.colorTaskView}"></div>
              <div class="cht-icon down left" style="background-color: ${remainingCht.colorTaskView}"></div>
              <div class="cht-overlap">
                <div class="cht-bar" style="width: ${100 * (exclusiveInA + intersection)}%; background: ${drawCht.colorTaskView}"></div>
                <div class="cht-bar" style="width: ${100 * (exclusiveInB + intersection)}%; margin-left: ${100 * (exclusiveInA)}%;background: ${remainingCht.colorTaskView}"></div>
              </div>
              <div class="cht-bar-label">&ensp;${Characterize.formatPercent(intersection)}</div>
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
            const responseData = JSON.parse(message.data);
            console.log('response', responseData);
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
                    this.$container.querySelector('.accuracy-container').innerHTML = ` <h2>Differentiation:  ${Characterize.formatPercent(responseData.oobError)}</h2> `;
                    this.updateConfusionMatrix(responseData);
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
                    "title": `Cohort Certainty`,
                    "data": {
                        "values": responseData.embedding
                    },
                    "transform": [
                        { "calculate": "'#'+datum.cht", "as": "chts" }
                    ],
                    "width": "container",
                    "height": "container",
                    "mark": { "type": "point", "filled": true },
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
                console.log('scatter', result.spec);
            }
        };
        this.ws.onclose = () => {
            console.log('the socket is done');
            this.setProgressDone();
        };
    }
    async updateConfusionMatrix(responseData) {
        // confusionMatrix by Sklearn
        // data structure:
        // Each row of of the confusionMatrix is for one cohort
        // first column of first row: samples of first cohort classified as first cohort
        // 2nd column of first row: samples of first cohort classified as second cohort
        // and so on
        //
        // i.e., sum of first row equals items in first cohort
        //       sum of first column equals items classified as first cohort
        const confPlotData = [];
        for (const [row, target_cht] of this.cohorts.entries()) {
            for (const [column, predicted_cht] of this.cohorts.entries()) {
                const shareOfPredicted = responseData.confusionMatrix[row][column];
                confPlotData.push({
                    target: target_cht.label,
                    predict: predicted_cht.label,
                    correct: row === column,
                    share: shareOfPredicted
                });
            }
        }
        this.$container.querySelector('.cohort-confusion').innerHTML = '';
        let vegaContainer = this.$container.querySelector('.cohort-confusion').insertAdjacentElement('beforeend', document.createElement('div'));
        let result = await vegaEmbed(vegaContainer, {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "data": { "values": confPlotData },
            height: { step: 30 },
            width: 400,
            "encoding": {
                "x": {
                    "field": "share", "type": "quantitative",
                    "title": "Predictions",
                    "stack": true,
                    "axis": { "format": ".1%" }
                }
            },
            "layer": [{
                    "mark": { "type": "bar", "tooltip": true, },
                    "encoding": {
                        "color": { "field": "predict", legend: null },
                        "y": { "field": "target", "title": null },
                        "order": { "field": "share", "type": "quantitative", "sort": "descending" },
                        "opacity": {
                            "condition": { "test": { "field": "correct", "equal": true }, "value": 1 },
                            "value": 0.5
                        }
                    }
                },
                {
                    "data": { "values": [{ "val": 1 }] },
                    "mark": { "type": "rule", "strokeDash": [2] },
                    "encoding": {
                        "x": { "field": "val" }
                    }
                }
            ],
            config: {
                range: { category: this.cohorts.map((cht) => cht.colorTaskView) }
            }
        }, { actions: false, renderer: 'svg' });
        // this.chart.push(result.view);
        console.log('conf', result.spec);
    }
    async createLineUp(data, showCategoryColumn = true) {
        const builder = LineUpJS.builder(data);
        const categoryCol = LineUpJS.buildStringColumn('category').label('Category').width(200);
        if (!showCategoryColumn) {
            categoryCol.hidden();
        }
        this.lineup = builder
            .column(LineUpJS.buildNumberColumn('importance', [0, 1])
            .label('Importance')
            .width(150)
            .colorMapping(colors.barColor)
            .numberFormat('.3f'))
            .column(showCategoryColumn ?
            LineUpJS.buildCategoricalColumn('attribute').label('Attribute').width(150) :
            LineUpJS.buildStringColumn('attribute').label('Attribute').width(200))
            .column(categoryCol)
            .column(LineUpJS.buildColumn("myDistributionColumn", 'distribution').label('Distribution')
            .renderer("myDistributionRenderer", "myDistributionRenderer").width(200).build([]))
            .registerRenderer("myDistributionRenderer", new MyDistributionRenderer(this.cohorts))
            .registerColumnType("myDistributionColumn", LineUpDistributionColumn)
            .deriveColors()
            .ranking(LineUpJS.buildRanking()
            .supportTypes()
            .allColumns()
            .sortBy('Importance', 'desc')
            // .groupBy('Attribute')
            .groupSortBy('Importance', 'desc'))
            .sidePanel(false)
            .rowHeight(50)
            .buildTaggle(this.$container.querySelector('.attribute-ranking'));
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
Characterize.TREES = 300;
Characterize.formatPercent = format('.1~%');
export class MyDistributionRenderer {
    constructor(cohorts) {
        this.cohorts = cohorts;
        this.title = "Distribution Chart";
    }
    canRender(col, mode) {
        return mode === ERenderMode.CELL;
    }
    create(col) {
        return {
            template: `<div class="svg-container center" style="flex-direction: column;">
        <svg id="loading" width="${MyDistributionRenderer.WIDTH}" height="${MyDistributionRenderer.HEIGHT}" viewBox="0 0 ${MyDistributionRenderer.WIDTH} ${MyDistributionRenderer.HEIGHT}" enable-background="new 0 0 0 0">
          <circle fill="${colors.barColor}" stroke="none" cx="80" cy="10" r="8">
            <animate attributeName="opacity" dur="2s" values="0;0.5;0" repeatCount="indefinite" begin="0.1" />
          </circle>
          <circle fill="${colors.barColor}" stroke="none" cx="100" cy="10" r="8">
            <animate attributeName="opacity" dur="2s" values="0;0.5;0" repeatCount="indefinite" begin="0.66" />
          </circle>
          <circle fill="${colors.barColor}" stroke="none" cx="120" cy="10" r="8">
            <animate attributeName="opacity" dur="2s" values="0;0.5;0" repeatCount="indefinite" begin="1.33" />
          </circle>
        </svg>
        <svg id="chart" width="${MyDistributionRenderer.WIDTH}" height="${MyDistributionRenderer.HEIGHT}" viewBox="0 0 ${MyDistributionRenderer.WIDTH} ${MyDistributionRenderer.HEIGHT}" enable-background="new 0 0 0 0">
          <g>
            <!-- filled by update function -->
          </g>

          <g class="xaxis" transform="translate(0,${MyDistributionRenderer.HEIGHT})" fill="none" font-size="10" font-family="sans-serif" text-anchor="middle">
            <path class="domain" stroke="#fff" d="M0,0 H${MyDistributionRenderer.WIDTH}"></path>
          </g>
        </svg>
      </div>`,
            update: (n, d) => {
                var _a;
                if (renderMissingDOM(n, col, d)) {
                    return;
                }
                const data = (_a = d.v) === null || _a === void 0 ? void 0 : _a.distribution;
                if (data && d.v.random === false) {
                    d3.select(n).selectAll('#loading').remove();
                    d3.select(n).select('.xaxis path').attr('stroke', colors.barColor);
                    const chart = d3.select(n).select('#chart g');
                    if (d.v.type === 'cat') {
                        console.log(`OK: ${d.v.attribute}`);
                        // X axis
                        var x = d3.scaleBand()
                            .range([0, MyDistributionRenderer.WIDTH])
                            .domain(data.map(function (d) { return d.cht; }))
                            .padding(0.2);
                        // Add Y axis
                        var y = d3.scaleLinear()
                            .domain([0, 1])
                            .range([MyDistributionRenderer.HEIGHT, 0]);
                        // Bars
                        chart.selectAll("rect")
                            .data(data)
                            .enter()
                            .append("rect")
                            .attr("x", (d) => x(d.cht))
                            .attr("y", (d) => y(d.value))
                            .attr("width", x.bandwidth())
                            .attr("height", function (d) { return MyDistributionRenderer.HEIGHT - y(d.value); })
                            .attr("fill", (d, i) => this.cohorts[i].colorTaskView)
                            .exit().remove();
                    }
                    else {
                        console.log(`type of ${d.v.attribute} is  ${d.v.type}`);
                    }
                }
                else {
                    console.log(`${d.v.attribute} is random`);
                }
            },
        };
    }
}
MyDistributionRenderer.WIDTH = 200;
MyDistributionRenderer.HEIGHT = 40;
//# sourceMappingURL=Characterize.js.map