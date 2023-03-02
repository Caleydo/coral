import { TopLevelSpec as VegaLiteSpec } from 'vega-lite';
import { Field } from 'vega-lite/build/src/channeldef';
import { TopLevelUnitSpec } from 'vega-lite/build/src/spec/unit';
import { getCohortLabel } from '../../Cohort';
import { ICohort } from '../../app/interfaces';
import { colors } from '../../config/colors';
import { log } from '../../util';
import { AVegaVisualization, FACETED_CHARTS_WIDTH } from './AVegaVisualization';
import { groupByConfig } from './config/GroupConfig';
import { dataConfig } from './config/ScaleConfig';
import { sortByConfig, sortOrderConfig } from './config/SortConfig';
import { DATA_LABEL } from './constants';
import { VegaHistogram } from './Histogram';
import { IdValuePair } from '../../data/IAttribute';

export class VegaGroupedHistogram extends VegaHistogram {
  static readonly COUNT = 'Count';

  protected readonly type = 'nominal';

  constructor(vegaLiteOptions: Object = {}) {
    super(vegaLiteOptions);

    this.config = [
      { icon: '<i class="fas fa-sitemap fa-rotate-270"></i>', label: 'Group', groups: [groupByConfig] },
      { icon: '<i class="fas fa-align-left"></i>', label: 'Data', groups: [/* scaleConfig, */ dataConfig] },
      { icon: '<i class="fas fa-sort-amount-down-alt"></i>', label: 'Sort', groups: [sortOrderConfig, sortByConfig] },
    ];
  }

  getSpec(data: IdValuePair[]): VegaLiteSpec {
    if (this.attribute.type === `number`) {
      throw new Error('Type "number" is not supported for grouped histograms');
    }

    const histSpec = super.getSpec(data) as TopLevelUnitSpec<Field>;
    delete histSpec.autosize; // does not work for facetted charts
    delete histSpec.encoding; // make new encoding for groupedhistogram

    const [yField, rowField] = groupByConfig.getSelected().label === 'Same Category' ? [DATA_LABEL, this.field] : [this.field, DATA_LABEL];

    const grpHistSpec: Partial<VegaLiteSpec> = {
      width: FACETED_CHARTS_WIDTH,
      transform: [
        {
          // count items for each category of each cohort
          aggregate: [{ op: 'count', as: VegaGroupedHistogram.COUNT }],
          groupby: [this.field, DATA_LABEL],
        },
        ...(groupByConfig.getSelected().label === 'Same Cohort'
          ? []
          : [
              {
                // impute zero for cohort+category combinations with no data
                impute: VegaGroupedHistogram.COUNT,
                value: 0,
                key: yField,
                groupby: [rowField],
              },
            ]),
        {
          // count items of each cohort
          joinaggregate: [{ op: 'sum', field: VegaGroupedHistogram.COUNT, as: 'GroupCount' }],
          groupby: [DATA_LABEL],
        },
        {
          // items of a cohort's category divided by all items of the cohort -> rel frequency
          calculate: `datum.${VegaGroupedHistogram.COUNT}/datum.GroupCount`,
          as: 'PercentOfCohort',
        },
        {
          // count items of each category (used for sorting)
          joinaggregate: [{ op: 'sum', field: VegaGroupedHistogram.COUNT, as: 'CategoryItemSum' }],
          groupby: [DATA_LABEL],
        },
        {
          // count percentages of each category (used for sorting)
          joinaggregate: [{ op: 'sum', field: 'PercentOfCohort', as: 'CategoryPercentSum' }],
          groupby: [DATA_LABEL],
        },
      ],
      encoding: {
        row: {
          field: rowField,
          type: this.type,
          spacing: this.cohorts.length === 1 ? -2 : 4, // for no spacing: 0 is not enough, more than -2 makes no difference
          header: {
            labelAngle: 0,
            labelAlign: 'left',
            labels: rowField !== DATA_LABEL,
            title: this.attribute.label, // We will set a descriptive title for the whole plot
            titleAnchor: 'end',
          },
          sort:
            groupByConfig.getSelected().label === 'Same Cohort'
              ? null
              : sortByConfig.getSelected().label.includes('Name')
              ? (sortOrderConfig.getSelected().label.toLowerCase() as 'ascending' | 'descending')
              : {
                  field: dataConfig.getSelected().label === 'Absolute Counts' ? VegaGroupedHistogram.COUNT : 'PercentOfCohort',
                  op: sortByConfig.getSelected().label.includes('Average') ? 'average' : sortByConfig.getSelected().label.includes('Spread') ? 'stdev' : 'max',
                  order: sortOrderConfig.getSelected().label.toLowerCase() as 'ascending' | 'descending',
                },
        },
        x: {
          field: dataConfig.getSelected().label === 'Absolute Counts' ? VegaGroupedHistogram.COUNT : 'PercentOfCohort',
          title: dataConfig.getSelected().label === 'Absolute Counts' ? 'Count within Cohort' : 'Share within Cohort',
          type: 'quantitative',
          axis: {
            ...(dataConfig.getSelected().label === 'Absolute Counts' ? {} : { format: '.1~%' }),
            orient: 'top',
            grid: false, // no vertical lines (indicating the ticks on the axis)
          },
        },
        y: {
          field: yField,
          type: 'nominal',
          axis: rowField === DATA_LABEL ? { title: null, ticks: false, domain: false } : null, // hide cohort names
          sort:
            groupByConfig.getSelected().label === 'Same Category'
              ? null
              : sortByConfig.getSelected().label.includes('Name')
              ? (sortOrderConfig.getSelected().label.toLowerCase() as 'ascending' | 'descending')
              : {
                  field: dataConfig.getSelected().label === 'Absolute Counts' ? VegaGroupedHistogram.COUNT : 'PercentOfCohort',
                  op: sortByConfig.getSelected().label.includes('Average') ? 'average' : sortByConfig.getSelected().label.includes('Spread') ? 'stdev' : 'max',
                  order: sortOrderConfig.getSelected().label.toLowerCase() as 'ascending' | 'descending',
                },
        },
        color: {
          field: DATA_LABEL,
          type: 'nominal',
          sort: null,
          legend: null, // use custom legend
        },
        stroke: {
          field: DATA_LABEL, // same color as fill, except for hover
          type: 'nominal',
          sort: null, // no sorting
          condition: [
            {
              param: AVegaVisualization.HIGHLIGHT_SIGNAL_NAME,
              empty: false,
              value: colors.darkBorder,
            },
          ],
        },
        opacity: {
          condition: [
            // order is important, first match is used
            {
              param: AVegaVisualization.SELECTION_SIGNAL_NAME,
              value: 1,
            },
            {
              param: AVegaVisualization.HIGHLIGHT_SIGNAL_NAME,
              empty: false,
              value: 0.8, // not fully opaque --> you will notice a change when selection the bar
            },
          ],
          value: 0.3,
        },
        tooltip: [
          { field: this.field },
          { field: DATA_LABEL },
          { field: VegaGroupedHistogram.COUNT },
          { field: 'PercentOfCohort', title: this.cohorts.length === 1 ? 'Share' : 'Share per Cohort', format: '.1~%' },
        ],
      },
      resolve: groupByConfig.getSelected().label === 'Same Category' ? {} : { scale: { y: 'independent' } },
      view: { stroke: colors.lightBorder }, // border color between sub-charts
    };

    const vegaLiteSpec = Object.assign(histSpec, grpHistSpec) as VegaLiteSpec;
    return Object.assign(vegaLiteSpec, this.vegaLiteOptions);
  }

