import log from 'loglevel';
import { getCohortLabels } from '../../Cohort';
import { DATA_LABEL } from './constants';
import { MultiAttributeVisualization } from './MultiAttributeVisualization';
export class BarcodePlot extends MultiAttributeVisualization {
    constructor(vegaLiteOptions = {}) {
        super(vegaLiteOptions);
    }
    getSpec(data) {
        const catAttribute = this.attributes.find((attr) => attr.type === `categorical`);
        const numAttribute = this.attributes.find((attr) => attr.type === `number`);
        if (!catAttribute || !numAttribute) {
            throw new Error(`Barcode plot requires attributes of type number and categorical`);
        }
        const barcodeSpec = {
            '$schema': 'https://vega.github.io/schema/vega-lite/v4.json',
            data: { values: data },
            width: 'container',
            autosize: { type: 'fit', contains: 'padding' },
            padding: { left: 5, top: 0, right: 5, bottom: 0 },
            layer: [{
                    mark: { type: 'tick', 'opacity': 0.7, tooltip: true },
                    encoding: {
                        x: { field: numAttribute.dataKey, type: 'quantitative', title: null, scale: { clamp: true } },
                        y: { field: catAttribute.dataKey, type: 'nominal', title: null },
                        color: {
                            // bars will only change color on selection if the type is ordinal/nominal
                            // for quantitative this does not work due the applied data transofrmations (binning)
                            // which leads to errors on select/hovering selected data (data in the interval)
                            field: DATA_LABEL,
                            type: 'nominal',
                            scale: { domain: getCohortLabels(this.cohorts) },
                            legend: null // custom legend
                        }
                    }
                }, {
                    data: { name: 'splitvalues_x' },
                    mark: {
                        type: 'rule',
                        strokeDash: [4, 6]
                    },
                    encoding: {
                        x: { field: 'data', type: 'quantitative' }
                    }
                }],
            datasets: {
                splitvalues_x: this.splitValuesX,
            }
        };
        // Get base spec, merge with above
        const vegaLiteSpec = Object.assign(super.getSpec(data), barcodeSpec);
        this.addIntervalSelection(vegaLiteSpec); // add interval selection
        return Object.assign(vegaLiteSpec, this.vegaLiteOptions);
    }
    /**
     * From == To for categorical data, e.g. FROM: male, TO: male
     * From is inclusive (>=) and TO exclusive (<) for numerical data, e.g. FROM 50 TO 60 = [50,60)
     */
    getSelectedData() {
        return [];
        // const filters: {cohort: ICohort, from: string | number, to: string | number}[] = [];
        // if (!this.hideVisualization) {
        //   const selections = this.vegaView.signal(AVegaVisualization.SELECTION_SIGNAL_NAME);
        //   let attrSelection = selections[DensityPlot.TRANSFORMED_ATTRIBUTE]; // value == name applied through density transform
        //   if (!attrSelection || attrSelection.length !== 2) {
        //     attrSelection = this.vegaView.scale('x').domain();
        //   }
        //   this.cohorts.forEach((cohort) => {
        //     filters.push({from: attrSelection[0], to: attrSelection[1], cohort});
        //     const nullFilter = this.getNullValueSelectedData(cohort);
        //     if (nullFilter) {
        //       filters.push(nullFilter);
        //     }
        //   });
        // } else {
        //   this.cohorts.forEach((cohort) => {
        //     const nullFilter = this.getNullValueSelectedData(cohort);
        //     if (nullFilter) {
        //       filters.push(nullFilter);
        //     }
        //   });
        // }
        // log.debug('filters', filters);
        // return filters;
    }
    filter() {
        log.error('filter is not implemented');
    }
    split() {
        log.error('split is not implemented');
    }
}
BarcodePlot.NAME = 'Barcode Plot';
//# sourceMappingURL=Barcode.js.map