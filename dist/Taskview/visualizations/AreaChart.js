import log from 'loglevel';
import { getCohortLabels } from '../../Cohort';
import { DATA_LABEL } from './constants';
import { MultiAttributeVisualization } from './MultiAttributeVisualization';
export class AreaChart extends MultiAttributeVisualization {
    constructor(vegaLiteOptions = {}) {
        super(vegaLiteOptions);
    }
    getSpec(data) {
        if (!(this.attributes.length === 2 && this.attributes.every((attr) => ['categorical', 'string'].includes(attr.type)))) {
            throw new Error(`Area chart requires attributes of type categorical`); // TODO generalize, could also be used for binned numerical
        }
        const scatterSpec = {
            $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
            data: { values: data },
            padding: { left: 5, top: 0, right: 5, bottom: 0 },
            mark: { type: 'square', tooltip: true },
            encoding: {
                row: {
                    field: this.attributes[0].dataKey,
                    type: 'nominal',
                    spacing: -2,
                    header: {
                        labelAngle: 0,
                        labelAlign: 'left',
                        title: null // We will set a descriptive title for the whole plot
                    }
                },
                x: {
                    field: this.attributes[1].dataKey,
                    type: 'nominal',
                    title: null
                },
                y: {
                    field: DATA_LABEL,
                    type: 'nominal',
                    axis: null // hide cohort names
                },
                color: {
                    // bars will only change color on selection if the type is ordinal/nominal
                    // for quantitative this does not work due the applied data transofrmations (binning)
                    // which leads to errors on select/hovering selected data (data in the interval)
                    field: DATA_LABEL,
                    type: 'nominal',
                    scale: { domain: getCohortLabels(this.cohorts) },
                    legend: null // custom legend
                },
                size: {
                    aggregate: 'count',
                    type: 'quantitative',
                    scale: { type: 'linear' }
                }
            },
            view: { cursor: 'pointer' }
        };
        // Get base spec, merge with above
        const vegaLiteSpec = Object.assign(super.getSpec(data), scatterSpec);
        delete vegaLiteSpec.autosize; // does not work for facetted charts
        delete vegaLiteSpec.width; // determine by step size
        // this.addIntervalSelection(vegaLiteSpec); // add interval selection
        return Object.assign(vegaLiteSpec, this.vegaLiteOptions);
    }
    /**
     * From == To for categorical data, e.g. FROM: male, TO: male
     * From is inclusive (>=) and TO exclusive (<) for numerical data, e.g. FROM 50 TO 60 = [50,60)
     */
    getSelectedData() {
        return [];
    }
    filter() {
        log.error('filter is not implemented');
    }
    split() {
        log.error('split is not implemented');
    }
    addControls() {
        log.info('no controls for Area Chart yet');
    }
}
AreaChart.NAME = 'Area Chart';
//# sourceMappingURL=AreaChart.js.map