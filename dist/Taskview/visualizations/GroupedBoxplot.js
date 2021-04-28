import { format } from 'd3-format';
import { select } from 'd3-selection';
import * as loMerge from 'lodash.merge';
import log from 'loglevel';
import { getCohortLabels } from '../../Cohort';
import { NumRangeOperators } from '../../rest';
import { FilterEvent, SplitEvent } from '../../utilCustomEvents';
import { AVegaVisualization } from './AVegaVisualization';
import { BRUSH_DATA_END, BRUSH_DATA_NAME, BRUSH_DATA_START, DATA_LABEL } from './constants';
import { MultiAttributeVisualization } from './MultiAttributeVisualization';
export class GroupedBoxplot extends MultiAttributeVisualization {
    constructor(vegaLiteOptions = {}) {
        super(vegaLiteOptions);
        this.brushData = [];
    }
    async showImpl(chart, data) {
        await super.showImpl(chart, data);
        //use a datalistener instead of signallistener:
        this.vegaView.addSignalListener(AVegaVisualization.SELECTION_SIGNAL_NAME, this.vegaBrushListener);
    }
    getSpec(data) {
        this.catAttribute = this.attributes.find((attr) => attr.type === `categorical`);
        this.numAttribute = this.attributes.find((attr) => attr.type === `number`);
        if (!this.catAttribute || !this.numAttribute) {
            throw new Error(`Boxplot requires attributes of type number and categorical`);
        }
        const superSpec = super.getSpec(data);
        delete superSpec.autosize; // does not work for facetted charts, see https://github.com/Caleydo/cohort/issues/121
        delete superSpec.width; // moves into "spec"
        const boxplotSpec = this.generateSpec(this.catAttribute, this.numAttribute);
        // Get base spec, merge with above
        const vegaLiteSpec = loMerge(superSpec, boxplotSpec);
        return Object.assign(vegaLiteSpec, this.vegaLiteOptions);
    }
    generateSpec(catAttribute, numAttribute) {
        const customBrushMarks = {
            data: { name: BRUSH_DATA_NAME },
            mark: { type: 'rect', color: '#333', opacity: 0.125 },
            encoding: {
                x: {
                    field: BRUSH_DATA_START,
                    type: 'quantitative',
                    scale: { 'zero': false } // i.e. make x scale dependent on other layer(s)
                },
                x2: { field: BRUSH_DATA_END },
                color: { value: '#333' },
                opacity: { value: 0.125 }
            }
        };
        this.addIntervalSelection(customBrushMarks);
        // tooltips not visible, see https://github.com/vega/vega-lite/issues/6822
        const boxplotSpec = {
            spacing: { row: 0 },
            facet: {
                row: {
                    field: catAttribute.dataKey,
                    type: 'nominal',
                    header: {
                        titleAnchor: 'end',
                        title: catAttribute.label,
                        labelAngle: 0,
                        labelAlign: 'left'
                    }
                }
            },
            spec: {
                width: 350,
                layer: [
                    {
                        ...customBrushMarks
                    },
                    {
                        layer: [
                            {
                                transform: [
                                    {
                                        joinaggregate: [
                                            {
                                                op: 'q1',
                                                field: numAttribute.dataKey,
                                                as: `lower_box_${numAttribute.dataKey}`
                                            },
                                            {
                                                op: 'q3',
                                                field: numAttribute.dataKey,
                                                as: `upper_box_${numAttribute.dataKey}`
                                            }
                                        ],
                                        groupby: [DATA_LABEL, DATA_LABEL]
                                    }
                                ],
                                layer: [
                                    {
                                        transform: [
                                            {
                                                filter: `(datum["${numAttribute.dataKey}"] < datum["lower_box_${numAttribute.dataKey}"] - 1.5 * (datum["upper_box_${numAttribute.dataKey}"] - datum["lower_box_${numAttribute.dataKey}"])) || (datum["${numAttribute.dataKey}"] > datum["upper_box_${numAttribute.dataKey}"] + 1.5 * (datum["upper_box_${numAttribute.dataKey}"] - datum["lower_box_${numAttribute.dataKey}"]))`
                                            }
                                        ],
                                        mark: { type: 'point', style: 'boxplot-outliers' },
                                        encoding: {
                                            x: {
                                                field: numAttribute.dataKey,
                                                type: 'quantitative',
                                                title: numAttribute.label,
                                                scale: { clamp: true, type: numAttribute.preferLog ? 'log' : 'linear' },
                                                axis: { orient: 'top' }
                                            },
                                            y: { field: DATA_LABEL, type: 'nominal', axis: null },
                                            color: {
                                                field: DATA_LABEL,
                                                type: 'nominal',
                                                legend: null,
                                                scale: { domain: getCohortLabels(this.cohorts) }
                                            }
                                        }
                                    },
                                    {
                                        transform: [
                                            {
                                                filter: `(datum["lower_box_${numAttribute.dataKey}"] - 1.5 * (datum["upper_box_${numAttribute.dataKey}"] - datum["lower_box_${numAttribute.dataKey}"]) <= datum["${numAttribute.dataKey}"]) && (datum["${numAttribute.dataKey}"] <= datum["upper_box_${numAttribute.dataKey}"] + 1.5 * (datum["upper_box_${numAttribute.dataKey}"] - datum["lower_box_${numAttribute.dataKey}"]))`
                                            },
                                            {
                                                aggregate: [
                                                    {
                                                        op: 'min',
                                                        field: numAttribute.dataKey,
                                                        as: `lower_whisker_${numAttribute.dataKey}`
                                                    },
                                                    {
                                                        op: 'max',
                                                        field: numAttribute.dataKey,
                                                        as: `upper_whisker_${numAttribute.dataKey}`
                                                    },
                                                    {
                                                        op: 'min',
                                                        field: `lower_box_${numAttribute.dataKey}`,
                                                        as: `lower_box_${numAttribute.dataKey}`
                                                    },
                                                    {
                                                        op: 'max',
                                                        field: `upper_box_${numAttribute.dataKey}`,
                                                        as: `upper_box_${numAttribute.dataKey}`
                                                    }
                                                ],
                                                groupby: [DATA_LABEL, DATA_LABEL]
                                            }
                                        ],
                                        layer: [
                                            {
                                                mark: {
                                                    type: 'rule',
                                                    aria: false,
                                                    style: 'boxplot-rule'
                                                },
                                                encoding: {
                                                    x: {
                                                        field: `lower_whisker_${numAttribute.dataKey}`,
                                                        type: 'quantitative',
                                                        title: numAttribute.label,
                                                        scale: { clamp: true, type: numAttribute.preferLog ? 'log' : 'linear' },
                                                        axis: { orient: 'top' }
                                                    },
                                                    x2: { field: `lower_box_${numAttribute.dataKey}` },
                                                    y: { field: DATA_LABEL, type: 'nominal', axis: null },
                                                    tooltip: [
                                                        {
                                                            field: `upper_whisker_${numAttribute.dataKey}`,
                                                            type: 'quantitative',
                                                            title: `Upper Whisker of ${numAttribute.label}`
                                                        },
                                                        {
                                                            field: `lower_whisker_${numAttribute.dataKey}`,
                                                            type: 'quantitative',
                                                            title: `Lower Whisker of ${numAttribute.label}`
                                                        },
                                                        { field: DATA_LABEL, type: 'nominal' }
                                                    ]
                                                }
                                            },
                                            {
                                                mark: {
                                                    type: 'rule',
                                                    aria: false,
                                                    style: 'boxplot-rule'
                                                },
                                                encoding: {
                                                    x: {
                                                        field: `upper_box_${numAttribute.dataKey}`,
                                                        type: 'quantitative',
                                                        title: numAttribute.label,
                                                        scale: { clamp: true, type: numAttribute.preferLog ? 'log' : 'linear' },
                                                        axis: { orient: 'top' }
                                                    },
                                                    x2: { field: `upper_whisker_${numAttribute.dataKey}` },
                                                    y: { field: DATA_LABEL, type: 'nominal', axis: null },
                                                    tooltip: [
                                                        {
                                                            field: `upper_whisker_${numAttribute.dataKey}`,
                                                            type: 'quantitative',
                                                            title: `Upper Whisker of ${numAttribute.label}`
                                                        },
                                                        {
                                                            field: `lower_whisker_${numAttribute.dataKey}`,
                                                            type: 'quantitative',
                                                            title: `Lower Whisker of ${numAttribute.label}`
                                                        },
                                                        { field: DATA_LABEL, type: 'nominal' }
                                                    ]
                                                }
                                            }
                                        ]
                                    }
                                ]
                            },
                            {
                                transform: [
                                    {
                                        aggregate: [
                                            {
                                                op: 'q1',
                                                field: numAttribute.dataKey,
                                                as: `lower_box_${numAttribute.dataKey}`
                                            },
                                            {
                                                op: 'q3',
                                                field: numAttribute.dataKey,
                                                as: `upper_box_${numAttribute.dataKey}`
                                            },
                                            {
                                                op: 'median',
                                                field: numAttribute.dataKey,
                                                as: `mid_box_${numAttribute.dataKey}`
                                            },
                                            {
                                                op: 'min',
                                                field: numAttribute.dataKey,
                                                as: `min_${numAttribute.dataKey}`
                                            },
                                            { op: 'max', field: numAttribute.dataKey, as: `max_${numAttribute.dataKey}` }
                                        ],
                                        groupby: [DATA_LABEL, DATA_LABEL]
                                    }
                                ],
                                layer: [
                                    {
                                        mark: {
                                            type: 'bar',
                                            size: 14,
                                            orient: 'horizontal',
                                            ariaRoleDescription: 'box',
                                            style: 'boxplot-box'
                                        },
                                        encoding: {
                                            x: {
                                                field: `lower_box_${numAttribute.dataKey}`,
                                                type: 'quantitative',
                                                title: numAttribute.label,
                                                scale: { clamp: true, type: numAttribute.preferLog ? 'log' : 'linear' },
                                                axis: { orient: 'top' }
                                            },
                                            x2: { field: `upper_box_${numAttribute.dataKey}` },
                                            y: { field: DATA_LABEL, type: 'nominal', axis: null },
                                            color: {
                                                field: DATA_LABEL,
                                                type: 'nominal',
                                                legend: null,
                                                scale: { domain: getCohortLabels(this.cohorts) }
                                            },
                                            tooltip: [
                                                {
                                                    field: `max_${numAttribute.dataKey}`,
                                                    type: 'quantitative',
                                                    title: `Max of ${numAttribute.label}`
                                                },
                                                {
                                                    field: `upper_box_${numAttribute.dataKey}`,
                                                    type: 'quantitative',
                                                    title: `Q3 of ${numAttribute.label}`
                                                },
                                                {
                                                    field: `mid_box_${numAttribute.dataKey}`,
                                                    type: 'quantitative',
                                                    title: `Median of ${numAttribute.label}`
                                                },
                                                {
                                                    field: `lower_box_${numAttribute.dataKey}`,
                                                    type: 'quantitative',
                                                    title: `Q1 of ${numAttribute.label}`
                                                },
                                                {
                                                    field: `min_${numAttribute.dataKey}`,
                                                    type: 'quantitative',
                                                    title: `Min of ${numAttribute.label}`
                                                },
                                                { field: DATA_LABEL, type: 'nominal' }
                                            ]
                                        }
                                    }, {
                                        mark: {
                                            color: 'black',
                                            size: 14,
                                            thickness: 2,
                                            type: 'tick',
                                            orient: 'vertical',
                                            aria: false,
                                            style: 'boxplot-median'
                                        },
                                        encoding: {
                                            x: {
                                                field: `mid_box_${numAttribute.dataKey}`,
                                                type: 'quantitative',
                                                title: numAttribute.label,
                                                scale: { clamp: true, type: numAttribute.preferLog ? 'log' : 'linear' },
                                                axis: { orient: 'top' }
                                            },
                                            y: { field: DATA_LABEL, type: 'nominal', axis: null },
                                            tooltip: [
                                                {
                                                    field: `max_${numAttribute.dataKey}`,
                                                    type: 'quantitative',
                                                    title: `Max of ${numAttribute.label}`
                                                },
                                                {
                                                    field: `upper_box_${numAttribute.dataKey}`,
                                                    type: 'quantitative',
                                                    title: `Q3 of ${numAttribute.label}`
                                                },
                                                {
                                                    field: `mid_box_${numAttribute.dataKey}`,
                                                    type: 'quantitative',
                                                    title: `Median of ${numAttribute.label}`
                                                },
                                                {
                                                    field: `lower_box_${numAttribute.dataKey}`,
                                                    type: 'quantitative',
                                                    title: `Q1 of ${numAttribute.label}`
                                                },
                                                {
                                                    field: `min_${numAttribute.dataKey}`,
                                                    type: 'quantitative',
                                                    title: `Min of ${numAttribute.label}`
                                                },
                                                { field: DATA_LABEL, type: 'nominal' }
                                            ]
                                        }
                                    }
                                ]
                            }, {
                                data: { name: 'splitvalues_x' },
                                mark: {
                                    type: 'rule',
                                    clip: true,
                                    strokeDash: [4, 2]
                                },
                                encoding: {
                                    x: { field: 'data', type: 'quantitative' }
                                }
                            }
                        ]
                    }
                ]
            },
            config: { view: { cursor: 'text' } },
            datasets: {
                splitvalues_x: this.splitValuesX,
                [BRUSH_DATA_NAME]: this.brushData
            }
        };
        return boxplotSpec;
    }
    addIntervalSelection(spec) {
        if (!spec.selection) { // create if not existing
            spec.selection = {};
        }
        const range = this.getFilterRange('x');
        Object.assign(spec.selection, {
            [AVegaVisualization.SELECTION_SIGNAL_NAME]: {
                type: 'interval',
                mark: { fillOpacity: 0, strokeOpacity: 0, cursor: 'pointer' },
                empty: 'all',
                encodings: ['x'],
                ...(range.length > 0 ? { init: { x: range } } : {}),
                resolve: 'global'
            }
        });
    }
    addIntervalControls(attributeLabel, axis) {
        super.addIntervalControls(attributeLabel, 'x'); //always x
    }
    handleInputIntervalEvent(event) {
        this.vegaView.removeSignalListener(AVegaVisualization.SELECTION_SIGNAL_NAME, this.vegaBrushListener); //remove listener temporarily
        const range = this.getInterval('x');
        log.debug('range', range);
        const scale = this.vegaView.scale('x');
        const newRange = scale.domain();
        // if one or both ranges are set, replace with values
        if (range[0] !== undefined && !isNaN(range[0])) {
            newRange[0] = range[0]; // get min value from input
        }
        if (range[1] !== undefined && !isNaN(range[1])) {
            newRange[1] = range[1]; // get max value from input
            if (range[0] === range[1]) {
                newRange[1] = scale.invert(scale(range[1]) + Math.pow(10, -10)); // the 10^(-10) are independent of the attribute domain (i.e. values of 0 to 1 or in millions) because we add it after scaling (its a fraction of a pixel)
            }
        }
        log.info('scaledRange', newRange);
        // Set brushes' data
        this.brushData = [{ [BRUSH_DATA_START]: newRange[0], [BRUSH_DATA_END]: newRange[1] }];
        this.vegaView.data(BRUSH_DATA_NAME, this.brushData);
        this.clearSelection(); // clear Vega's transparent brush because it no longer matches the custom brushes
        this.vegaView.runAsync(); // update the chart
        this.vegaView.addSignalListener(AVegaVisualization.SELECTION_SIGNAL_NAME, this.vegaBrushListener); //remove listener temporarily
    }
    handleVegaIntervalEvent(name, interval) {
        log.debug(name, interval);
        if (this.showBrush) {
            if (interval[BRUSH_DATA_START]) {
                const lowerBound = interval[BRUSH_DATA_START][0];
                const upperBound = interval[BRUSH_DATA_START][1];
                const inputs = select(this.controls).selectAll('input.interval');
                inputs.on('change', null); //remove listeners temporarily
                const formatter = format('.4~f');
                select(this.controls).selectAll('input.minimum').node().value = formatter(lowerBound);
                select(this.controls).selectAll('input.maximum').node().value = formatter(upperBound);
                // Set brushes' data
                this.brushData = [{ [BRUSH_DATA_START]: lowerBound, [BRUSH_DATA_END]: upperBound }];
                this.vegaView.data(BRUSH_DATA_NAME, this.brushData);
                const that = this; //helper varible to access this instance in the d3 event handler function
                inputs.on('change', function () {
                    const d3Event = this; // because we use a function this is overwritten by d3, asssign to variable for clarity
                    that.handleInputIntervalEvent.bind(that)(d3Event); // voodoo magic (👺) to set this back to the current instance
                }); //add  listeners again
            }
            else {
                select(this.controls).selectAll('input.minimum').node().value = '';
                select(this.controls).selectAll('input.maximum').node().value = ''; // Set brushes' data
                this.brushData = [];
                this.vegaView.data(BRUSH_DATA_NAME, this.brushData);
            }
            this.vegaView.runAsync(); // update the custom brush in the chart
        }
        else {
            // nothing to do because the vega brush is transparent
        }
    }
    clearSelection() {
        super.clearSelection();
        this.brushData = [];
        this.vegaView.data(BRUSH_DATA_NAME, this.brushData);
        this.vegaView.runAsync();
    }
    getSelectedData() {
        return [];
    }
    filter() {
        const interval = this.getInterval('x');
        const range = [{
                operatorOne: NumRangeOperators.gte,
                valueOne: interval[0],
                operatorTwo: NumRangeOperators.lte,
                valueTwo: interval[1]
            }];
        const categories = this.vegaView.data('row_domain').map((row) => row[this.catAttribute.dataKey]);
        const filterDescs = [];
        for (const cht of this.cohorts) { //every cohort
            // NUM Filter
            for (const cat of categories) { // every category
                const filter = [];
                // filter by numerical range and ...
                filter.push({
                    attr: this.numAttribute,
                    range
                });
                // ... filter by category
                filter.push({
                    attr: this.catAttribute,
                    range: { values: [cat] }
                });
                // store filter with cohort
                filterDescs.push({
                    cohort: cht,
                    filter
                });
            }
        }
        this.container.dispatchEvent(new FilterEvent(filterDescs));
    }
    split() {
        const categories = this.vegaView.data('row_domain').map((row) => row[this.catAttribute.dataKey]);
        const [minX, maxX] = this.vegaView.scale('x').domain();
        const filterDescs = [];
        for (const cht of this.cohorts) { //every cohort
            // NUM Filter
            for (const cat of categories) { // every category
                for (const [ix, splitX] of [...this.splitValuesX, maxX].entries()) { //every range
                    const filter = [];
                    // filter by numerical range and ...
                    filter.push({
                        attr: this.numAttribute,
                        range: [this.getGeneralNumericalFilter(ix >= 1 ? this.splitValuesX[ix - 1] : minX, splitX, NumRangeOperators.gte, splitX === maxX ? NumRangeOperators.lte : NumRangeOperators.lt)
                        ]
                    });
                    // ... filter by category
                    filter.push({
                        attr: this.catAttribute,
                        range: { values: [cat] }
                    });
                    // store filter with cohort
                    filterDescs.push({
                        cohort: cht,
                        filter
                    });
                }
            }
        }
        this.container.dispatchEvent(new SplitEvent(filterDescs));
    }
}
GroupedBoxplot.NAME = 'Boxplot';
//# sourceMappingURL=GroupedBoxplot.js.map