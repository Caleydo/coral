import * as aq from 'arquero';
import { format } from 'd3-format';
import * as d3 from 'd3v7';
import * as LineUpJS from 'lineupjs';
import { ERenderMode, renderMissingDOM } from 'lineupjs';
import tippy from 'tippy.js';
import vegaEmbed from 'vega-embed';
import { getCohortLabel } from '../../Cohort';
import { colors } from '../../colors';
import { ServerColumnAttribute } from '../../data/Attribute';
import { getAnimatedLoadingText, getAnimatedText, log } from '../../util';
import { getIdTypeFromCohort } from '../../utilIdTypes';
import { DATA_LABEL } from '../visualizations';
import { ATask } from './ATask';
import { LineUpDistributionColumn } from './Characterize/LineUpDistributionColumn';
import { ProbabilityScatterplot } from './Characterize/ProbabilityScatterplot';
export class Characterize extends ATask {
    constructor() {
        super(...arguments);
        this.label = `Characterize`;
        this.id = `characterize`;
        this.hasOutput = false;
        this.eventID = 0;
        this._entityName = null;
    }
    supports(attributes, cohorts) {
        return cohorts.length >= 2;
    }
    showSearchBar() {
        return false;
    }
    async show(columnHeader, container, attributes, cohorts) {
        const idType = getIdTypeFromCohort(cohorts[0]);
        this._entityName = idType.entityName;
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
        <h1>Cohort Comparison</h1>
        <button class="btn btn-coral compare" id="meta">Compare by <i>Meta-Data</i></button>
        <span>&ensp;</span>
        <button class="btn btn-coral compare" id="mutated">Compare by <i>Mutation Frequency</i></button>
        <span>&emsp;</span>
        <input type="checkbox" id="exclude-attributes" checked> Exclude the cohorts' <span class="hint">defining attributes</span></input>
        <span>&emsp;</span><span>&emsp;</span>


        <!--
        <span>&emsp;</span>
        <label for="max-depth">Max Attributes</label>
        <input type="range" id="max-depth" name="max-depth" min="1" max="100" value="100" oninput="this.nextElementSibling.value = this.value">
        <output for="max-depth">100</output>

        <span>&emsp;</span>
        <label for="min-group-size">Min Group Size</label>
        <input type="range" id="min-group-size" name="min-group-size" min="1" max="100" value="1" oninput="this.nextElementSibling.value = this.value"<>
        <output for="min-group-size">1</output>
        -->
      </div>

      <div class="progress-wrapper hidden-for-result" hidden></div>
      
      <div class="classifier-result resizeable hidden-for-result" hidden>
        <div class="center">
          <h2>Attribute Importance</h2>
          <div style="flex-grow: 1; flex-shrink: 1;"></div>
          <button class="btn btn-coral result-based btn-sm" hidden id="exclude-attr">Exclude Selected Attributes</button>
          <span>&ensp;</span>
          <button class="btn btn-coral result-based btn-sm" hidden id="limit-attr">Limit to Selected Attributes</button>
        </div>
        <h2 class="center">Cohort Differentiation</h2>

        <div class="attribute-ranking"></div>
        <div class="separator-left" style="display: flex; flex-direction: column;">
          <div class="accuracy-container center">
          </div>
          <div class="cohort-confusion">
          </div>
        </div>
      </div>
        

      <h1 class="hidden-for-result" style="border-top: 1px solid ${Characterize.KOKIRI_COLOR}; padding-top: 1em;" hidden>Cohort Characterization</h1>
      <div class="probabilities resizeable hidden-for-result" hidden>
        <h2>Item Predictions</h2>
        <h2 class="center">Cohort Overview</h2>

        <div class="item-ranking">
        </div>
        <div class="chart-container separator-left">
        </div>
      </div>
    `;
        this.$container.querySelectorAll('button.compare').forEach((btn) => btn.addEventListener('click', () => {
            this.attributeRanking?.destroy();
            this.$container.querySelector('.attribute-ranking').innerHTML = Characterize.spinner;
            this.itemRanking?.destroy();
            this.$container.querySelector('.item-ranking').innerHTML = Characterize.spinner;
            this.chart?.forEach((view) => view.finalize());
            this.chart = [];
            this.scatterplot = null;
            this.$container.querySelector('.accuracy-container').innerHTML = Characterize.spinner;
            this.$container.querySelector('.cohort-confusion').innerHTML = ``;
            this.$container.querySelector('.chart-container').innerHTML = Characterize.spinner;
            this.$container.querySelectorAll('.hidden-for-result').forEach((btn) => btn.toggleAttribute('hidden', false));
            this.$container.querySelectorAll('.result-based').forEach((btn) => btn.toggleAttribute('hidden', true));
            this.$container.querySelectorAll('.resizeable').forEach((elem) => elem.classList.remove('filled'));
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
        const maxDepth = 100; // parseInt((this.$container.querySelector('input#max-depth') as HTMLInputElement).value);
        const minGroupSize = 1; //parseInt((this.$container.querySelector('input#min-group-size') as HTMLInputElement).value);
        const url = new URL(`/kokiri/${endpoint}/`, location.href);
        url.protocol = url.protocol.replace('http', 'ws');
        this.ws = new WebSocket(url);
        this.ws.onopen = async () => {
            const data = JSON.stringify({
                exclude: excludeAttributes,
                n_estimators: Characterize.TREES,
                max_depth: maxDepth,
                min_samples_leaf: minGroupSize,
                ids: this.ids,
            });
            try {
                this.ws.send(data);
            }
            catch (e) {
                log.error('error sending data', e);
            }
        };
        let first = true;
        this.ws.onmessage = async (message) => {
            const responseData = JSON.parse(message.data);
            if (responseData.trees) {
                try {
                    this.setProgress(responseData.trees);
                    if (first) {
                        first = false;
                        this.$container.querySelectorAll('.resizeable').forEach((elem) => elem.classList.add('filled'));
                        const showCategoryColumn = endpoint === 'cmp_meta';
                        await this.createAttributeRanking(responseData.importances, showCategoryColumn); // await so its ready for the next response
                        await this.createItemRanking(responseData.probabilities); // await so its ready for the next response
                    }
                    else {
                        this.attributeRankingData?.setData(responseData.importances);
                        this.itemRankingData?.setData(responseData.probabilities);
                    }
                    this.$container.querySelector('.accuracy-container').innerHTML = `
            <h2>Accuracy:  ${Characterize.formatPercent(responseData.accuracy)}</h2>
          `;
                    log.info(`OOB Score ${Characterize.formatPercent(responseData.oobError)} for ${responseData.trees} trees`);
                    this.updateConfusionMatrix(responseData);
                }
                catch (e) {
                    log.error('could not read JSON data', e);
                }
            }
            else if (responseData.embedding) {
                const vegaContainer = this.$container
                    .querySelector('.chart-container');
                vegaContainer.innerHTML = '';
                const embeddingData = responseData.embedding;
                embeddingData.forEach((i) => {
                    i.selected = false;
                    i.cht = this.cohorts[i.cht].label;
                    i.predicted = this.cohorts[i.predicted].label;
                });
                this.scatterplot = new ProbabilityScatterplot(embeddingData, this.cohorts, this.itemRanking);
                const result = await vegaEmbed(vegaContainer, this.scatterplot.getSpec(), { actions: false, renderer: 'canvas' });
                this.scatterplot.setView(result.view);
                this.chart.push(result.view);
                log.debug('embedding', result.spec);
            }
        };
        this.ws.onclose = () => {
            log.debug('the socket is done');
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
        let vegaContainer = this.$container.querySelector('.cohort-confusion');
        let result = await vegaEmbed(vegaContainer, {
            "$schema": "https://vega.github.io/schema/vega-lite/v5.json",
            "data": { "values": confPlotData },
            padding: 20,
            height: { step: 30 },
            width: "container",
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
                        "color": { "field": "predict", legend: null, sort: null },
                        "y": { "field": "target", "title": null, sort: null },
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
        log.debug('confusion', result.spec);
        this.chart.push(result.view);
    }
    async createAttributeRanking(data, showCategoryColumn = true) {
        const builder = LineUpJS.builder(data);
        const categoryCol = LineUpJS.buildStringColumn('category').label('Category').width(200);
        if (!showCategoryColumn) {
            categoryCol.hidden();
        }
        this.$container.querySelector('.attribute-ranking').innerHTML = '';
        this.attributeRanking = builder
            .column(LineUpJS.buildNumberColumn('importance', [0, 1])
            .label('Importance')
            .width(150)
            .colorMapping(colors.barColor)
            .numberFormat('.1%'))
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
            .rowHeight(40)
            .buildTaggle(this.$container.querySelector('.attribute-ranking'));
        this.attributeRankingData = this.attributeRanking.data;
        const children = this.attributeRanking.data.getFirstRanking().children; // alternative: builder.buildData().getFirstRanking(),...
        children[children.length - 1].setFilter({
            filterMissing: true,
            min: 0.005,
            max: Infinity
        });
        this.attributeRanking.on('selectionChanged', (dataIndices) => this.lineUpAttributeSelection(dataIndices));
    }
    lineUpAttributeSelection(dataIndices) {
        this.$container.querySelectorAll('.result-based').forEach((btn) => btn.toggleAttribute('hidden', dataIndices.length === 0));
    }
    async createItemRanking(data) {
        this.$container.querySelector('.item-ranking').innerHTML = '';
        this.itemRanking = LineUpJS.builder(data)
            .column(LineUpJS.buildStringColumn(this._entityName).label('Item Id').width(200))
            .column(LineUpJS.buildCategoricalColumn('cht', this.cohorts.map((cht, i) => ({ name: '' + i, label: cht.label, color: cht.colorTaskView })))
            .label('Cohort')
            .width(Math.min(Math.max(this.cohorts.length * 30, 100), 200))
            .renderer('catheatmap', 'categorical').asSet())
            .column(LineUpJS.buildNumberColumn('probs', [0, 1])
            .label('Cohort Probability')
            .width(150)
            .colorMapping(colors.barColor)
            .numberFormat('.1%')
            .asArray(this.cohorts.map((cht, i) => cht.label)))
            .column(LineUpJS.buildNumberColumn('prob_max', [0, 1]).label('Max Probability').width(120).colorMapping(colors.barColor).numberFormat('.1%'))
            .deriveColors()
            .ranking(LineUpJS.buildRanking().supportTypes().allColumns().sortBy('prob_max', 'asc'))
            .sidePanel(false)
            .buildTaggle(this.$container.querySelector('.item-ranking'));
        this.itemRankingData = this.itemRanking.data;
        this.itemRanking.on('selectionChanged', (dataIndices) => this.lineUpItemSelection(dataIndices));
    }
    lineUpItemSelection(dataIndices) {
        if (this.scatterplot) {
            const selectedItems = dataIndices.map((i) => this.itemRankingData.data[i][this._entityName]);
            const plotData = this.scatterplot.getData();
            for (const [i, item] of plotData.entries()) {
                if (selectedItems.includes(item[this._entityName])) {
                    item.selected = true;
                }
                else {
                    item.selected = false;
                }
            }
            this.scatterplot?.setData(plotData);
        }
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
            this.ws?.close();
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
        this.progressBar.textContent = 'Summarizing Predictions';
        this.progressBar.classList.toggle('progress-bar-animated', true);
        this.progressBar.classList.toggle('progress-bar-striped', true);
        this.$container.querySelector('.chart-container').innerHTML = `<div class="center">${getAnimatedText('Creating Chart').outerHTML}</div>`;
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
}
Characterize.TREES = 500;
Characterize.formatPercent = format('.1~%');
Characterize.spinner = `<div class="fa-3x center green"> <i class="fas fa-spinner fa-pulse"></i></div>`;
Characterize.KOKIRI_COLOR = '#90C08F';
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
          <circle fill="${Characterize.KOKIRI_COLOR}" stroke="none" cx="80" cy="10" r="8">
            <animate attributeName="opacity" dur="2s" values="0;0.5;0" repeatCount="indefinite" begin="0.1" />
          </circle>
          <circle fill="${Characterize.KOKIRI_COLOR}" stroke="none" cx="100" cy="10" r="8">
            <animate attributeName="opacity" dur="2s" values="0;0.5;0" repeatCount="indefinite" begin="0.66" />
          </circle>
          <circle fill="${Characterize.KOKIRI_COLOR}" stroke="none" cx="120" cy="10" r="8">
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
                if (renderMissingDOM(n, col, d)) {
                    return;
                }
                const data = d.v?.distribution;
                if (data && d.v.random === false) {
                    d3.select(n).selectAll('#loading').remove();
                    d3.select(n).select('.xaxis path').attr('stroke', colors.barColor);
                    const chart = d3.select(n).select('#chart g');
                    if (d.v.type === 'cat') {
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
                        log.info(`type of ${d.v.attribute} is  ${d.v.type}, which is not supported`);
                    }
                }
                else {
                    log.debug(`no distribution for ${d.v.attribute}`);
                }
            },
        };
    }
}
MyDistributionRenderer.WIDTH = 200;
MyDistributionRenderer.HEIGHT = 40;
//# sourceMappingURL=Characterize.js.map