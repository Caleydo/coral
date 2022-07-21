import {format, select} from 'd3v7';
import {cloneDeep} from 'lodash';
import tippy from 'tippy.js';
import {View as VegaView} from 'vega';
import vegaEmbed from 'vega-embed';
import {TopLevelSpec as VegaLiteSpec} from 'vega-lite';
import {Cohort, getCohortLabel} from '../../Cohort';
import {ICohort} from '../../CohortInterfaces';
import {IAttribute, IdValuePair} from '../../data/Attribute';
import {IEqualsList, INumRange, NumRangeOperators} from '../../rest';
import {CohortColorSchema, IFilterDesc, log} from '../../util';
import {FilterEvent, SplitEvent} from '../../utilCustomEvents';
import {Option, VisConfig} from './config/VisConfig';
import {DATA_LABEL} from './constants';
import {IVisualization} from './IVisualization';

export const MISSING_VALUES_LABEL = 'Missing Values';
export const FACETED_CHARTS_WIDTH = 520;
export interface IVegaVisualization extends IVisualization {
  getSpec(gdata: IdValuePair[]): Partial<VegaLiteSpec>; //any for now
  showImpl(chart: HTMLDivElement, data: Array<IdValuePair>);
}

export abstract class AVegaVisualization implements IVegaVisualization {
  static readonly NAME: string;

  static readonly SELECTION_SIGNAL_NAME = 'selected';
  static readonly SELECTION_STORE = AVegaVisualization.SELECTION_SIGNAL_NAME + '_store';
  static readonly HIGHLIGHT_SIGNAL_NAME = 'highlight';
  static readonly DATA_STORE_0 = 'data_0';
  static readonly DATA_STORE_1 = 'data_1';
  static readonly DATA_STORE_3 = 'data_3';
  static readonly SPLITVALUE_DATA_STORE = 'splitvalues';

  protected container: HTMLDivElement;
  protected chart: HTMLDivElement;
  protected controls: HTMLDivElement;
  protected legend: HTMLParagraphElement;
  protected nullValueContainer: HTMLDivElement;
  protected data;
  protected cohorts: Cohort[];

  protected vegaLiteSpec;
  protected vegaSpec;
  protected vegaView: VegaView;

  protected showBrush: boolean = true;

  protected colorPalette = CohortColorSchema.COLOR_SCHEME;

  protected config: VisConfig[] = [];

  constructor(protected vegaLiteOptions: Object = {}) {
  }

  clearSelection() {
    if (this.vegaView) {
      this.vegaView.signal(AVegaVisualization.SELECTION_SIGNAL_NAME, null);
      this.vegaView.data(AVegaVisualization.SELECTION_STORE, []);
      this.vegaView.runAsync(); // update the charty
    }
  }

  hasSelectedData() {
    const selectionData: any[] = this.vegaView.data(AVegaVisualization.SELECTION_STORE);
    return selectionData.length > 0;
  }

