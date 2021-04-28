
import * as Comlink from 'comlink';
import {select} from 'd3-selection';
import {TopLevelSpec as VegaLiteSpec} from 'vega-lite';
import {Cohort, getCohortLabels} from '../../Cohort';
import {AttributeType, IAttribute, IdValuePair, ServerColumnAttribute} from '../../data/Attribute';
import {NumRangeOperators} from '../../rest';
import {IFilterDesc, inRange} from '../../util';
import {FilterEvent} from '../../utilCustomEvents';
import {AVegaVisualization} from './AVegaVisualization';
import {DATA_LABEL} from './constants';
import {AxisType, MultiAttributeVisualization} from './MultiAttributeVisualization';
import {TopLevel, LayerSpec} from 'vega-lite/build/src/spec';

export class Scatterplot extends MultiAttributeVisualization {
  static readonly NAME: string = 'Scatterplot';
  protected checkAttributeType = false;

  constructor(vegaLiteOptions: Object = {}) {
    super(vegaLiteOptions);
  }


  getSpec(data: IdValuePair[]): VegaLiteSpec {
    if (this.checkAttributeType && this.attributes.some((attr) => attr.type !== `number`)) {
      throw new Error(`Scatterplot requires attributes of type number`);
    }

    const scatterSpec: VegaLiteSpec = {
      '$schema': 'https://vega.github.io/schema/vega-lite/v4.json',
      width: 'container', //responsive width
      height: 300,
      autosize: {type: 'fit', contains: 'padding'},
      padding: {left: 5, top: 0, right: 5, bottom: 0},
      layer: [{
        data: {values: data},
        mark: {type: 'circle', 'opacity': 0.5, size: 15, tooltip: true},
        encoding: {
          x: {field: this.attributes[0].dataKey, type: 'quantitative', scale: {clamp: true}, title: this.attributes[0].label},
          y: {field: this.attributes[1].dataKey, type: 'quantitative', scale: {clamp: true}, title: this.attributes[1].label},
          color: {
            field: DATA_LABEL,
            type: 'nominal',
            scale: {domain: getCohortLabels(this.cohorts)},
            legend: null  // custom legend
          }
        }
      }, {
        data: {name: 'splitvalues_x'},
        mark: {
          type: 'rule',
          strokeDash: [4, 6]
        },
        encoding: {
          x: {field: 'data', type: 'quantitative'}
        }
      }, {
        data: {name: 'splitvalues_y'},
        mark: {
          type: 'rule',
          strokeDash: [4, 6]
        },
        encoding: {
          y: {field: 'data', type: 'quantitative'}
        }
      }
      ],
      view: {cursor: 'crosshair'},
      datasets: {
        splitvalues_x: this.splitValuesX,
        splitvalues_y: this.splitValuesY
      }
    };

    // Get base spec, merge with above
    const vegaLiteSpec = Object.assign(super.getSpec(data), scatterSpec);
    this.addIntervalSelection(vegaLiteSpec); // add interval selection

    for (const [i, attr] of this.attributes.entries()) {
        const axis = i === 0 ? 'x' : 'y';
        if(attr.preferLog) {
          this.setLogScale(vegaLiteSpec, axis);
        }
    }

    return Object.assign(vegaLiteSpec, this.vegaLiteOptions);
  }

  addIntervalSelection(spec) {
    super.addIntervalSelection(spec);
    const subspec = spec.layer ? spec.layer[0] : spec;
    const rangeX = this.getFilterRange('x');
    const rangeY = this.getFilterRange('y');

    subspec.selection[AVegaVisualization.SELECTION_SIGNAL_NAME].encodings = ['x', 'y'];
    subspec.selection[AVegaVisualization.SELECTION_SIGNAL_NAME].init = {x: rangeX, y: rangeY};
    subspec.mark.cursor = 'crosshair';
    subspec.view.cursor = 'crosshair';
  }

  filter() {
    const filterDescs: IFilterDesc[] = [];
    for (const cht of this.cohorts) {
      const filter = [];
      for (const [i, axis] of this.axes.entries()) {
        const interval = this.getInterval(axis);
        const range = [{
          operatorOne: NumRangeOperators.gte,
          valueOne: interval[0],
          operatorTwo: NumRangeOperators.lte,
          valueTwo: interval[1]
        }];
        filter.push({
          attr: this.attributes[i],
          range
        });
      }
      filterDescs.push({
        cohort: cht,
        filter
      });
    }

    this.container.dispatchEvent(new FilterEvent(filterDescs));
  }

