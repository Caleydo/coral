import vegaEmbed from 'vega-embed';
import { TopLevelSpec as VegaLiteSpec } from 'vega-lite';
import { colors } from '../../config/colors';
import { IAttribute } from '../../data';
import { INumRange, IEqualsList, NumRangeOperators } from '../../base';
import { getAnimatedLoadingBars, log } from '../../util';
import { easyLabelFromFilter, niceName } from '../../utils/labels';
import { ICohort } from '../../app/interfaces';

export class Histogram {
  readonly $node: HTMLDivElement;

  readonly $loader: HTMLDivElement;

  readonly $hist: HTMLDivElement;

  vegaView: any;

  public showReference = true;

  constructor(private attribute: IAttribute, private cohort: ICohort, showReference, private index, private color) {
    this.showReference = showReference;
    this.$node = document.createElement('div');
    this.$node.classList.add('hist');

    this.$loader = document.createElement('div');
    this.$loader.classList.add('loader'); // center content with flexbox
    this.$loader.appendChild(getAnimatedLoadingBars());

    this.$hist = document.createElement('div');

    this.$node.appendChild(this.$hist);

    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const that = this;
    setTimeout(() => that.updateNode.bind(that)(), 0); // run async
  }

  public async updateNode() {
    this.$hist.remove();
    try {
      if (!this.cohort.hasfilterConflict()) {
        this.$node.appendChild(this.$loader);
        // get hist data of attribute for cohort
        let data: { bin: string; count: number }[];
        try {
          data = await this.attribute.getHist(this.cohort.dbId, this.cohort.filters);
        } catch (e) {
          log.error('get hist failed', e);
          this.$loader.remove();
          this.$node.classList.add('text');
          this.$hist.innerHTML = `
              <p>
                <i class="fa fa-hourglass-end" aria-hidden="true"></i>
                Request timeout.
              </p>
            `;
          this.$node.appendChild(this.$hist);
          return;
        }

        const notZeroData = data.filter((d) => d.count > 0); // filter only for categories/bins with count bigger 0
        let showText = false;
        // show only text when 1 bin and not numerical attribute or when numerical attribute only for one bin if it is for null
        if (
          this.attribute.type !== 'number' ||
          (this.attribute.type === 'number' && notZeroData.length === 1 && (notZeroData[0].bin === 'null' || notZeroData[0].bin === null))
        ) {
          showText = notZeroData.length === 1; // show text when only one category/bin with count bigger 0
        }

        const chtSize = await this.cohort.size;
        // -> size = 0: show only line in data cell with vega vis (all bins/categories have count 0)

        // check if reference should be shown and
        // if the size of the current cohort is bigger then 0
        if (this.showReference && chtSize > 0) {
          if (this.cohort.getCohortParents().length > 0) {
            // get parent cohort
            const parentCht = this.cohort.getCohortParents()[0];
            // get hist data of attribtue for parent cohort
            const parentData: { bin: string; count: number }[] = await this.attribute.getHist(parentCht.dbId, parentCht.filters);
            const notZeroParentData = parentData.filter((d) => d.count > 0); // filter only for categories/bins with count bigger 0
            const showParentText = notZeroParentData.length === 1; // show text when only one category/bin with count bigger 0
            const vegaData = {
              data,
              parentData,
              parentColor: parentCht.colorTaskView,
            };
            if (showParentText) {
              const { bin } = notZeroParentData[0];
              // TODO labels
              // const text = this.formatText(bin);
              const text = this.formatText(bin, this.cohort.values);
              this.$node.classList.add('text');
              this.$hist.innerHTML = text;
            } else {
              // show histogram with reference
              this.$node.classList.remove('text');
              vegaEmbed(this.$hist, this.getMinimalVegaSpecWithRef(vegaData), { actions: false, renderer: 'svg' }).then((result) => {
                this.vegaView = result.view;
              });
            }
          }
        } else if (showText) {
          // when no reference should be shown (is also the case for the input cohort side)
          // check if only one category/bin has values
          // show only text
          const { bin } = notZeroData[0];
          // TODO labels
          // const text = this.formatText(bin);
          this.$node.classList.add('text');
          const text = this.formatText(bin, this.cohort.values);
          this.$hist.innerHTML = text;
        } else {
          // show histogram
          this.$node.classList.remove('text');
          vegaEmbed(this.$hist, this.getMinimalVegaSpec(data), { actions: false, renderer: 'svg' }).then((result) => {
            this.vegaView = result.view;
          });
        }

        this.$loader.remove();
        this.$node.appendChild(this.$hist);
      } else {
        throw new Error('Can not show histogram due to filter contradiction');
      }
    } catch (e) {
      log.error('Cant show histogram', e);

      this.$loader.remove();
      this.$node.classList.add('text');
      this.$hist.innerHTML = `
          <p>
            <i class="fa fa-times" aria-hidden="true"></i>
            Can not display histogram.
          </p>
        `;
      this.$node.appendChild(this.$hist);
    }
  }

