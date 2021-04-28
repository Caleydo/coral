import { format } from 'd3-format';
import { select } from 'd3-selection';
import vegaEmbed from 'vega-embed';
import { getCohortLabel } from '../../Cohort';
import { NumRangeOperators } from '../../rest';
import { CohortColorSchema, log } from '../../util';
import { FilterEvent, SplitEvent } from '../../utilCustomEvents';
import { DATA_LABEL } from './constants';
import tippy from 'tippy.js';
export const MISSING_VALUES_LABEL = 'Missing Values';
export class AVegaVisualization {
    constructor(vegaLiteOptions = {}) {
        this.vegaLiteOptions = vegaLiteOptions;
        this.showBrush = true;
        this.colorPalette = CohortColorSchema.COLOR_SCHEME;
        this.options = new Map();
    }
    clearSelection() {
        if (this.vegaView) {
            this.vegaView.signal(AVegaVisualization.SELECTION_SIGNAL_NAME, null);
            this.vegaView.data(AVegaVisualization.SELECTION_STORE, []);
            this.vegaView.runAsync(); // update the charty
        }
    }
    hasSelectedData() {
        const selectionData = this.vegaView.data(AVegaVisualization.SELECTION_STORE);
        return selectionData.length > 0;
    }
    getSpec(data) {
        const vegaLiteSpec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            width: 'container',
            autosize: { type: 'fit', contains: 'padding' },
            padding: { left: 5, top: 0, right: 5, bottom: 0 },
            data: { values: data },
            //mark
            //encoding
            config: {
                axis: {
                    titleFontSize: 16, titleFontWeight: 500, titleFont: 'Yantramanav',
                    labelFontSize: 12, labelLimit: 150, labelFont: 'Yantramanav',
                    labelOverlap: 'parity',
                    labelSeparation: 5,
                    labelBound: true // clip labels if they are not within chart area
                },
                legend: {
                    titleFontSize: 16, titleFontWeight: 500, titleFont: 'Yantramanav',
                    labelFontSize: 12, labelLimit: 150, labelFont: 'Yantramanav',
                    labelOverlap: 'parity'
                },
                header: {
                    titleFontSize: 16, titleFontWeight: 500, titleFont: 'Yantramanav',
                    labelFontSize: 12, labelLimit: 150, labelFont: 'Yantramanav'
                },
                range: {
                    category: this.colorPalette //Cat16.COLOR_SCHEME
                }
            }
        };
        return vegaLiteSpec;
    }
    addHoverSelection(spec) {
        const subspec = spec.layer ? spec.layer[0] : spec;
        if (!subspec.selection) { // create if not existing
            subspec.selection = {};
        }
        Object.assign(subspec.selection, {
            [AVegaVisualization.SELECTION_SIGNAL_NAME]: {
                empty: 'all'
            },
            [AVegaVisualization.HIGHLIGHT_SIGNAL_NAME]: {
                type: 'single',
                empty: 'none',
                on: 'mouseover',
                clear: 'mouseout' // otherwise the hover effect might stay moving the mouse cursor out quickly
            }
        });
    }
    addIntervalSelection(spec) {
        const subspec = spec.layer ? spec.layer[0] : spec;
        if (!subspec.selection) { // create if not existing
            subspec.selection = {};
        }
        const range = this.getFilterRange('x');
        Object.assign(subspec.selection, {
            [AVegaVisualization.SELECTION_SIGNAL_NAME]: {
                type: 'interval',
                mark: { cursor: 'pointer' },
                empty: 'all',
                encodings: ['x'],
                init: range.length > 0 ? { x: range } : {}
            }
        });
        Object.assign(subspec.mark, {
            cursor: 'text' // switch cursor to vertical text above marks
        });
        if (!subspec.view) { // create if not existing
            subspec.view = {};
        }
        Object.assign(subspec.view, {
            cursor: 'text' // switch cursor to vertical text if not above a mark
        });
    }
    setLogScale(spec, axis) {
        const subspec = spec.layer ? spec.layer[0] : spec;
        if (!subspec.encoding[axis].scale) { // create if not existing
            subspec.encoding[axis].scale = {};
        }
        Object.assign(subspec.encoding[axis].scale, { 'type': 'log', 'base': 10 });
    }
    getFilterRange(axis) {
        const range = [];
        if (!select(this.controls).select('input.minimum[data-axis="x"]').empty()) {
            range.push(parseFloat(select(this.controls).select(`input.minimum[data-axis="${axis}"]`).node().value));
            range.push(parseFloat(select(this.controls).select(`input.maximum[data-axis="${axis}"]`).node().value));
        }
        return range;
    }
    addMultiSelection(spec) {
        const subspec = spec.layer ? spec.layer[0] : spec;
        if (!subspec.selection) { // create if not existing
            subspec.selection = {};
        }
        Object.assign(subspec.selection, {
            [AVegaVisualization.SELECTION_SIGNAL_NAME]: {
                type: 'multi',
                toggle: 'true',
                empty: 'all'
            }
        });
        Object.assign(subspec.mark, {
            cursor: 'pointer' // switch cursor to pointer above marks
        });
    }
    addColorLegend() {
        this.legend = document.createElement('p');
        this.legend.classList.add('legend');
        const entries = select(this.legend).selectAll('.entry').data(this.cohorts);
        entries.enter()
            .append('span').classed('entry-wrapper', true)
            .append('span').classed('entry', true)
            .html((d, i) => `<i class="fas fa-square" aria-hidden="true" style="color: ${d.colorTaskView} "></i>&nbsp;${d.label}`);
        this.container.insertAdjacentElement('beforeend', this.legend);
    }
    addNullCheckbox(amount, multipleCohorts) {
        // div container for null value elements
        this.nullValueContainer = document.createElement('div');
        this.nullValueContainer.className = 'null-value-container';
        // null checkbox
        const nullCheckbox = document.createElement('input');
        nullCheckbox.type = 'checkbox';
        nullCheckbox.classList.add('null-value-checkbox');
        this.nullValueContainer.appendChild(nullCheckbox);
        // description text
        const labelNullValue = document.createElement('span');
        labelNullValue.classList.add('null-value-label');
        labelNullValue.innerHTML = multipleCohorts ? `Add <b>missing values</b>` : `Add <b>missing values</b> (${amount})`;
        this.nullValueContainer.appendChild(labelNullValue);
        // add null container to container
        this.controls.getElementsByClassName('applyBtn')[0].insertAdjacentElement('beforebegin', this.nullValueContainer);
    }
    getNullCheckboxState() {
        if (this.nullValueContainer) {
            const checkbox = this.nullValueContainer.querySelector('.null-value-checkbox');
            if (checkbox) {
                return checkbox.checked;
            }
        }
        return false;
    }
    destroy() {
        if (this.vegaView) {
            this.vegaView.finalize();
        }
        select(this.controls).selectAll('input.interval').on('change', null).remove();
        select(this.controls).remove();
        if (this.container) {
            this.container.innerHTML = '';
        }
    }
    getOptions() {
        return Array.from(this.options.keys());
    }
    getDefaultOption() {
        let optKey = localStorage.getItem(`last ${this.constructor.name} option`);
        if (!optKey) {
            const optKeys = this.getOptions();
            if (optKeys.length > 0) {
                optKey = optKeys[0];
            }
        }
        return optKey;
    }
    getOption() {
        return this.currentOption || this.getDefaultOption();
    }
    getOptionSpec() {
        return this.options.get(this.getOption());
    }
    setOption(key) {
        if (this.getOption() === key) {
            return; // noop
        }
        if (this.options.has(key)) {
            this.currentOption = key;
            localStorage.setItem(`last ${this.constructor.name} option`, key);
        }
        else {
            throw new Error('Option does not exist');
        }
        this.showImpl(this.chart, this.data);
    }
    getCategoricalFilter(categories) {
        return { values: categories };
    }
    getNumericalFilterAllInclusive(lower, upper) {
        return this.getGeneralNumericalFilter(lower, upper, NumRangeOperators.gte, NumRangeOperators.lte);
    }
    getStandardNumericalFilter(lower, upper) {
        return this.getGeneralNumericalFilter(lower, upper, NumRangeOperators.gte, NumRangeOperators.lt);
    }
    getGeneralNumericalFilter(lower, upper, lowerOperator = NumRangeOperators.gt, upperOperator = NumRangeOperators.lt) {
        return {
            operatorOne: lowerOperator,
            valueOne: lower === null ? 'null' : lower,
            operatorTwo: upperOperator,
            valueTwo: upper === null ? 'null' : upper
        };
    }
}
AVegaVisualization.SELECTION_SIGNAL_NAME = 'selected';
AVegaVisualization.SELECTION_STORE = AVegaVisualization.SELECTION_SIGNAL_NAME + '_store';
AVegaVisualization.HIGHLIGHT_SIGNAL_NAME = 'highlight';
AVegaVisualization.DATA_STORE_0 = 'data_0';
AVegaVisualization.DATA_STORE_1 = 'data_1';
export class SingleAttributeVisualization extends AVegaVisualization {
    constructor() {
        super(...arguments);
        this.splitValues = [];
        this.vegaBrushListener = (name, value) => this.handleVegaIntervalEvent(name, value);
    }
    async show(container, attributes, cohorts) {
        log.debug('show: ', { container, attributes, cohorts });
        if (cohorts.length <= 0) {
            throw new Error('Pass at least one cohort');
        }
        this.cohorts = cohorts;
        this.attribute = attributes[0];
        const data = await this.getData();
        this.container = container;
        this.container.insertAdjacentHTML(`afterbegin`, `
      <div class="vega-container"></div>
      <div class="controls"></div>
    `);
        this.chart = this.container.getElementsByTagName('div')[0]; //first-child was not the right type of object and vega-embed failed
        this.controls = this.container.getElementsByTagName('div')[1];
        const notZeroCohorts = this.cohorts.filter((a) => {
            const currSize = a.getRetrievedSize();
            return currSize > 0;
        });
        this.colorPalette = notZeroCohorts.map((elem) => elem.colorTaskView);
        // data's outer array has one item per cohort, which in turn contains array with the items/values
        // flatten the array:
        const flatData = data.flat(1);
        // get null values
        const nullValues = flatData.filter((a) => a[this.attribute.dataKey] === null);
        const amountNullValues = nullValues.length;
        this.hideVisualization = flatData.length === amountNullValues;
        this.type = this.attribute.type === `number` ? 'quantitative' : 'nominal';
        if (!flatData || flatData.length === 0) {
            this.chart.innerText = 'No Data';
        }
        else if (this.hideVisualization) {
            this.chart.innerText = 'Data only contains missing values!';
        }
        else {
            this.data = flatData; // save the data that is used in the chart
            await this.showImpl(this.chart, flatData);
        }
        if (this.type === 'quantitative') {
            if (!this.hideVisualization) {
                this.addIntervalControls();
                this.addNullCheckbox(amountNullValues, cohorts.length > 1);
            }
        }
        else {
            this.addCategoricalControls();
        }
        this.addColorLegend();
        this.container.querySelectorAll('[title]').forEach((elem) => tippy(elem, {
            content(elm) {
                const title = elm.getAttribute('title');
                elm.removeAttribute('title');
                return title;
            },
        }));
    }
    async getData() {
        const dataPromises = this.cohorts
            .map((cht, index) => this.attribute.getData(cht.dbId, cht.filters)
            .then((data) => data.map((item) => Object.assign(item, { [DATA_LABEL]: getCohortLabel(index, cht) }))));
        return Promise.all(dataPromises);
    }
    async showImpl(chart, data) {
        const spec = this.getSpec(data); // get spec
        if (this.vegaView) {
            this.vegaView.finalize();
            select(chart).selectAll('*').remove();
            chart.className = '';
        }
        const result = await vegaEmbed(chart, spec, { actions: false, renderer: 'svg' });
        this.vegaLiteSpec = result.spec;
        this.vegaSpec = result.vgSpec;
        this.vegaView = result.view;
        if (this.type === 'quantitative') {
            this.vegaView.addSignalListener(AVegaVisualization.SELECTION_SIGNAL_NAME, this.vegaBrushListener);
        }
        log.debug('vega', this.vegaSpec);
        log.info('vegalite', this.vegaLiteSpec);
        window.dispatchEvent(new Event('resize')); //update vega chart sizes in case the columns became narrower
    }
    getNullValueSelectedData(cohort) {
        let filter = null;
        if (this.getNullCheckboxState()) { // add filter ranges for null value
            filter = {
                from: null,
                to: null,
                cohort
            };
        }
        return filter;
    }
    /**
     * Creates a IFilterDesc for every Cohort.
     * To do so we have to merge the categories or numranges we get for a cohort (multiple object) into one IFilterDesc, which makes this method a lot longer than split()
     * There can only be one IFilterDesc for the same cohort, but this can contain multiple categories, i.e. filter ALL down to a new cohort with all male&female items
     */
    filter() {
        const bins = this.getSelectedData();
        if (bins.length > 0) {
            let filterDesc = [];
            if (bins.length === 1) { // 1 cohort, 1 category
                let filter = [];
                if (this.type === 'quantitative') {
                    filter.push(this.getNumericalFilterAllInclusive(bins[0].from, bins[0].to));
                }
                else {
                    filter = this.getCategoricalFilter([String(bins[0].from)]);
                }
                filterDesc.push({
                    cohort: bins[0].cohort, filter: [{
                            attr: this.attribute, range: filter
                        }]
                });
            }
            else { // 1 cohort, multiple categories, or one category, multiple cohorts
                if (this.attribute.type === 'number') { // n cohorts, one range (can't be more because we use one interval selection)
                    const chtRanges = []; // create a list of chts and their filtered categories
                    for (const bin of bins) {
                        const chtRange = chtRanges.find((elem) => elem.cht.id === bin.cohort.id);
                        if (chtRange !== undefined) { // I handled this cohort before
                            chtRange.ranges.push({ from: bin.from, to: bin.to }); //add range  to exisiting list
                        }
                        else { // new cht, create object and init range array
                            chtRanges.push({ cht: bin.cohort, ranges: [{ from: bin.from, to: bin.to }] });
                        }
                    }
                    // get a filter for the categories per cohort
                    filterDesc = chtRanges.map((elem) => {
                        const filters = [];
                        for (const rg of elem.ranges) {
                            filters.push(this.getNumericalFilterAllInclusive(rg.from, rg.to));
                        }
                        return {
                            cohort: elem.cht,
                            filter: [{
                                    attr: this.attribute,
                                    range: filters
                                }]
                        };
                    });
                }
                else {
                    const chtCats = []; // create a list of chts and their filtered categories
                    for (const bin of bins) {
                        const chtCat = chtCats.find((elem) => elem.cht.id === bin.cohort.id);
                        if (chtCat !== undefined) { // I handled this cohort before
                            chtCat.cats.push(String(bin.from)); //add category to exisiting list
                        }
                        else { // new cht, create object and init category array
                            chtCats.push({ cht: bin.cohort, cats: [String(bin.from)] });
                        }
                    }
                    // get a filter for the categories per cohort
                    filterDesc = chtCats.map((elem) => ({
                        cohort: elem.cht,
                        filter: [{
                                attr: this.attribute,
                                range: this.getCategoricalFilter(elem.cats)
                            }]
                    }));
                }
            }
            log.debug('show filter description: ', filterDesc);
            this.container.dispatchEvent(new FilterEvent(filterDesc));
        }
    }
    /**
     * Creates a IFilterDesc for every Cohort/Category or Cohort/NumRange combination.
     * This means there can be multiple IFilterDesc for the same cohort (different categories, or multiple ranges (5-10, 10-15, and 30-40))
     * Splitting a cohort is only possible by single categories, i.e. you can't split ALL into a "asian/african" and a "white/american indian" cohort ( 2 categories each)
     */
    split() {
        const formatter = format('.4~f');
        let filters;
        if (this.attribute.type === 'number') {
            const [min, max] = this.vegaView.scale('x').domain();
            const bins = this.splitValues.map((splitValue, i) => {
                let from = min;
                if (i >= 1) {
                    from = this.splitValues[i - 1];
                }
                const to = splitValue;
                return { from, to };
            });
            bins.push({ from: this.splitValues[this.splitValues.length - 1] || min, to: max }); // last bin
            if (this.getNullCheckboxState()) {
                bins.push({ from: null, to: null }); // add a null bin if checked
            }
            filters = [];
            for (const cohort of this.cohorts) { //every cohort ...
                for (const bin of bins) { // ...is split into each bin
                    let upperOp = NumRangeOperators.lt;
                    let closingBracket = ')';
                    if (bin.to === max) {
                        upperOp = NumRangeOperators.lte;
                        closingBracket = ']';
                    }
                    filters.push({
                        filter: [{
                                attr: this.attribute,
                                range: [this.getGeneralNumericalFilter(bin.from, bin.to, NumRangeOperators.gte, upperOp)]
                            }],
                        cohort
                    });
                }
            }
        }
        else {
            const bins = this.getSelectedData();
            if (bins.length > 0) {
                filters = bins.map((bin) => ({
                    cohort: bin.cohort,
                    filter: [{
                            attr: this.attribute,
                            range: this.getCategoricalFilter([String(bin.from)])
                        }]
                }));
            }
        }
        if (filters) {
            this.container.dispatchEvent(new SplitEvent(filters));
        }
    }
    addIntervalControls() {
        const [min, max] = this.vegaView.scale('x').domain();
        this.controls.insertAdjacentHTML('afterbegin', `
    <div>
      <!-- Nav tabs -->
      <ul class="nav nav-tabs nav-justified" role="tablist">
        <li role="presentation" class="active"><a href="#filter" aria-controls="filter" role="tab" data-toggle="tab"><i class="fas fa-filter" aria-hidden="true"></i> Filter</a></li>
        <li role="presentation"><a href="#split" aria-controls="split" role="tab" data-toggle="tab"><i class="fas fa-share-alt" aria-hidden="true"></i> Split</a></li>
      </ul>
      <!-- Tab panes -->
      <div class="tab-content">
        <div role="tabpanel" class="tab-pane active" id="filter">
        <p>Click and drag in the visualization or set the range below:</p>
          <div class="flex-wrapper">
            <label>Filter from</label>
            <input type="number" class="interval minimum" step="any" min="${min}" max="${max}" data-axis="x"/>
            <label>to</label>
            <input type="number" class="interval maximum" step="any" min="${min}" max="${max}" data-axis="x"/>
          </div>
        </div>
        <div role="tabpanel" class="tab-pane" id="split">
          <div class="flex-wrapper">
            <label>Split into</label>
            <input type="number" class="bins" step="any" min="1" max="99" value="1"/>
            <label >bins of</label>
            <select>
            <option>equal width</option>
            </select>
          </div>
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-default btn-block applyBtn" title="Apply to get a preview of the output cohorts.">Apply</button>
    `);
        this.container.insertAdjacentElement('beforeend', this.controls);
        select(this.controls).select('button.applyBtn').on('click', () => {
            const activeTask = select(this.controls).select('.tab-pane.active').attr('id');
            switch (activeTask) {
                case 'filter':
                    this.filter();
                    break;
                case 'split':
                    this.split();
                    break;
                default:
                    log.error('Unknown task: ', activeTask);
            }
        });
        select(this.controls).selectAll('a[role="tab"]').on('click', () => {
            const oldTask = select(this.controls).select('.tab-pane.active').attr('id');
            switch (oldTask) {
                case 'filter': // switch to split -> remove interval
                    this.showBrush = false;
                    select(this.chart).selectAll('.mark-rect.role-mark.selected_brush_bg, .mark-rect.role-mark.selected_brush').style('opacity', 0);
                    this.clearSelection();
                    break;
                case 'split': // switch to filter --> remove split rulers
                    this.showBrush = false;
                    select(this.chart).selectAll('.mark-rect.role-mark.selected_brush_bg, .mark-rect.role-mark.selected_brush').style('opacity', 1); // these elements have no opacity set from the spec which makes it safe to revert back to a hardcoded 1
                    this.clearSelection(); // clear any selection that has been made while in split mode
                    select(this.controls).select('input.bins').node().value = '1';
                    select(this.controls).select('input.bins').node().dispatchEvent(new Event('change'));
                    break;
                default:
                    log.error('Unknown task: ', oldTask);
            }
        });
        const that = this; //helper varible to access this instance in the d3 event handler function
        const brushInputs = select(this.controls).selectAll('input.interval');
        brushInputs.on('change', function () {
            const d3Event = this; // because we use a function this is overwritten by d3, asssign to variable for clarity
            that.handleInputIntervalEvent.bind(that)(d3Event); // voodoo magic (👺) to set this back to the current instance
        });
        const splitInput = select(this.controls).select('input.bins');
        splitInput.on('change', function () {
            const d3Event = this; // because we use a function this is overwritten by d3, asssign to variable for clarity
            that.handleBinChangeEvent.bind(that)(d3Event); // voodoo magic (👺) to set this back to the current instance
        });
        this.handleBinChangeEvent(splitInput.node());
    }
    addCategoricalControls() {
        this.controls.insertAdjacentHTML('afterbegin', `
      <p>Select bars with a mouse click. All bars are selected initially.</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5em;">
        <button type="button" class="btn btn-default" title="Click to get a preview of the output cohorts."><i class="fas fa-filter" aria-hidden="true"></i> Filter</button>
        <button type="button" class="btn btn-default" title="Click to get a preview of the output cohorts."><i class="fas fa-share-alt" aria-hidden="true"></i> Split</button>
      </div>
    `);
        this.container.insertAdjacentElement('beforeend', this.controls);
        const visInstance = this;
        select(this.controls).selectAll('button').on('click', function () {
            const button = this;
            const task = button.textContent.toLowerCase();
            if (task.indexOf('filter') >= 0) {
                visInstance.filter();
            }
            else if (task.indexOf('split') >= 0) {
                visInstance.split();
            }
            else {
                log.error('Unknown task: ', task);
            }
        });
    }
    handleBinChangeEvent(event) {
        const binCount = parseFloat(event.value);
        const [min, max] = this.vegaView.scale('x').domain();
        const extent = max - min;
        const binWidth = extent / binCount;
        this.splitValues = [];
        for (let i = 1; i < binCount; i++) {
            const binBorder = min + binWidth * i;
            this.splitValues.push(binBorder);
        }
        this.vegaView.data('splitvalues', this.splitValues.slice()); //set a defensive copy
        this.vegaView.runAsync();
    }
    handleInputIntervalEvent(event) {
        this.vegaView.removeSignalListener(AVegaVisualization.SELECTION_SIGNAL_NAME, this.vegaBrushListener); //remove listener temporarily
        const range = [
            parseFloat(select(this.controls).select('input.minimum').node().value),
            parseFloat(select(this.controls).select('input.maximum').node().value)
        ];
        log.debug('range', range);
        const scaledMin = 0;
        const scaledMax = this.vegaView.width();
        const scaledRange = [scaledMin, scaledMax]; //use min and max as default for range
        const scale = this.vegaView.scale('x');
        // if one or both ranges are set, replace with values
        if (range[0] !== undefined && !isNaN(range[0])) {
            scaledRange[0] = scale(range[0]); // get min value from input
        }
        if (range[1] !== undefined && !isNaN(range[1])) {
            scaledRange[1] = scale(range[1]); // get max value from input
            if (range[0] === range[1]) {
                scaledRange[1] = scale(range[1]) + Math.pow(10, -10); // the 10^(-10) are independent of the attribute domain (i.e. values of 0 to 1 or in millions) because we add it after scaling (its a fraction of a pixel)
            }
        }
        log.debug('scaledRange', scaledRange);
        this.vegaView.signal(AVegaVisualization.SELECTION_SIGNAL_NAME + '_x', scaledRange);
        this.vegaView.runAsync(); // update the chart
        this.vegaView.addSignalListener(AVegaVisualization.SELECTION_SIGNAL_NAME, this.vegaBrushListener); //add listener again
    }
    handleVegaIntervalEvent(name, value) {
        if (value[this.field]) {
            const lowerBound = value[this.field][0];
            const upperBound = value[this.field][1];
            const inputs = select(this.controls).selectAll('input.interval');
            inputs.on('change', null); //remove listeners temporarily
            const formatter = format('.4~f');
            select(this.controls).selectAll('input.minimum').node().value = formatter(lowerBound);
            select(this.controls).selectAll('input.maximum').node().value = formatter(upperBound);
            const that = this; //helper varible to access this instance in the d3 event handler function
            inputs.on('change', function () {
                const d3Event = this; // because we use a function this is overwritten by d3, asssign to variable for clarity
                that.handleInputIntervalEvent.bind(that)(d3Event); // voodoo magic (👺) to set this back to the current instance
            }); //add  listeners again
        }
        else {
            select(this.controls).selectAll('input.minimum').node().value = '';
            select(this.controls).selectAll('input.maximum').node().value = '';
        }
    }
}
//# sourceMappingURL=AVegaVisualization.js.map