  split() {
    const filterDescs: IFilterDesc[] = [];
    for (const cht of this.cohorts) {
      const filter = [];


      const [minX, maxX] = this.vegaView.scale('x').domain();
      const [minY, maxY] = this.vegaView.scale('y').domain();

      // one filterdesc per cohort and split bin
      // a bin consits of x and y range
      for (const [ix, splitX] of [...this.splitValuesX, maxX].entries()) {

        for (const [iy, splitY] of [...this.splitValuesY, maxY].entries()) {
          const desc = {
            cohort: cht,
            filter: [
              { //x
                attr: this.attributes[0],
                range: [this.getGeneralNumericalFilter(
                  ix >= 1 ? this.splitValuesX[ix - 1] : minX,
                  splitX,
                  NumRangeOperators.gte,
                  splitX === maxX ? NumRangeOperators.lte : NumRangeOperators.lt)
                ]
              },
              { //y
                attr: this.attributes[1],
                range: [this.getGeneralNumericalFilter(
                  iy >= 1 ? this.splitValuesY[iy - 1] : minY,
                  splitY,
                  NumRangeOperators.gte,
                  splitY === maxY ? NumRangeOperators.lte : NumRangeOperators.lt)
                ]
              }
            ]
          };

          filterDescs.push(desc);
        }
      }
    }
    this.container.dispatchEvent(new FilterEvent(filterDescs));
  }
}

export class TsneScatterplot extends Scatterplot {
  static readonly NAME = 't-SNE Scatterplot';
  public readonly ITERATIONS = 100;
  iteration = 0;
  progressBar: HTMLDivElement;
  running: boolean;
  playBtn: any;
  inputData: number[][];
  tsne: any;
  progressWrapper: any;
  tsneClass: any;
  projData: any[];
  originalAttributes: IAttribute[];

  constructor(vegaLiteOptions: Object = {}) {
    super(vegaLiteOptions);
    this.checkAttributeType = false;
  }

  getSpec(data: IdValuePair[]): TopLevel<LayerSpec> {
    const scatterSpec = super.getSpec(data) as TopLevel<LayerSpec>;
    (scatterSpec.layer[0].encoding.x as any).field = 'x_embed'; //cast to any because I couldnt find out the right type...
    (scatterSpec.layer[0].encoding.y as any).field = 'y_embed';
    scatterSpec.layer[0].encoding.tooltip = this.originalAttributes.map((attr) => ({field: attr.dataKey, type: attr.type === 'number' ? 'ordinal' : 'nominal'}));
    return scatterSpec;
  }
  async show(container: HTMLDivElement, attributes: IAttribute[], cohorts: Cohort[]) {
    super.show(container, attributes, cohorts);
  }

  async showImpl(chart: HTMLDivElement, data: Array<IdValuePair>) {
    this.addProgressBar();

    const oneHotWorker = new (<any>require('worker-loader?name=OneHotEncoder.js!./dimreduce/OneHotEncoder.worker'))();
    const oneHotClass = Comlink.wrap(oneHotWorker) as any;
    const oneHot = await new oneHotClass();
    // Note: numerical attributes will be normalized
    const oneHotData = await oneHot.encode(data, this.attributes);
    oneHot[Comlink.releaseProxy]();

    const opt = {
      epsilon: 10, // epsilon is learning rate (10 = default)
      perplexity: data.length ** 0.5, // roughly how many neighbors each point influences (30 = default)
      dim: 2 // dimensionality of the embedding (2 = default)
    };


    const tsneWorker = new (<any>require('worker-loader?name=tsne.worker.js!./dimreduce/tsne.worker'))();
    this.tsneClass = Comlink.wrap(tsneWorker) as any;
    this.tsne = await new this.tsneClass(opt);
    this.tsne.initDataRaw(oneHotData);

    this.originalAttributes = this.attributes; //backup for tooltip
    this.attributes = ['x', 'y'].map((axis) => ({
      id: `${axis}_embed`,
      label: axis,
      type: 'number' as AttributeType
    } as unknown as IAttribute)); // workaround to glory

    this.run(true);
  }

  async embeddStep() {
    this.progressBar.classList.toggle('active', true);
    this.progressBar.classList.toggle('progress-bar-striped', true);
    this.playBtn.select('i')
      .classed('fa-circle-notch fa-spin', false)
      .classed('fa-play-circle', false)
      .classed('fa-pause-circle', true);

    await this.tsne.step(); // every time you call this, solution gets better
    this.iteration++;
    this.setProgress(this.iteration);

    if (this.iteration % 10 === 0 || this.iteration === this.ITERATIONS || !this.running) {
      const projCoords = await this.tsne.getSolution() as Array<Array<number>>;
      super.showImpl(this.chart, this.embeddArrToJson(projCoords)).then(() => {
        if (this.iteration === this.ITERATIONS) {
          super.addControls();
        }
      });
    }
    if (this.iteration === this.ITERATIONS) {
      this.run(false);
      this.progressWrapper.remove();
      this.tsneClass[Comlink.releaseProxy]();
    }

    if (this.running) {
      this.embeddStep(); // call self
    } else {
      this.progressBar.classList.toggle('active', false);
      this.progressBar.classList.toggle('progress-bar-striped', false);
      this.playBtn.select('i')
        .classed('fa-circle-notch fa-spin', false)
        .classed('fa-play-circle', true)
        .classed('fa-pause-circle', false);
    }
  }