  /**
   * From == To for categorical data, e.g. FROM: male, TO: male
   * From is inclusive (>=) and TO exclusive (<) for numerical data, e.g. FROM 50 TO 60 = [50,60)
   */
  getSelectedData(): { cohort: ICohort; from: string | number; to: string | number }[] {
    let filters: { cohort: ICohort; from: string | number; to: string | number }[] = [];

    let vegaData = [];
    try {
      vegaData = this.vegaView.data(AVegaVisualization.DATA_STORE_3); // data store 3may be used depending on sorting and grouping combinations
    } catch {
      log.warn('could not access data_3, fallback to data_0.');
      vegaData = this.vegaView.data(AVegaVisualization.DATA_STORE_0); // use data store 0 (default), if the other does not exist
    }
    log.debug('vegaData', vegaData);

    const selectionData: any[] = this.vegaView.data(VegaHistogram.SELECTION_STORE);
    if (selectionData.length > 0) {
      const selectionVegaIds = selectionData.reduce((array, selectedItem) => array.push(...selectedItem.values) && array, []);
      log.debug('selectionData', selectionData);
      const filteredVegaData = vegaData.filter((dataItem) => selectionVegaIds.find((evItemId) => evItemId === dataItem._vgsid_));
      log.debug('filteredVegaData', filteredVegaData);

      filters = filteredVegaData.map((dataItem) => ({
        cohort: this.cohorts.find((cht) => getCohortLabel(cht) === dataItem[DATA_LABEL]),
        from: dataItem[this.field],
        to: dataItem[this.field],
      }));
    } else {
      // select all
      const rowDomain = this.vegaView.data('row_domain'); // default name
      this.cohorts.forEach((cohort) => filters.push(...rowDomain.map((datum) => ({ from: datum[this.field], to: datum[this.field], cohort }))));
    }

    log.debug('filters', filters);
    return filters;
  }
}
