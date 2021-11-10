import * as aq from 'arquero';
import { format } from 'd3-format';
import { select } from 'd3-selection';
import tippy from 'tippy.js';
import vegaEmbed from 'vega-embed';
import { getCohortLabel } from '../../Cohort';
import { log, selectLast } from '../../util';
import { AVegaVisualization } from './AVegaVisualization';
import { DATA_LABEL } from './constants';
export class MultiAttributeVisualization extends AVegaVisualization {
    constructor() {
        super(...arguments);
        this.splitValues = [];
        this.splitValuesX = [];
        this.splitValuesY = [];
        this.vegaBrushListener = (name, value) => this.handleVegaIntervalEvent(name, value);
        this.vegaSplitListener = (name, value) => this.handleSplitDragEvent(name, value);
        this.axes = ['x', 'y'];
    }
    async show(container, attributes, cohorts) {
        log.debug('show: ', { container, attributes, cohorts });
        if (attributes.length <= 1) {
            throw new Error('Number of attributes must be at least 2');
        }
        else if (cohorts.length <= 0) {
            throw new Error('Pass at least one cohort');
        }
        this.cohorts = cohorts;
        this.attributes = attributes;
        //Create an array, with on entry per cohort, which contains an array with one entry per attribute, i.e. for 2 cohorts and 2 attributes (A1,A2) we get [[A1, A2], [A1, A2]]
        const dataPromises = cohorts
            .map((cht, chtIndex) => {
            const promise = new Promise(async (resolve, reject) => {
                const chtDataPromises = this.attributes.map((attr) => attr.getData(cht.dbId));
                try {
                    const chtData = await Promise.all(chtDataPromises); // array with one entry per attribute, which contains an array with one value for every item in the cohort
                    let joinedData = aq.from(chtData[0]);
                    for (let i = 1; i < chtData.length; i++) {
                        joinedData = joinedData.join_full(aq.from(chtData[i]));
                    }
                    const labelTable = aq.table({ [DATA_LABEL]: [getCohortLabel(chtIndex, cht)] });
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
        this.container = container;
        this.container.insertAdjacentHTML(`afterbegin`, `
      <div class="vega-container"></div>
      <div class="controls">
        <div class="sticky" style="position: sticky; top: 0;"></div>
      </div>
    `);
        this.chart = this.container.getElementsByTagName('div')[0]; //first-child was not the right type of object and vega-embed failed
        this.controls = this.container.querySelector('.controls .sticky');
        const notZeroCohorts = this.cohorts.filter((a) => {
            const currSize = a.getRetrievedSize();
            return currSize > 0;
        });
        this.colorPalette = notZeroCohorts.map((elem) => elem.colorTaskView);
        // data's outer array has one item per cohort, which in turn contains array with the items/values
        // flatten the array:
        const flatData = data.flat(1);
        // check if all values are null
        this.nullValueMap = new Map(); // Map: Attribute -> Cohort --> number of null values per cohort per attribute
        this.attributes.forEach((attr) => this.nullValueMap.set(attr.dataKey, new Map(this.cohorts.map((cht) => [cht, 0])))); // init map with 0 for all attribues
        let nullValues = 0;
        for (const d of flatData) {
            let nullCounter = 0;
            for (const attr of this.attributes) {
                if (d[attr.dataKey] === null) {
                    const attrData = this.nullValueMap.get(attr.dataKey);
                    const chtLabel = d[DATA_LABEL];
                    const chtIndex = parseInt(chtLabel.substr(0, chtLabel.indexOf('.')), 10);
                    const count = 1 + attrData.get(this.cohorts[chtIndex - 1]);
                    attrData.set(this.cohorts[chtIndex - 1], count);
                    nullCounter++;
                }
            }
            if (nullCounter === this.attributes.length) {
                nullValues++;
            }
        }
        if (!flatData || flatData.length === 0) {
            this.chart.innerText = 'No Data';
        }
        else if (flatData.length === nullValues) {
            this.chart.innerText = 'Data only contains missing values!';
        }
        else {
            this.data = flatData; // save the data that is used in the chart
            await this.showImpl(this.chart, flatData);
            this.addControls();
            this.addColorLegend();
        }
    }
    // may be overwritten (e.g. for tsne plot where the attribtues are different)
    addControls() {
        this.controls.insertAdjacentHTML('afterbegin', `
    <div>
      <!-- Nav tabs -->
      <ul class="nav nav-tabs nav-justified" role="tablist">
        <li role="presentation" class="nav-item"><a class="nav-link active" href="#filter" aria-controls="filter" role="tab" data-bs-toggle="tab"><i class="fas fa-filter" aria-hidden="true"></i> Filter</a></li>
        <li role="presentation" class="nav-item"><a class="nav-link" href="#split" aria-controls="split" role="tab" data-bs-toggle="tab"><i class="fas fa-share-alt" aria-hidden="true"></i> Split</a></li>
      </ul>
      <!-- Tab panes -->
      <div class="tab-content">
        <div role="tabpanel" class="tab-pane active" id="filter">
        <p>Click and drag in the visualization or set the range below:</p>
          <!-- INSERT FILTER CONTROLS HERE -->
        </div>
        <div role="tabpanel" class="tab-pane" id="split">
          <!-- INSERT SPLIT CONTROLS HERE -->
        </div>
      </div>
    </div>
    <div class="d-grid gap-2">
      <button type="button" class="btn btn-coral-prime btn-block applyBtn">Apply</button>
    </div>
    `);
        // for each attribute type, add the respective controls:
        for (const [i, attr] of this.attributes.entries()) {
            if (attr.type === 'number') {
                const axis = i === 0 ? 'x' : 'y';
                this.addIntervalControls(attr, axis);
            }
        }
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
        const that = this; //helper varible to access this instance in the d3 event handler function
        select(this.controls).selectAll('a[role="tab"]').on('click', function () {
            const d3Event = this; // because we use a function this is overwritten by d3, asssign to variable for clarity
            const newTask = d3Event.hash.replace('#', '');
            that.toggleFilterSplitMarks(newTask);
        });
    }
    /**
     * Returns split or filter, depending on the currently active task tab
     */
    getActiveTask() {
        const tabPane = select(this.controls).select('.tab-pane.active');
        if (!tabPane.empty()) {
            return tabPane === null || tabPane === void 0 ? void 0 : tabPane.attr('id');
        }
        return 'filter'; //no task open yet, but we always start with filter
    }
    toggleFilterSplitMarks(newTask) {
        switch (newTask) {
            case 'split': // switch to split -> remove interval
                this.showBrush = false;
                select(this.chart).selectAll('.mark-rect.role-mark.selected_brush_bg, .mark-rect.role-mark.selected_brush, .mark-rect.role-mark.selected_brush_facethelper').style('display', 'none');
                select(this.chart).selectAll('g.splitmarks, g.splitmarks_x, g.splitmarks_y').style('display', null);
                // this.clearSelection();
                break;
            case 'filter': // switch to filter --> remove split rulers
                this.showBrush = true;
                select(this.chart).selectAll('.mark-rect.role-mark.selected_brush_bg, .mark-rect.role-mark.selected_brush, .mark-rect.role-mark.selected_brush_facethelper').style('display', null); // these elements have no opacity set from the spec which makes it safe to revert back to a hardcoded 1
                select(this.chart).selectAll('g.splitmarks, g.splitmarks_x, g.splitmarks_y').style('display', 'none');
                break;
            default:
                log.error('Unknown task: ', newTask);
        }
    }
    addIntervalControls(attribute, axis) {
        var _a, _b;
        const attrKey = (_a = attribute.dataKey) !== null && _a !== void 0 ? _a : attribute;
        const attrLabel = (_b = attribute.label) !== null && _b !== void 0 ? _b : attribute;
        const [min, max] = this.vegaView.scale(axis).domain();
        this.controls.querySelector('#filter').insertAdjacentHTML(`beforeend`, `
    <div class="flex-wrapper" data-attr="${attrKey}">
      <label>Filter ${attrLabel} from</label>
      <input type="number" class="interval minimum" step="any" min="${min}" max="${max}" data-axis="${axis}"/>
      <label>to</label>
      <input type="number" class="interval maximum" step="any" min="${min}" max="${max}" data-axis="${axis}"/>
      <div class="null-value-container form-check">
        <input type="checkbox" id="null_value_checkbox_3" class="null-value-checkbox form-check-input">
        <label class="form-check-label" for="null_value_checkbox_3">Include <span class="hint">missing values</span></label>
      </div>
    </div>
    `);
        this.controls.querySelector('#split').insertAdjacentHTML(`beforeend`, `
    <div class="flex-wrapper" data-attr="${attrKey}">
      <label>Split ${attrLabel} into</label>
      <input type="number" class="bins" step="any" min="1" max="99" value="2" data-axis="${axis}"/>
      <label >bins of</label>
      <select class="binType" data-axis="${axis}">
        <option>equal width</option>
        <option>custom width</option>
      </select>
      <div class="null-value-container form-check">
        <input type="checkbox" class="null-value-checkbox form-check-input" id="null_value_checkbox_4">
        <label class="form-check-label" for"null_value_checkbox_4">Add a <span class="hint">missing values</span> bin</label>
      </div>
    </div>
    `);
        this.addNullCheckbox(attrKey);
        const that = this; //helper varible to access this instance in the d3 event handler function
        const brushInputs = select(this.controls).selectAll(`input.interval[data-axis="${axis}"]`);
        brushInputs.on('change', function () {
            const d3Event = this; // because we use a function "this" is overwritten by d3, asssign to variable for clarity
            that.handleInputIntervalEvent.bind(that)(d3Event); // voodoo magic (👺) to set "this" back to the current instance
        });
        const splitNumberInput = selectLast(select(this.controls), 'input.bins');
        splitNumberInput.on('change', function () {
            const d3Event = this; // because we use a function "this" is overwritten by d3, asssign to variable for clarity
            that.handleBinChangeEvent.bind(that)(d3Event); // voodoo magic (👺) to set "this" back to the current instance
        });
        // handle switching bin Type (i.e. make current draggers equal width)
        const splitTypeInput = select(this.controls).select(`select.binType[data-axis="${axis}"]`);
        splitTypeInput.on('change', function () {
            splitNumberInput.node().dispatchEvent(new Event('change'));
        });
        this.handleBinChangeEvent(splitNumberInput.node());
    }
    addNullCheckbox(attribute) {
        let nullValueTooltip = ``;
        for (const [cht, nullValues] of this.nullValueMap.get(attribute)) {
            nullValueTooltip += `<i class="fas fa-square" aria-hidden="true" style="color: ${cht.colorTaskView} "></i>&nbsp;${nullValues}<br>`;
        }
        const selector = `[data-attr="${attribute}"] .hint`;
        tippy(this.controls.querySelectorAll(selector), { content: nullValueTooltip });
    }
    handleBinChangeEvent(event) {
        this.vegaView.removeDataListener(`splitvalues_${event.dataset.axis}`, this.vegaSplitListener); //remove listener temporarily
        const binCount = parseFloat(event.value);
        const splitValCount = binCount - 1;
        const [min, max] = this.vegaView.scale(event.dataset.axis).domain();
        const extent = max - min;
        const binWidth = extent / binCount;
        const binType = this.controls.querySelector(`#split select.binType[data-axis="${event.dataset.axis}"]`);
        const splitValues = event.dataset.axis === 'x' ? this.splitValuesX : this.splitValuesY;
        if ((binType === null || binType === void 0 ? void 0 : binType.selectedIndex) === 1) { // custom width
            if (splitValues.length > splitValCount) {
                splitValues.sort((a, b) => a - b); //sort em
                splitValues.length = splitValCount; //drop largest split values
            }
            else {
                while (splitValues.length < splitValCount) {
                    splitValues.push(max); // add maximum until there are enough rulers
                }
            }
        }
        else { // equal width
            splitValues.length = 0;
            for (let i = 1; i < binCount; i++) {
                const binBorder = min + binWidth * i;
                splitValues.push(binBorder);
            }
        }
        this.vegaView.data(`splitvalues_${event.dataset.axis}`, splitValues.slice()); //set a defensive copy
        this.vegaView.runAsync().then((vegaView) => //defer adding signallistener until the new data is set internally
         vegaView.addDataListener(`splitvalues_${event.dataset.axis}`, this.vegaSplitListener) //add listener again
        );
    }
    handleInputIntervalEvent(event) {
        for (const axis of this.axes) {
            this.vegaView.removeSignalListener(`${AVegaVisualization.SELECTION_SIGNAL_NAME}_${axis}`, this.vegaBrushListener); //remove listener temporarily
            const range = this.getInterval(axis);
            log.debug('range', range);
            const scaledMin = axis === 'x' ? 0 : this.vegaView.height();
            const scaledMax = axis === 'x' ? this.vegaView.width() : 0; // y has zero in the top and maximum scren cooridinates at the bottom
            const scaledRange = [scaledMin, scaledMax]; //use min and max as default for range
            const scale = this.vegaView.scale(axis);
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
            log.info('scaledRange', scaledRange);
            this.vegaView.signal(`${AVegaVisualization.SELECTION_SIGNAL_NAME}_${axis}`, scaledRange);
            this.vegaView.addSignalListener(`${AVegaVisualization.SELECTION_SIGNAL_NAME}_${axis}`, this.vegaBrushListener); //add listener again
        }
        this.vegaView.runAsync(); // update the chart
    }
    getInterval(axis) {
        const range = [
            parseFloat(select(this.controls).select(`input.minimum[data-axis="${axis}"]`).node().value),
            parseFloat(select(this.controls).select(`input.maximum[data-axis="${axis}"]`).node().value)
        ];
        if (range.some((rangeNum) => rangeNum === undefined || isNaN(rangeNum))) {
            const domain = this.vegaView.scale(axis).domain();
            for (const i in range) {
                if (range[i] === undefined || isNaN(range[i])) {
                    range[i] = domain[i];
                }
            }
        }
        return range;
    }
    handleVegaIntervalEvent(name, interval) {
        log.debug(name, interval);
        const intervalValues = Object.values(interval);
        if (intervalValues.length > 0) {
            for (const [i, attrValues] of intervalValues.entries()) {
                // first attribute is on x,
                // second on y
                const axis = i === 0 ? 'x' : 'y';
                const lowerBound = attrValues[0];
                const upperBound = attrValues[1];
                const inputs = select(this.controls).selectAll(`input.interval[data-axis="${axis}"]`);
                inputs.on('change', null); //remove listeners temporarily
                const formatter = format('.4~f');
                select(this.controls).selectAll(`input.minimum[data-axis="${axis}"]`).node().value = formatter(lowerBound);
                select(this.controls).selectAll(`input.maximum[data-axis="${axis}"]`).node().value = formatter(upperBound);
                //add listener again:
                const that = this; //helper varible to access this instance in the d3 event handler function
                inputs.on('change', function () {
                    const d3Event = this; // because we use a function this is overwritten by d3, asssign to variable for clarity
                    that.handleInputIntervalEvent.bind(that)(d3Event); // voodoo magic (👺) to set this back to the current instance
                });
            }
        }
        else {
            select(this.controls).selectAll(`input.minimum, input.maximum`).nodes().forEach((node) => node.value = '');
        }
    }
    handleSplitDragEvent(name, value) {
        const axis = name.replace('splitvalues_', ''); // e.g., splitvalues_x -> x
        const splitValues = this.vegaView.data(`splitvalues_${axis}`)
            .map((val) => val.data)
            .sort((a, b) => a - b);
        if (axis === 'x') {
            this.splitValuesX = splitValues;
        }
        else {
            this.splitValuesY = splitValues;
        }
        this.controls.querySelector(`#split select.binType[data-axis="${axis}"]`).selectedIndex = 1;
        this.controls.querySelector(`#split input.bins[data-axis="${axis}"]`).value = (1 + splitValues.length).toString();
    }
    // addCategoricalControls() {
    //   this.controls.insertAdjacentHTML('afterbegin', `
    //     <p>Select bars with a mouse click. All bars are selected initially.</p>
    //     <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5em;">
    //       <button type="button" class="btn btn-secondary"><i class="fas fa-filter" aria-hidden="true"></i> Filter</button>
    //       <button type="button" class="btn btn-secondary"><i class="fas fa-share-alt" aria-hidden="true"></i> Split</button>
    //     </div>
    //   `);
    //   this.container.insertAdjacentElement('beforeend', this.controls);
    //   const visInstance = this;
    //   select(this.controls).selectAll('button').on('click', function () {
    //     const button = this as HTMLButtonElement;
    //     const task = button.textContent.toLowerCase();
    //     if (task.indexOf('filter') >= 0) {
    //       visInstance.filter();
    //     } else if (task.indexOf('split') >= 0) {
    //       visInstance.split();
    //     } else {
    //       log.error('Unknown task: ', task);
    //     }
    //   });
    // }
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
        if (this.attributes.some((attr) => attr.type === 'number')) {
            this.vegaView.addSignalListener(AVegaVisualization.SELECTION_SIGNAL_NAME, this.vegaBrushListener);
        }
        log.info('vega', this.vegaSpec);
        log.info('vegalite', this.vegaLiteSpec);
        window.dispatchEvent(new Event('resize')); //update vega chart sizes in case the columns became narrower
    }
    getSelectedData() {
        throw new Error('use getSelectedDatas for multi attribute');
    }
}
//# sourceMappingURL=MultiAttributeVisualization.js.map