  // TODO labels
  // private formatText(value: string): string {
  private formatText(value: string, filters: Array<INumRange[] | IEqualsList>): string {
    if (value === 'null' || value === null || value === undefined) {
      value = `Missing Values`;
    }
    let text = String(value); // turn boolean categories into strings

    if (text.indexOf('(') >= 0 || text.indexOf('[') >= 0) {
      const values = text.split(', ');
      const params = {
        firstOp: values[0][0],
        firstValue: Number(values[0].substring(1)),
        secondOp: values[1][values[1].length - 1],
        // TODO labels
        // secondValue: Number(values[1].substring(0, values[1].length - 2))
        secondValue: Number(values[1].substring(0, values[1].length - 1)),
      };
      // TODO lables
      // text = labelFromRanges(params.firstOp === '(' ? '(' : '[', params.firstValue, params.secondValue, params.secondOp === ')' ? ')' : ']', this.attribute);
      const range: INumRange = {
        operatorOne: params.firstOp === '(' ? NumRangeOperators.gt : NumRangeOperators.gte,
        valueOne: params.firstValue,
        operatorTwo: params.secondOp === ')' ? NumRangeOperators.lt : NumRangeOperators.lte,
        valueTwo: params.secondValue,
      };

      text = easyLabelFromFilter(range, this.attribute.label);
    } else {
      text = niceName(text);
    }
    return text;
  }

  public getNode() {
    return this.$node;
  }

  public getMinimalVegaSpec(data): VegaLiteSpec {
    let sort: any = 'ascending';
    if (this.attribute.type === 'number') {
      sort = { field: 'index' };
    }
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 'container', // responsive width
      height: 50, // responsive height
      background: '#ffffff00', // set visualization background to white and opacity 0 -> https://vega.github.io/vega-lite/docs/spec.html#example-background
      autosize: { type: 'fit', contains: 'padding' }, // plots fit a bit better, if though they are specified as responsive
      data: { values: data },
      mark: {
        type: 'bar',
        tooltip: true,
      },
      encoding: {
        x: {
          field: 'bin',
          type: 'nominal',
          axis: {
            title: null, // we will have the title in the column header
            labels: false, // no space for labels
            ticks: false,
          },
          sort,
        },
        y: {
          field: 'count',
          type: 'quantitative',
          axis: null, //  no axis, no title, labels, no grid
        },
        color: {
          field: 'this_does_not_exist', // field is necessary but does not have to exist
          type: 'nominal', // type is also necessary, nominal as we have only one category (or none :) )
          scale: {
            range: [this.cohort.colorTaskView || colors.barColor], // [this.color ? Cat16.get(this.index) : colors.barColor]
          },
          legend: null, // no legend
        },
        tooltip: [
          { field: 'bin', type: 'nominal' },
          { field: 'count', type: 'quantitative' },
        ],
      },
      config: {
        view: {
          stroke: 'transparent', // https://vega.github.io/vega-lite/docs/spec.html#view-background
        },
      },
      params: [
        {
          name: 'highlight',
          select: {
            type: 'point',
            on: 'mouseover',
            clear: 'mouseout',
          },
        },
      ],
    };
  }

  public getMinimalVegaSpecWithRef(data): VegaLiteSpec {
    let sort: any = 'ascending';
    if (this.attribute.type === 'number') {
      sort = { field: 'index' };
    }
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 'container', // responsive width
      height: 50, // responsive height
      background: '#ffffff00', // set visualization background to white and opacity 0 -> https://vega.github.io/vega-lite/docs/spec.html#example-background
      autosize: { type: 'fit', contains: 'padding' }, // plots fit a bit better, if though they are specified as responsive
      datasets: {
        parentData: data.parentData,
        data: data.data,
      },
      layer: [
        {
          // layer 1: input cohort reference data
          data: { name: 'parentData' },
          mark: {
            type: 'bar',
            tooltip: true,
          },
          encoding: {
            x: {
              field: 'bin',
              type: 'nominal',
              axis: {
                title: null, // we will have the title in the column header
                labels: false, // no space for labels
                ticks: false,
              },
              sort,
            },
            y: {
              field: 'count',
              type: 'quantitative',
              axis: null, //  no axis, no title, labels, no grid
            },
            fill: {
              value: data.parentColor,
              legend: null, // no legend
            },
            tooltip: [
              { field: 'bin', type: 'nominal' },
              { field: 'count', type: 'quantitative' },
            ],
          },
        },
        {
          // layer 2: output cohort data
          data: { name: 'data' },
          mark: {
            type: 'bar',
            tooltip: true,
          },
          encoding: {
            x: {
              field: 'bin',
              type: 'nominal',
              axis: {
                title: null, // we will have the title in the column header
                labels: false, // no space for labels
                ticks: false,
              },
              sort,
            },
            y: {
              field: 'count',
              type: 'quantitative',
              axis: null, //  no axis, no title, labels, no grid
            },
            fill: {
              value: colors.barColor, // TODO: check if this value actually exists
              legend: null, // no legend
            },
            tooltip: [
              { field: 'bin', type: 'nominal' },
              { field: 'count', type: 'quantitative' },
            ],
          },
        },
      ],
      config: {
        view: {
          stroke: 'transparent', // https://vega.github.io/vega-lite/docs/spec.html#view-background
        },
      },
    };
  }
}
