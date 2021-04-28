import * as merge from 'lodash.merge';
import { colors } from '../../colors';
import { log } from '../../util';
import { AVegaVisualization } from './AVegaVisualization';
import { DATA_LABEL } from './constants';
import { VegaHistogram } from './Histogram';
import { getCohortLabel } from '../../Cohort';
export class VegaGroupedHistogram extends VegaHistogram {
    constructor(vegaLiteOptions = {}) {
        super(vegaLiteOptions);
        this.type = 'nominal';
        this.options
            .set('Relative Frequencies', (rowField, chtCount) => ({
            encoding: {
                x: {
                    field: 'PercentOfCohort',
                    title: 'Share within Cohort',
                    axis: {
                        format: '.1~%'
                    }
                },
                row: { sort: { field: 'CategoryPercentSum', order: 'descending' } }
            }
        }))
            .set('Absolute Counts', (rowField, chtCount) => ({
            encoding: {
                x: {
                    field: VegaGroupedHistogram.COUNT,
                    title: 'Count within Cohort',
                },
                row: { sort: { field: 'CategoryItemSum', order: 'descending' } }
            }
        })); //simply aggregate by count
    }
    getSpec(data) {
        if (this.attribute.type === `number`) {
            throw new Error('Type "number" is not supported for grouped histograms');
        }
        const histSpec = super.getSpec(data);
        delete histSpec.autosize; // does not work for facetted charts, see https://github.com/Caleydo/cohort/issues/121
        delete histSpec.encoding; // make new encoding for groupedhistogram
        const grpHistSpec = {
            width: 300,
            transform: [{
                    aggregate: [{ op: 'count', as: VegaGroupedHistogram.COUNT }],
                    groupby: [this.field, DATA_LABEL]
                }, {
                    joinaggregate: [{ op: 'sum', field: VegaGroupedHistogram.COUNT, as: 'CohortCount' }],
                    groupby: [DATA_LABEL]
                }, {
                    joinaggregate: [{ op: 'sum', field: VegaGroupedHistogram.COUNT, as: 'CategoryItemSum' }],
                    groupby: [this.field]
                }, {
                    calculate: `datum.${VegaGroupedHistogram.COUNT}/datum.CohortCount`, as: 'PercentOfCohort'
                }, {
                    joinaggregate: [{ op: 'sum', field: 'PercentOfCohort', as: 'CategoryPercentSum' }],
                    groupby: [this.field]
                }
            ],
            encoding: {
                row: {
                    field: this.field,
                    type: this.type,
                    spacing: this.cohorts.length === 1 ? -2 : 4,
                    header: {
                        labelAngle: 0,
                        labelAlign: 'left',
                        title: this.attribute.label,
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
                    legend: null // use custom legend
                },
                fillOpacity: {
                    condition: [
                        {
                            test: {
                                or: [
                                    { selection: AVegaVisualization.SELECTION_SIGNAL_NAME },
                                    { selection: AVegaVisualization.HIGHLIGHT_SIGNAL_NAME }
                                ]
                            },
                            value: 1
                        }
                    ],
                    value: 0.3
                },
                tooltip: [
                    { field: this.field },
                    { field: DATA_LABEL },
                    { field: VegaGroupedHistogram.COUNT },
                    { field: 'PercentOfCohort', title: this.cohorts.length === 1 ? 'Share' : 'Share per Cohort', format: '.1~%' }
                ]
            },
            view: { stroke: colors.lightBorder } // border color between sub-charts
        };
        const optionedSpec = merge(grpHistSpec, this.getOptionSpec()(this.field, this.cohorts.length));
        const vegaLiteSpec = Object.assign(histSpec, optionedSpec);
        return Object.assign(vegaLiteSpec, this.vegaLiteOptions);
    }
    /**
     * From == To for categorical data, e.g. FROM: male, TO: male
     * From is inclusive (>=) and TO exclusive (<) for numerical data, e.g. FROM 50 TO 60 = [50,60)
     */
    getSelectedData() {
        let filters = [];
        const vegaData = this.vegaView.data(AVegaVisualization.DATA_STORE_0); //default name
        log.debug('vegaData', vegaData);
        const selectionData = this.vegaView.data(VegaHistogram.SELECTION_STORE);
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
        }
        else {
            //select all
            const rowDomain = this.vegaView.data('row_domain'); //default name
            this.cohorts.forEach((cohort) => filters.push(...rowDomain.map((datum) => ({ from: datum[this.field], to: datum[this.field], cohort }))));
        }
        log.debug('filters', filters);
        return filters;
    }
}
VegaGroupedHistogram.COUNT = 'Count';
//# sourceMappingURL=GroupedHistogram.js.map