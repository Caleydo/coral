import {format} from 'd3-format';
import {select} from 'd3-selection';
import vegaEmbed from 'vega-embed';
import {TopLevelSpec as VegaLiteSpec} from 'vega-lite';
import {Cohort, getCohortLabel} from '../../Cohort';
import {ICohort} from '../../CohortInterfaces';
import {IAttribute, IdValuePair} from '../../data/Attribute';
import {log, selectLast} from '../../util';
import {AVegaVisualization} from './AVegaVisualization';
import {DATA_LABEL} from './constants';

export abstract class MultiAttributeVisualization extends AVegaVisualization {
  /**
   * The displayed attribute
   */
  protected attributes: IAttribute[];
  /**
   * Vega name of the displayed attribute, might be different to attribute.datakey due to transformation (e.g. density transform)
   */
  protected fields: string[];
  protected colorPalette: string[];
  // protected hideVisualization: boolean;
  async show(container: HTMLDivElement, attributes: IAttribute[], cohorts: Cohort[]) {
    log.debug('show: ', {container, attributes, cohorts});
    if (attributes.length <= 1) {
      throw new Error('Number of attributes must be at least 2');
    } else if (cohorts.length <= 0) {
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
            const mergedChtData = chtData[0].map((_, itemIndex) => chtData.reduce((mergedItem, attribute, i) => Object.assign(mergedItem, attribute[itemIndex]), {[DATA_LABEL]: getCohortLabel(chtIndex, cht)}));
            resolve(mergedChtData);
          } catch (e) {
            reject(e);
          }
        });
        return promise;
      });
    const data = await Promise.all(dataPromises);
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
    const flatData = <IdValuePair[]>data.flat(1);
    if (!flatData || flatData.length === 0) {
      this.chart.innerText = 'No Data';
    } else {
      this.data = flatData; // save the data that is used in the chart
      await this.showImpl(this.chart, flatData);
    }
    this.addControls();
    this.addColorLegend();
  }
  // may be overwritten (e.g. for tsne plot where the attribtues are different)
  protected addControls() {
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
          <!-- INSERT FILTER CONTROLS HERE -->
        </div>
        <div role="tabpanel" class="tab-pane" id="split">
          <!-- INSERT SPLIT CONTROLS HERE -->
        </div>
      </div>
    </div>
    <button type="button" class="btn btn-default btn-block applyBtn">Apply</button>
    `);
    // for each attribute type, add the respective controls:
    for (const [i, attr] of this.attributes.entries()) {
      if (attr.type === 'number') {
        const axis = i === 0 ? 'x' : 'y';
        this.addIntervalControls(attr.label, axis);
      } /* else if (attr.type === 'categorical')  {
              this.addCategoricalControls();
            } */
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
    select(this.controls).selectAll('a[role="tab"]').on('click', () => {
      const oldTask = select(this.controls).select('.tab-pane.active').attr('id');
      switch (oldTask) {
        case 'filter': // switch to split -> remove interval
        this.showBrush = false;
          this.clearSelection();
          break;
        case 'split': // switch to filter --> remove split rulers
          this.showBrush = true;
          this.clearSelection(); // clear any selection that has been made while in split mode
          select(this.controls).selectAll('input.bins').nodes().forEach((node) =>  {
            (node as HTMLInputElement).value = '1';
            (node as HTMLInputElement).dispatchEvent(new Event('change'));
          });
          break;
        default:
          log.error('Unknown task: ', oldTask);
      }
    });
    this.container.insertAdjacentElement('beforeend', this.controls);
  }

  protected splitValues = [];

  protected addIntervalControls(attributeLabel: string, axis: AxisType) {
    const [min, max] = this.vegaView.scale(axis).domain();
    this.controls.querySelector('#filter').insertAdjacentHTML(`beforeend`, `
    <div class="flex-wrapper">
      <label>Filter ${attributeLabel} from</label>
      <input type="number" class="interval minimum" step="any" min="${min}" max="${max}" data-axis="${axis}"/>
      <label>to</label>
      <input type="number" class="interval maximum" step="any" min="${min}" max="${max}" data-axis="${axis}"/>
    </div>
    `);
    this.controls.querySelector('#split').insertAdjacentHTML(`beforeend`, `
    <div class="flex-wrapper">
      <label>Split ${attributeLabel} into</label>
      <input type="number" class="bins" step="any" min="1" max="99" value="1" data-axis="${axis}"/>
      <label >bins of</label>
      <select>
        <option>equal width</option>
      </select>
    </div>
    `);

    const that = this; //helper varible to access this instance in the d3 event handler function

    const brushInputs = select(this.controls).selectAll(`input.interval[data-axis="${axis}"]`);
    brushInputs.on('change', function () {
      const d3Event = this; // because we use a function "this" is overwritten by d3, asssign to variable for clarity
      that.handleInputIntervalEvent.bind(that)(d3Event); // voodoo magic (👺) to set "this" back to the current instance
    });

    const splitInput = selectLast(select(this.controls), 'input.bins');
    splitInput.on('change', function () {
      const d3Event = this; // because we use a function "this" is overwritten by d3, asssign to variable for clarity
      that.handleBinChangeEvent.bind(that)(d3Event); // voodoo magic (👺) to set "this" back to the current instance
    });
    this.handleBinChangeEvent(splitInput.node());
  }

  protected splitValuesX = [];
  protected splitValuesY = [];

  handleBinChangeEvent(event) {
    const binCount = parseFloat(event.value);
    const [min, max] = this.vegaView.scale(event.dataset.axis).domain();
    const extent = max - min;
    const binWidth = extent / binCount;

    const splitValues = event.dataset.axis === 'x' ? this.splitValuesX : this.splitValuesY;
    splitValues.length = 0;

    for (let i = 1; i < binCount; i++) {
      const binBorder = min + binWidth * i;
      splitValues.push(binBorder);
    }

    this.vegaView.data(`splitvalues_${event.dataset.axis}`, splitValues.slice()); //set a defensive copy
    this.vegaView.runAsync();
  }

  protected vegaBrushListener = (name, value) => this.handleVegaIntervalEvent(name, value);

  protected axes: Array<AxisType> = ['x', 'y'];

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
      this.vegaView.addSignalListener(`${AVegaVisualization.SELECTION_SIGNAL_NAME}_${axis}`, this.vegaBrushListener);  //add listener again
    }

    this.vegaView.runAsync(); // update the chart
  }

  getInterval(axis: AxisType) {
    const range = [
      parseFloat((select(this.controls).select(`input.minimum[data-axis="${axis}"]`).node() as HTMLInputElement).value), // get value, not the value attribute
      parseFloat((select(this.controls).select(`input.maximum[data-axis="${axis}"]`).node() as HTMLInputElement).value)
    ];

    if(range.some((rangeNum) => rangeNum === undefined || isNaN(rangeNum))) {
      const domain = this.vegaView.scale(axis).domain();

      for(const i in range) {
        if (range[i] === undefined || isNaN(range[i])) {
          range[i] = domain[i];
        }
      }
    }

    return range;
  }

  handleVegaIntervalEvent(name, interval: object) {
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
        (select(this.controls).selectAll(`input.minimum[data-axis="${axis}"]`).node() as HTMLInputElement).value = formatter(lowerBound);
        (select(this.controls).selectAll(`input.maximum[data-axis="${axis}"]`).node() as HTMLInputElement).value = formatter(upperBound);

        //add listener again:
        const that = this; //helper varible to access this instance in the d3 event handler function
        inputs.on('change', function () {
          const d3Event = this; // because we use a function this is overwritten by d3, asssign to variable for clarity
          that.handleInputIntervalEvent.bind(that)(d3Event); // voodoo magic (👺) to set this back to the current instance
        });
      }
    } else {
      select(this.controls).selectAll(`input.minimum, input.maximum`).nodes().forEach((node) => (node as HTMLInputElement).value = '');
    }
  }

  // addCategoricalControls() {
  //   this.controls.insertAdjacentHTML('afterbegin', `
  //     <p>Select bars with a mouse click. All bars are selected initially.</p>
  //     <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5em;">
  //       <button type="button" class="btn btn-default"><i class="fas fa-filter" aria-hidden="true"></i> Filter</button>
  //       <button type="button" class="btn btn-default"><i class="fas fa-share-alt" aria-hidden="true"></i> Split</button>
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

    if (this.attributes.some((attr) => attr.type === 'number')) {
      this.vegaView.addSignalListener(AVegaVisualization.SELECTION_SIGNAL_NAME, this.vegaBrushListener);
    }

    log.info('vega', this.vegaSpec);
    log.info('vegalite', this.vegaLiteSpec);
    window.dispatchEvent(new Event('resize')); //update vega chart sizes in case the columns became narrower
  }

  getSelectedData(): {from: string | number; to: string | number; cohort: ICohort}[] {
    throw new Error('use getSelectedDatas for multi attribute');
  }
}

export type AxisType = 'x' | 'y';
