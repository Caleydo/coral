import { colors } from '../../colors';
import { log } from '../../util';
import { AVegaVisualization, SingleAttributeVisualization } from './AVegaVisualization';
import { DATA_LABEL } from './constants';
export class VegaHistogram extends SingleAttributeVisualization {
    constructor() {
        super(...arguments);
        this.sort = null; // == no sort by default}
    }
    getSpec(data) {
        this.field = this.attribute.dataKey;
        this.type = this.attribute.type === `number` ? 'quantitative' : 'nominal';
        const bin = this.type === `quantitative`;
        if (this.type === 'nominal') {
            this.sort = '-x'; // one more transformation! (data_1 isntead data_0)
        }
        else {
            this.sort = 'ascending';
        }
        const vegaLiteSpecPart = {
            mark: {
                type: 'bar',
                tooltip: true,
                cursor: 'pointer',
                height: 15
            },
            encoding: {
                [this.type === 'quantitative' ? 'x' : 'y']: {
                    bin,
                    field: this.field,
                    type: this.type,
                    sort: this.sort,
                    title: this.attribute.label,
                    scale: { clamp: true }
                },
                [this.type === 'quantitative' ? 'y' : 'x']: {
                    aggregate: 'count',
                    type: 'quantitative',
                    axis: {
                        orient: this.type === 'quantitative' ? 'left' : 'top'
                    },
                    title: 'Count'
                },
                color: {
                    field: DATA_LABEL,
                    type: 'nominal',
                    legend: null // use custom legend
                },
                stroke: {
                    field: DATA_LABEL,
                    type: 'nominal',
                    condition: [
                        {
                            param: AVegaVisualization.HIGHLIGHT_SIGNAL_NAME,
                            empty: false,
                            value: colors.darkBorder
                        }
                    ]
                },
                opacity: {
                    condition: [
                        {
                            param: AVegaVisualization.SELECTION_SIGNAL_NAME,
                            value: 1
                        },
                        {
                            param: AVegaVisualization.HIGHLIGHT_SIGNAL_NAME,
                            empty: false,
                            value: 0.8 // not fully opaque --> you will notice a change when selection the bar
                        }
                    ],
                    value: 0.3
                }
            }
        };
        const histSpec = Object.assign(super.getSpec(data), vegaLiteSpecPart); //the combination gives a full spec
        this.addHoverSelection(histSpec);
        if (this.type === 'quantitative') {
            this.addIntervalSelection(histSpec);
        }
        else {
            this.addMultiSelection(histSpec);
        }
        return Object.assign(histSpec, this.vegaLiteOptions);
    }
    /**
     * From == To for categorical data, e.g. FROM: male, TO: male
     * From is inclusive (>=) and TO exclusive (<) for numerical data, e.g. FROM 50 TO 60 = [50,60)
     */
    getSelectedData() {
        const filters = [];
        if (this.type === 'quantitative') {
            if (!this.hideVisualization) {
                const selections = this.vegaView.signal(AVegaVisualization.SELECTION_SIGNAL_NAME);
                let attrSelection = selections[this.field];
                if (!attrSelection || attrSelection.length !== 2) {
                    attrSelection = this.vegaView.scale('x').domain();
                }
                this.cohorts.forEach((cohort) => {
                    filters.push({ from: attrSelection[0], to: attrSelection[1], cohort });
                    const nullFilter = this.getNullValueSelectedData(cohort, this.attribute);
                    if (nullFilter) {
                        filters.push(nullFilter);
                    }
                });
            }
            else {
                this.cohorts.forEach((cohort) => {
                    const nullFilter = this.getNullValueSelectedData(cohort, this.attribute);
                    if (nullFilter) {
                        filters.push(nullFilter);
                    }
                });
            }
        }
        else {
            const dataStore = this.sort === '-x' || this.sort === 'x' ? AVegaVisualization.DATA_STORE_1 : AVegaVisualization.DATA_STORE_0; // sorting by frequency adds one more transformation, i.e. data array -> data_1
            const vegaData = this.vegaView.data(dataStore); //default name
            log.debug('vegaData', vegaData);
            const selectionData = this.vegaView.data(AVegaVisualization.SELECTION_STORE);
            if (selectionData.length > 0) {
                const selectionVegaIds = selectionData.reduce((array, selectedItem) => array.push(...selectedItem.values) && array, []);
                log.debug('selectionData', selectionData);
                const filteredVegaData = vegaData.filter((dataItem) => selectionVegaIds.find((evItemId) => evItemId === dataItem._vgsid_));
                log.debug('filteredVegaData', filteredVegaData);
                // if ordinal or nominal, we can get the selected bins by the name of field
                const selectedBins = filteredVegaData.map((dataItem) => dataItem[this.field]);
                this.cohorts.forEach((cohort) => filters.push(...selectedBins.map((bin) => ({ from: bin, to: bin, cohort }))));
            }
            else {
                //select all
                this.cohorts.forEach((cohort) => filters.push(...vegaData.map((datum) => ({ from: datum[this.field], to: datum[this.field], cohort }))));
            }
        }
        log.debug('filters', filters);
        return filters;
    }
}
VegaHistogram.NAME = 'Histogram';
//# sourceMappingURL=Histogram.js.map