  embeddArrToJson(projCoords: Array<Array<number>>): IdValuePair[] {
    const projCoordsObjArr = projCoords.map((item, index) => Object.assign({
      x_embed: item[0] * 1000,
      y_embed: item[1] * 1000,
    }, this.data[index]));
    this.projData = projCoordsObjArr;
    return projCoordsObjArr;
  }

  addProgressBar() {
    this.container.insertAdjacentHTML('beforeend', `
    <div class="progress-wrapper"">
      <div class="progress-ctrl">
        <a class="run" role="button"><i class="fas fa-fw fa-circle-notch"></i></a>
      </div>
      <div  class="progress">
        <div class="progress-bar" role="progressbar">
          0/${this.ITERATIONS}
        </div>
      </div>
    </div>
    `);
    this.progressWrapper = select(this.container).select('.progress-wrapper');
    this.progressBar = select(this.container).select('.progress .progress-bar').node() as HTMLDivElement;
    this.playBtn = select(this.container).select('a.run');
    this.playBtn.on('click', () => this.run(!this.running));
  }

  setProgress(iteration: number) {
    this.progressBar.textContent = `${iteration}/${this.ITERATIONS}`;
    this.progressBar.style.width = `${100 * iteration / this.ITERATIONS}%`;
  }

  run(run: boolean) {
    this.running = run;
    this.playBtn.select('i')
      .classed('fa-circle-notch fa-spin', true)
      .classed('fa-play-circle', false)
      .classed('fa-pause-circle', false);

    if (run) {
      this.embeddStep();
    }
  }

  protected addControls() {
    // noop
  }

  addIntervalControls(attributeLabel: string, axis: AxisType) {
    super.addIntervalControls(axis, axis);
  }

  filter() {
    const intervals = {
      x: this.getInterval('x'),
      y: this.getInterval('y')
    };

    const selectedItems = this.projData.filter((item) => {
      let selected = true;
      for (const axis of ['x', 'y']) {
        selected = selected && inRange(item[`${axis}_embed`], intervals[axis]);
      }
      return selected;
    });

    const filterDescs: IFilterDesc[] = [];
    for (const cohort of this.cohorts) {
      filterDescs.push({
        cohort,
        filter: [{
          attr: new ServerColumnAttribute(cohort.idColumn.column, cohort.view, cohort.database, cohort.idColumn),
          range: {values: selectedItems.filter((item) => item.Cohort.indexOf(cohort.label) >= 0).map((item) => item[cohort.idColumn.column])}
        }]
      });
    }
    this.container.dispatchEvent(new FilterEvent(filterDescs));
  }

  split() {

    const filterDescs: IFilterDesc[] = [];
    for (const cohort of this.cohorts) {
      const chtItems = this.projData.filter((item) => item.Cohort.indexOf(cohort.label) >= 0);

      const [minX, maxX] = this.vegaView.scale('x').domain();
      const [minY, maxY] = this.vegaView.scale('y').domain();

      for (const [ix, splitX] of [...this.splitValuesX, maxX].entries()) {
        for (const [iy, splitY] of [...this.splitValuesY, maxY].entries()) {

          const chtSplitItems = chtItems.filter((item) => {
            const x = item[`x_embed`];
            const selectedX = splitX === maxX ?
              x >= (ix >= 1 ? this.splitValuesX[ix - 1] : minX) && x <= splitX : // splitX is maxX -> include max
              x >= (ix >= 1 ? this.splitValuesX[ix - 1] : minX) && x < splitX; // splitX is something else

            const y = item[`y_embed`];
            const selectedY = splitY === maxY ?
              y >= (iy >= 1 ? this.splitValuesY[iy - 1] : minY) && y <= splitY :
              y >= (iy >= 1 ? this.splitValuesY[iy - 1] : minY) && y < splitY;


            return selectedX && selectedY;
          });

          filterDescs.push({
            cohort,
            filter: [{
              range: {values: chtSplitItems.map((item) => item[cohort.idColumn.column])},
              attr: new ServerColumnAttribute(cohort.idColumn.column, cohort.view, cohort.database, cohort.idColumn),
            }]
          });
        }
      }
    }
    this.container.dispatchEvent(new FilterEvent(filterDescs));
  }
}
