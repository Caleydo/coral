import log from 'loglevel';
import {TopLevelSpec as VegaLiteSpec} from 'vega-lite';
import {ICohort} from '../../CohortInterfaces';
import {IdValuePair} from '../../data/Attribute';
import {AVegaVisualization, SingleAttributeVisualization} from './AVegaVisualization';
import {DATA_LABEL} from './constants';

export class DensityPlot extends SingleAttributeVisualization {
  static readonly NAME = 'Density Plot';
  static readonly TRANSFORMED_ATTRIBUTE = 'value'; // After applying the vega density transform, the attribute is simply called value

  protected readonly type = 'quantitative';

  constructor(vegaLiteOptions: Object = {}) {
    super(vegaLiteOptions);

    this.options
      .set('Estimated Probability', () => ({transform: [{counts: false}]}))
      .set('Counts', () => ({transform: [{counts: true}]})); // set false to show frequency/true to show counts
  }


  getSpec(data: IdValuePair[]): VegaLiteSpec {
    this.field = DensityPlot.TRANSFORMED_ATTRIBUTE; // set for interval selection handler

    if (this.attribute.type !== `number`) {
      throw new Error(`Type "${this.attribute.type}" is not supported for density plots.`);
    }

    const densitySpec: VegaLiteSpec = {
      height: 300, // Fixed height (more than default)
      transform: [ // calc density using vega
        {
          groupby: [DATA_LABEL],
          density: this.attribute.dataKey,
          counts: this.getOption() === 'Counts',
          // minsteps: 50
        }
      ],
      layer: [
        {
          mark: {
            type: 'line',
            tooltip: true
          },
          encoding: {
            x: {
              field: DensityPlot.TRANSFORMED_ATTRIBUTE,  // value == name applied through density transform
              title: this.attribute.label,
              type: 'quantitative',
              scale: {clamp: true}
            },
            y: {
              field: 'density',
              title: 'Density',
              type: 'quantitative',
            },
            order: {field: DensityPlot.TRANSFORMED_ATTRIBUTE, type: 'quantitative'},
            color: {
              // bars will only change color on selection if the type is ordinal/nominal
              // for quantitative this does not work due the applied data transofrmations (binning)
              // which leads to errors on select/hovering selected data (data in the interval)
              field: DATA_LABEL,
              type: 'nominal',
              legend: null  // custom legend
            }
          }
        }, {
          data: {
            name: 'splitvalues'
          },
          mark: {
            type: 'rule',
            strokeDash: [4, 6]
          },
          encoding: {
            x: {field: 'data', type: 'quantitative'}
          }
        }
      ],
      view: {cursor: 'text'},
      datasets: {
        splitvalues: this.splitValues
      }
    };

    // Get base spec, merge with above
    const vegaLiteSpec = Object.assign(super.getSpec(data), densitySpec);
    this.addIntervalSelection(vegaLiteSpec); // add interval selection
    if(this.attribute.preferLog) {
      this.setLogScale(vegaLiteSpec, 'x');
    }

    return Object.assign(vegaLiteSpec, this.vegaLiteOptions);
  }

  /**
   * From == To for categorical data, e.g. FROM: male, TO: male
   * From is inclusive (>=) and TO exclusive (<) for numerical data, e.g. FROM 50 TO 60 = [50,60)
   */
  getSelectedData(): {cohort: ICohort, from: string | number, to: string | number}[] {
    const filters: {cohort: ICohort, from: string | number, to: string | number}[] = [];
    if (!this.hideVisualization) {
      const selections = this.vegaView.signal(AVegaVisualization.SELECTION_SIGNAL_NAME);
      let attrSelection = selections[DensityPlot.TRANSFORMED_ATTRIBUTE]; // value == name applied through density transform
      if (!attrSelection || attrSelection.length !== 2) {
        attrSelection = this.vegaView.scale('x').domain();
      }
      this.cohorts.forEach((cohort) => {
        filters.push({from: attrSelection[0], to: attrSelection[1], cohort});

        const nullFilter = this.getNullValueSelectedData(cohort);
        if (nullFilter) {
          filters.push(nullFilter);
        }
      });
    } else {
      this.cohorts.forEach((cohort) => {
        const nullFilter = this.getNullValueSelectedData(cohort);
        if (nullFilter) {
          filters.push(nullFilter);
        }
      });
    }

    log.debug('filters', filters);
    return filters;
  }
}