  getSpec(data: IdValuePair[]): Partial<VegaLiteSpec> {
    const vegaLiteSpec: Partial<VegaLiteSpec> = {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 'container', //responsive width
      autosize: {type: 'fit', contains: 'padding'},
      padding: {left: 5, top: 0, right: 5, bottom: 5},
      data: {values: data},
      //mark
      //encoding
      config: {
        axis: {
          titleFontSize: 16, titleFontWeight: 500, titleFont: 'Roboto',
          labelFontSize: 12, labelLimit: 150, labelFont: 'Roboto',
          labelOverlap: 'parity', // hide if labels overlap
          labelSeparation: 5,
          labelBound: true // clip labels if they are not within chart area
        },
        legend: {
          titleFontSize: 16, titleFontWeight: 500, titleFont: 'Roboto',
          labelFontSize: 12, labelLimit: 150, labelFont: 'Roboto',
          labelOverlap: 'parity'
        },
        header: {
          titleFontSize: 16, titleFontWeight: 500, titleFont: 'Roboto',
          labelFontSize: 12, labelLimit: 150, labelFont: 'Roboto'
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

    if (!subspec.params) { // create if not existing
      subspec.params = [];
    }

    subspec.params.push({
      name: AVegaVisualization.HIGHLIGHT_SIGNAL_NAME,
      select: {
        type: 'point',
        toggle: false,
        on: 'mouseover',
        clear: 'mouseout' // otherwise the hover effect might stay moving the mouse cursor out quickly
      }
    });
  }

  addIntervalSelection(spec) {
    const subspec = spec.layer ? spec.layer[0] : spec;
    if (!subspec.params) { // create if not existing
      subspec.params = [];
    }

    const range = this.getFilterRange('x');

    subspec.params.push({
      name: AVegaVisualization.SELECTION_SIGNAL_NAME,
      select: {
        type: 'interval',
        mark: {cursor: 'pointer'},
        encodings: ['x'],
      },
      ...(range.length > 0 ? {value: {x: range}} : {})
    });

    Object.assign(subspec.mark, {
      cursor: 'text' // switch cursor to vertical text above marks
    });

    if (!subspec.view) { // create if not existing
      subspec.view = {};
    }
    Object.assign(subspec.view, {
      cursor: 'text'  // switch cursor to vertical text if not above a mark
    });
  }

  public setLogScale(spec, axis: 'x' | 'y') {
    const subspec = spec.layer ? spec.layer[0] : spec;
    if (!subspec.encoding[axis].scale) { // create if not existing
      subspec.encoding[axis].scale = {};
    }

    Object.assign(subspec.encoding[axis].scale, {'type': 'log', 'base': 10});
  }

  public getFilterRange(axis: 'x' | 'y') {
    const range = [];
    if (!select(this.controls).select('input.minimum[data-axis="x"]').empty()) {
      range.push(parseFloat((select(this.controls).select(`input.minimum[data-axis="${axis}"]`).node() as HTMLInputElement).value));
      range.push(parseFloat((select(this.controls).select(`input.maximum[data-axis="${axis}"]`).node() as HTMLInputElement).value));
    }
    return range;
  }

  addMultiSelection(spec) {
    const subspec = spec.layer ? spec.layer[0] : spec;
    if (!subspec.params) { // create if not existing
      subspec.params = [];
    }

    subspec.params.push({
      name: AVegaVisualization.SELECTION_SIGNAL_NAME,
      select: {
        type: 'point',
        toggle: 'true'
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

  getNullCheckboxState(attribute: IAttribute): boolean {
    const activeTask = select(this.controls).select('.tab-pane.active').attr('id');
    const checkbox = this.controls.querySelector(`#${activeTask} [data-attr="${attribute.dataKey}"] .null-value-checkbox`) as HTMLInputElement;
    if (checkbox) {
      return checkbox.checked;
    }
    return false;
  }

  abstract getSelectedData(): {from: string | number; to: string | number; cohort: ICohort}[];
  abstract show(container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]);
  abstract filter(): void;
  abstract split(): void;
  abstract showImpl(chart: HTMLDivElement, data: Array<IdValuePair>); //probably the method impl from SingleAttributeVisualization can be moved here


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

  getConfig() {
    return this.config;
  }

  selectOption(o: Option) {
    o.group.select(o);
    this.showImpl(this.chart, this.data);
  }

  getCategoricalFilter(categories: string[]): IEqualsList {
    return {values: categories};
  }

  getNumericalFilterAllInclusive(lower: number, upper: number): INumRange {
    return this.getGeneralNumericalFilter(lower, upper, NumRangeOperators.gte, NumRangeOperators.lte);
  }

  getStandardNumericalFilter(lower: number, upper: number): INumRange {
    return this.getGeneralNumericalFilter(lower, upper, NumRangeOperators.gte, NumRangeOperators.lt);
  }

  getGeneralNumericalFilter(lower: number, upper: number, lowerOperator: NumRangeOperators = NumRangeOperators.gt, upperOperator: NumRangeOperators = NumRangeOperators.lt): INumRange {
    return {
      operatorOne: lowerOperator,
      valueOne: lower === null ? 'null' : lower,
      operatorTwo: upperOperator,
      valueTwo: upper === null ? 'null' : upper
    };
  }
}


export abstract class SingleAttributeVisualization extends AVegaVisualization {
  protected type: 'quantitative' | 'nominal' | 'ordinal';
  /**
   * The displayed attribute
   */
  protected attribute: IAttribute;
  /**
   * Vega name of the displayed attribute, might be different to attribute.dataKey due to transformation (e.g. density transform)
   */
  protected field: string;

  protected colorPalette: string[];
  protected hideVisualization: boolean;
  protected nullValueMap: Map<string, Map<Cohort, number>>;

  async show(container: HTMLDivElement, attributes: IAttribute[], cohorts: Cohort[]) {
    log.debug('show: ', {container, attributes, cohorts});

    if (cohorts.length <= 0) {
      throw new Error('Pass at least one cohort');
    }

    this.cohorts = cohorts;
    this.attribute = attributes[0];

    const data = await this.getData();

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
    this.nullValueMap = new Map<string, Map<Cohort, number>>(); // Map: Attribute -> Cohort --> number of null values per cohort per attribute
    this.nullValueMap.set(this.attribute.dataKey, new Map(this.cohorts.map((cht) => [cht, 0]))); // init map with 0 for all attribues

    let nullValues = 0;
    for (const d of flatData) {
      if (d[this.attribute.dataKey] === null) {
        const attrData = this.nullValueMap.get(this.attribute.dataKey);
        const chtLabel = d[DATA_LABEL];
        const chtIndex = this.cohorts.findIndex((cht) => cht.label === chtLabel);
        const count = 1 + attrData.get(this.cohorts[chtIndex]);
        attrData.set(this.cohorts[chtIndex], count);
        nullValues++;
      }
    }
    this.hideVisualization = nullValues === flatData.length;

    this.type = this.attribute.type === `number` ? 'quantitative' : 'nominal';

    if (!flatData || flatData.length === 0) {
      this.chart.innerText = 'No Data';
    } else if (this.hideVisualization) {
      this.chart.innerText = 'Data only contains missing values!';
    } else {
      this.data = flatData; // save the data that is used in the chart
      await this.showImpl(this.chart, flatData);
    }

    if (!this.hideVisualization) {
      if (this.type === 'quantitative') {
        this.addIntervalControls();
      } else {
        this.addCategoricalControls();
      }
      this.addColorLegend();
    }
    this.container.querySelectorAll('[title]').forEach((elem) => tippy(elem, {
      content(elm) { // build tippy tooltips from the title attribute
        const title = elm.getAttribute('title');
        elm.removeAttribute('title');
        return title;
      },
    }));
  }

  async getData() {
    const dataPromises = this.cohorts
      .map((cht) =>
        this.attribute.getData(cht.dbId, cht.filters)
          .then((data) =>
            data.map((item) =>
              Object.assign(item, {[DATA_LABEL]: getCohortLabel(cht)})
            )
          )
      );
    return Promise.all(dataPromises);
  }

  async showImpl(chart: HTMLDivElement, data: Array<IdValuePair>) {
    const spec = this.getSpec(data) as VegaLiteSpec; // get spec
    if (this.vegaView) {
      this.vegaView.finalize();
      select(chart).selectAll('*').remove();
      chart.className = '';
    }

    const result = await vegaEmbed(chart, spec, {actions: false, renderer: 'svg'});

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

  getNullValueSelectedData(cohort: ICohort, attribute: IAttribute): {from: string | number; to: string | number; cohort: ICohort} {
    let filter: {from: string | number; to: string | number; cohort: ICohort} = null;
    if (this.getNullCheckboxState(attribute)) { // add filter ranges for null value
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
      let filterDesc: IFilterDesc[] = [];
      if (bins.length === 1) {  // 1 cohort, 1 category
        let filter: INumRange[] | IEqualsList = [];

        if (this.type === 'quantitative') {
          filter.push(this.getNumericalFilterAllInclusive(bins[0].from as number, bins[0].to as number));
        } else {
          filter = this.getCategoricalFilter([String(bins[0].from)]);
        }
        filterDesc.push({
          cohort: bins[0].cohort, filter: [{
            attr: this.attribute, range: filter
          }]
        });
      } else { // 1 cohort, multiple categories, or one category, multiple cohorts
        if (this.attribute.type === 'number') { // n cohorts, one range (can't be more because we use one interval selection)
          const chtRanges: {cht: ICohort, ranges: {from: number; to: number}[]}[] = []; // create a list of chts and their filtered categories
          for (const bin of bins) {
            const chtRange = chtRanges.find((elem) => elem.cht.id === bin.cohort.id);
            if (chtRange !== undefined) { // I handled this cohort before
              chtRange.ranges.push({from: bin.from as number, to: bin.to as number}); //add range  to exisiting list
            } else { // new cht, create object and init range array
              chtRanges.push({cht: bin.cohort, ranges: [{from: bin.from as number, to: bin.to as number}]});
            }
          }
          // get a filter for the categories per cohort
          filterDesc = chtRanges.map((elem) => {
            const filters = [];
            for (const rg of elem.ranges) {
              filters.push(this.getNumericalFilterAllInclusive(rg.from as number, rg.to as number));
            }
            return {
              cohort: elem.cht,
              filter: [{
                attr: this.attribute,
                range: filters
              }]
            };
          });
        } else {
          const chtCats: {cht: ICohort, cats: string[]}[] = []; // create a list of chts and their filtered categories
          for (const bin of bins) {
            const chtCat = chtCats.find((elem) => elem.cht.id === bin.cohort.id);
            if (chtCat !== undefined) { // I handled this cohort before
              chtCat.cats.push(String(bin.from)); //add category to exisiting list
            } else { // new cht, create object and init category array
              chtCats.push({cht: bin.cohort, cats: [String(bin.from)]});
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
    let filters: IFilterDesc[];
    if (this.attribute.type === 'number') {
      const [min, max] = this.vegaView.scale('x').domain();
      const bins = this.splitValues.map((splitValue, i) => {
        let from = min;
        if (i >= 1) {
          from = this.splitValues[i - 1].x;
        }
        const to = splitValue.x;
        return {from, to};
      });
      bins.push({from: this.splitValues[this.splitValues.length - 1]?.x || min, to: max}); // last bin

      if (this.getNullCheckboxState(this.attribute)) {
        bins.push({from: null, to: null}); // add a null bin if checked
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
              range: [this.getGeneralNumericalFilter(bin.from as number, bin.to as number, NumRangeOperators.gte, upperOp)]
            }],
            cohort
          });
        }
      }
    } else {
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

  protected splitValues: Array<{x: number}> = [];

  addIntervalControls() {
    const [min, max] = this.vegaView.scale('x').domain();

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
          <div class="flex-wrapper" data-attr="${this.attribute.dataKey}">
            <label>Filter from</label>
            <input type="number" class="interval minimum" step="any" min="${min}" max="${max}" data-axis="x"/>
            <label>to</label>
            <input type="number" class="interval maximum" step="any" min="${min}" max="${max}" data-axis="x"/>
            <div class="null-value-container form-check">
              <input type="checkbox" class="null-value-checkbox form-check-input" id="null_value_checkbox_1">
              <label class="form-check-label" for="null_value_checkbox_1">Include <span class="hint">missing values</span></label>
            </div>
          </div>
        </div>
        <div role="tabpanel" class="tab-pane" id="split">
          <div class="flex-wrapper" data-attr="${this.attribute.dataKey}">
            <label>Split into</label>
            <input type="number" class="bins" step="any" min="1" max="99" value="2"/>
            <label >bins of</label>
            <select class="binType">
              <option>equal width</option>
              <option>custom width</option>
            </select>
            <div class="null-value-container form-check">
              <input type="checkbox" class="null-value-checkbox form-check-input" id="null_value_checkbox_2">
              <label class="form-check-label" for="null_value_checkbox_2">Add a <span class="hint">missing values</span> bin</label>
            </div>
          </div>
        </div>
      </div>
    </div>
    <div class="d-grid gap-2">
      <button type="button" class="btn applyBtn btn-coral-prime" title="Apply to get a preview of the output cohorts.">Apply</button>
    </div>
    `);
    let nullValueTooltip = ``;
    for (const [cht, nullValues] of this.nullValueMap.get(this.attribute.dataKey)) {
      nullValueTooltip += `<i class="fas fa-square" aria-hidden="true" style="color: ${cht.colorTaskView} "></i>&nbsp;${nullValues}<br>`;
    }
    const selector = `[data-attr="${this.attribute.dataKey}"] .hint`;
    tippy(this.controls.querySelectorAll(selector), {content: nullValueTooltip});

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
      const newTask = (d3Event as HTMLAnchorElement).hash.replace('#', '') as 'filter' | 'split';
      that.toggleFilterSplitMarks(newTask);
    });

    const brushInputs = select(this.controls).selectAll('input.interval');
    brushInputs.on('change', function () {
      const d3Event = this; // because we use a function this is overwritten by d3, asssign to variable for clarity
      that.handleInputIntervalEvent.bind(that)(d3Event); // voodoo magic (👺) to set this back to the current instance
    });

    const splitNumberInput = select(this.controls).select('input.bins');
    splitNumberInput.on('change', function () {
      const d3Event = this; // because we use a function this is overwritten by d3, asssign to variable for clarity
      that.handleBinChangeEvent.bind(that)(d3Event); // voodoo magic (👺) to set this back to the current instance
    });
    const splitTypeInput = select(this.controls).select('select.binType');
    splitTypeInput.on('change', function () {
      (splitNumberInput.node() as HTMLElement).dispatchEvent(new Event('change'));
    });
    this.handleBinChangeEvent(splitNumberInput.node());
  }

  /**
   * Returns split or filter, depending on the currently active task tab
   */
  protected getActiveTask(): 'filter' | 'split' {
    const tabPane = select(this.controls).select('.tab-pane.active');
    if (!tabPane.empty()) {
      return tabPane?.attr('id') as 'filter' | 'split';
    }

    return 'filter'; //no task open yet, but we always start with filter
  }

  protected toggleFilterSplitMarks(newTask: 'filter' | 'split') {
    switch (newTask) {
      case 'split': // switch to split -> remove interval
        this.showBrush = false;
        select(this.chart).selectAll('.mark-rect.role-mark.selected_brush_bg, .mark-rect.role-mark.selected_brush').style('display', 'none');
        select(this.chart).selectAll('g.splitmarks').style('display', null);
        // this.clearSelection();
        break;
      case 'filter': // switch to filter --> remove split rulers
        this.showBrush = true;
        select(this.chart).selectAll('.mark-rect.role-mark.selected_brush_bg, .mark-rect.role-mark.selected_brush').style('display', null); // these elements have no opacity set from the spec which makes it safe to revert back to a hardcoded 1
        select(this.chart).selectAll('g.splitmarks').style('display', 'none');
        // this.clearSelection(); // clear any selection that has been made while in split mode
        // (select(this.controls).select('input.bins').node() as HTMLInputElement).value = '1';
        // (select(this.controls).select('input.bins').node() as HTMLInputElement).dispatchEvent(new Event('change'));
        break;
      default:
        log.error('Unknown task: ', newTask);
    }
  }

  addCategoricalControls() {
    this.controls.insertAdjacentHTML('afterbegin', `
      <p>Select bars with a mouse click. All bars are selected initially.</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5em;">
        <button type="button" class="btn btn-coral-prime" title="Click to get a preview of the output cohorts."><i class="fas fa-filter" aria-hidden="true"></i> Filter</button>
        <button type="button" class="btn btn-coral-prime" title="Click to get a preview of the output cohorts."><i class="fas fa-share-alt" aria-hidden="true"></i> Split</button>
      </div>
    `);

    const visInstance = this;
    select(this.controls).selectAll('button').on('click', function () {
      const button = this as HTMLButtonElement;
      const task = button.textContent.toLowerCase();
      if (task.indexOf('filter') >= 0) {
        visInstance.filter();
      } else if (task.indexOf('split') >= 0) {
        visInstance.split();
      } else {
        log.error('Unknown task: ', task);
      }
    });
  }

  handleBinChangeEvent(event) {
    this.vegaView.removeDataListener(AVegaVisualization.SPLITVALUE_DATA_STORE, this.vegaSplitListener); //remove listener temporarily

    const binCount = parseFloat(event.value);
    const splitValCount = binCount - 1;
    const [min, max] = this.vegaView.scale('x').domain();
    const extent = max - min;
    const binWidth = extent / binCount;

    const binType = this.controls.querySelector('#split select.binType') as HTMLSelectElement;

    if (binType.selectedIndex === 0) { // equal width
      this.splitValues = [];
      for (let i = 1; i <= splitValCount; i++) {
        const binBorder = min + binWidth * i;
        this.splitValues.push({x: binBorder});
      }
    } else if (binType.selectedIndex === 1) { // custom width
      if (this.splitValues.length > splitValCount) {
        this.splitValues = this.splitValues.sort((a, b) => a.x - b.x); //sort em
        this.splitValues.length = splitValCount; //drop largest split values
      } else {
        while (this.splitValues.length < splitValCount) {
          this.splitValues.push({x: max}); // add maximum until there are enough rulers
        }
      }
    } else {
      this.splitValues = new Array(5).fill({x: 0}).map((x) => ({x}));
    }

    this.vegaView.data(AVegaVisualization.SPLITVALUE_DATA_STORE, cloneDeep(this.splitValues)); //set a defensive copy
    this.vegaView.runAsync().then((vegaView) => //defer adding signallistener until the new data is set internally
      vegaView.addDataListener(AVegaVisualization.SPLITVALUE_DATA_STORE, this.vegaSplitListener) //add listener again
    );
  }

  protected vegaBrushListener = (name, value) => this.handleVegaIntervalEvent(name, value);
  protected vegaSplitListener = (name, value) => this.handleSplitDragEvent(name, value);

  handleInputIntervalEvent(event) {
    this.vegaView.removeSignalListener(AVegaVisualization.SELECTION_SIGNAL_NAME, this.vegaBrushListener); //remove listener temporarily

    const range = this.getBrushRange();
    log.debug('range', range);
    const scaledRange = this.scaleRange(range);
    log.debug('scaledRange', scaledRange);

    this.vegaView.signal(AVegaVisualization.SELECTION_SIGNAL_NAME + '_x', scaledRange);
    this.vegaView.runAsync(); // update the chart

    this.vegaView.addSignalListener(AVegaVisualization.SELECTION_SIGNAL_NAME, this.vegaBrushListener);  //add listener again
  }

  protected scaleRange(range: [number, number] | []) {
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

    return scaledRange;
  }

  public getBrushRange(): [number, number] | [] {
    if (!select(this.controls).select('input.minimum').empty()) {
      return [
        parseFloat((select(this.controls).select('input.minimum').node() as HTMLInputElement).value),
        parseFloat((select(this.controls).select('input.maximum').node() as HTMLInputElement).value)
      ];
    }

    return [];
  }

  handleVegaIntervalEvent(name, value) {
    if (value[this.field]) {
      const lowerBound = value[this.field][0];
      const upperBound = value[this.field][1];

      const inputs = select(this.controls).selectAll('input.interval');
      inputs.on('change', null); //remove listeners temporarily

      const formatter = format('.4~f');
      (select(this.controls).selectAll('input.minimum').node() as HTMLInputElement).value = formatter(lowerBound);
      (select(this.controls).selectAll('input.maximum').node() as HTMLInputElement).value = formatter(upperBound);

      const that = this; //helper varible to access this instance in the d3 event handler function
      inputs.on('change', function () {
        const d3Event = this; // because we use a function this is overwritten by d3, asssign to variable for clarity
        that.handleInputIntervalEvent.bind(that)(d3Event); // voodoo magic (👺) to set this back to the current instance
      }); //add  listeners again
    } else {
      (select(this.controls).selectAll('input.minimum').node() as HTMLInputElement).value = '';
      (select(this.controls).selectAll('input.maximum').node() as HTMLInputElement).value = '';
    }
  }

  handleSplitDragEvent(name, value) {
    this.splitValues = this.vegaView.data(AVegaVisualization.SPLITVALUE_DATA_STORE)
      .map((val) => ({x: val.x})) //copy vega data (remove Symbols)
      .sort((a, b) => a.x - b.x);
    (this.controls.querySelector('#split select.binType') as HTMLSelectElement).selectedIndex = 1;
    (this.controls.querySelector('#split input.bins') as HTMLInputElement).value = (1 + this.splitValues.length).toString();
  }
}
