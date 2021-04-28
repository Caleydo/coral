import * as merge from 'lodash.merge';
import {TopLevelSpec as VegaLiteSpec} from 'vega-lite';
import {ICohort} from '../../CohortInterfaces';
import {IdValuePair} from '../../data/Attribute';
import {colors} from '../../colors';
import {log} from '../../util';
import {AVegaVisualization} from './AVegaVisualization';
import {DATA_LABEL} from './constants';
import {VegaHistogram} from './Histogram';
import {TopLevelUnitSpec} from 'vega-lite/build/src/spec/unit';
import {getCohortLabel} from '../../Cohort';

export class VegaGroupedHistogram extends VegaHistogram {
  static readonly COUNT = 'Count';

  protected readonly type = 'nominal';

  constructor(vegaLiteOptions: Object = {}) {
    super(vegaLiteOptions);

    this.options
      .set('Relative Frequencies', (rowField: string, chtCount: number) => ({
        encoding: {
          x: {
            field: 'PercentOfCohort',
            title: 'Share within Cohort',
            axis: {
              format: '.1~%'
            }
          },
          row: { sort: { field: 'CategoryPercentSum', order: 'descending'} }
        }
      }))
      .set('Absolute Counts', (rowField: string, chtCount: number) => ({
        encoding: {
          x: {
            field: VegaGroupedHistogram.COUNT,
            title: 'Count within Cohort',
          },
          row: { sort: { field: 'CategoryItemSum', order: 'descending'}}
        }
      })); //simply aggregate by count
  }

  getSpec(data: IdValuePair[]): VegaLiteSpec {
    if (this.attribute.type === `number`) {
      throw new Error('Type "number" is not supported for grouped histograms');
    }

    const histSpec = super.getSpec(data) as TopLevelUnitSpec;
    delete histSpec.autosize; // does not work for facetted charts, see https://github.com/Caleydo/cohort/issues/121
    delete histSpec.encoding; // make new encoding for groupedhistogram

    const grpHistSpec: Partial<VegaLiteSpec> = {
      width: 300, // fixed width, 550px are available on fullscreen full hd, minus up to 150px for the label (labelLimit) = 400. 50px tolerance. see https://github.com/Caleydo/cohort/issues/121
      transform: [{ // count items for each category of each cohort
          aggregate: [{op: 'count', as: VegaGroupedHistogram.COUNT}],
          groupby: [this.field, DATA_LABEL]
        }, { // count items of each cohort
          joinaggregate: [{op: 'sum', field: VegaGroupedHistogram.COUNT, as: 'CohortCount'}],
          groupby: [DATA_LABEL]
        }, { // count items if each category
          joinaggregate: [{op: 'sum', field: VegaGroupedHistogram.COUNT, as: 'CategoryItemSum'}],
          groupby: [this.field]
        }, { // items of a cohort's category divided by all items of the cohort
          calculate: `datum.${VegaGroupedHistogram.COUNT}/datum.CohortCount`, as: 'PercentOfCohort'
        }, {
          joinaggregate: [{op: 'sum', field: 'PercentOfCohort', as: 'CategoryPercentSum'}],
          groupby: [this.field]
        }
      ],
      encoding: {
        row: {
          field: this.field,
          type: this.type,
          spacing: this.cohorts.length === 1 ? -2 : 4, // for no spacing: 0 is not enough, more than -2 makes no difference
          header: {
            labelAngle: 0,
            labelAlign: 'left',
            title: this.attribute.label, // We will set a descriptive title for the whole plot
            titleAnchor: 'end'
          }
        },
        x: {
          type: 'quantitative',
          axis: {
            orient: 'top',
            grid: false // no vertical lines (indicating the ticks on the axis)
          }
        },
        y: {
          field: DATA_LABEL,
          type: 'nominal',
          axis: null // hide cohort names
        },
        color: {
          field: DATA_LABEL,
          type: 'nominal',
          condition: [
            {
              selection: 'highlight',
              value: colors.hoverColor
            }
          ],
          legend: null  // use custom legend
        },
        fillOpacity: {
          condition: [
            {
              test: {
                or: [
                  {selection: AVegaVisualization.SELECTION_SIGNAL_NAME},
                  {selection: AVegaVisualization.HIGHLIGHT_SIGNAL_NAME}
                ]
              },
              value: 1
            }
          ],
          value: 0.3
        },
        tooltip: [
          {field: this.field},
          {field: DATA_LABEL},
          {field: VegaGroupedHistogram.COUNT},
          {field: 'PercentOfCohort', title: this.cohorts.length === 1 ? 'Share' : 'Share per Cohort', format: '.1~%'}
        ]
      },
      view: {stroke: colors.lightBorder}// border color between sub-charts
    };

    const optionedSpec = merge(grpHistSpec, this.getOptionSpec()(this.field, this.cohorts.length));
    const vegaLiteSpec = Object.assign(histSpec, optionedSpec) as VegaLiteSpec;
    return Object.assign(vegaLiteSpec, this.vegaLiteOptions);
  }

  /**
   * From == To for categorical data, e.g. FROM: male, TO: male
   * From is inclusive (>=) and TO exclusive (<) for numerical data, e.g. FROM 50 TO 60 = [50,60)
   */
  getSelectedData(): {cohort: ICohort, from: string | number, to: string | number}[] {
    let filters: {cohort: ICohort, from: string | number, to: string | number}[] = [];

    const vegaData = this.vegaView.data(AVegaVisualization.DATA_STORE_0); //default name
    log.debug('vegaData', vegaData);

    const selectionData: any[] = this.vegaView.data(VegaHistogram.SELECTION_STORE);
    if (selectionData.length > 0) {
      const selectionVegaIds = selectionData.reduce((array, selectedItem) => array.push(...selectedItem.values) && array, []);
      log.debug('selectionData', selectionData);
      const filteredVegaData = vegaData.filter((dataItem) => selectionVegaIds.find((evItemId) => evItemId === dataItem._vgsid_));
      log.debug('filteredVegaData', filteredVegaData);

      filters = filteredVegaData.map((dataItem) => ({
        cohort: this.cohorts.find((cht, index) => getCohortLabel(index, cht) === dataItem[DATA_LABEL]),
        from: dataItem[this.field],
        to: dataItem[this.field]
      }));
    } else {
      //select all
      const rowDomain = this.vegaView.data('row_domain'); //default name
      this.cohorts.forEach((cohort) => filters.push(...rowDomain.map((datum) => ({from: datum[this.field], to: datum[this.field], cohort}))));
    }

    log.debug('filters', filters);
    return filters;
  }
}
