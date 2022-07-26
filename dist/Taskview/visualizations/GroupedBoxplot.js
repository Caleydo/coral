import { format } from 'd3-format';
import { select } from 'd3-selection';
import log from 'loglevel';
import { NumRangeOperators } from '../../rest';
import { FilterEvent, SplitEvent } from '../../utilCustomEvents';
import { AVegaVisualization } from './AVegaVisualization';
import { groupByConfig } from './config/GroupConfig';
import { BRUSH_DATA_END, BRUSH_DATA_NAME, BRUSH_DATA_START, DATA_LABEL } from './constants';
import { MultiAttributeVisualization } from './MultiAttributeVisualization';
export class GroupedBoxplot extends MultiAttributeVisualization {
    constructor(vegaLiteOptions = {}) {
        super(vegaLiteOptions);
        this.brushData = [];
        this.config = [
            { icon: '<i class="fas fa-sitemap fa-rotate-270"></i>', label: 'Group', groups: [groupByConfig] }
        ];
    }
    async showImpl(chart, data) {
        await super.showImpl(chart, data);
        this.vegaView.addSignalListener(AVegaVisualization.SELECTION_SIGNAL_NAME, this.vegaBrushListener);
        this.toggleFilterSplitMarks(this.getActiveTask());
    }
    addIntervalSelection(spec) {
        if (!spec.params) { // create if not existing
            spec.params = [];
        }
        const range = this.getFilterRange('x');
        spec.params.push({
            name: AVegaVisualization.SELECTION_SIGNAL_NAME,
            select: {
                type: 'interval',
                mark: { fillOpacity: 0, strokeOpacity: 0, cursor: 'pointer' },
                encodings: ['x'],
                resolve: 'global'
            },
            ...(range.length > 0 ? { value: { x: range } } : {})
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
        super.clearSelection(); // clear Vega's transparent brush because it no longer matches the custom brushes
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
        if (this.getNullCheckboxState(this.numAttribute)) {
            range.push({
                operatorOne: NumRangeOperators.gte,
                valueOne: null,
                operatorTwo: NumRangeOperators.lte,
                valueTwo: null
            });
        }
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
                    range: { values: [String(cat)] }
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
                        range: { values: [String(cat)] }
                    });
                    // store filter with cohort
                    filterDescs.push({
                        cohort: cht,
                        filter
                    });
                }
                if (this.getNullCheckboxState(this.numAttribute)) {
                    filterDescs.push({
                        cohort: cht,
                        filter: [
                            {
                                attr: this.numAttribute,
                                range: [{ operatorOne: NumRangeOperators.gte, valueOne: null, operatorTwo: NumRangeOperators.lte, valueTwo: null }]
                            },
                            { attr: this.catAttribute, range: { values: [String(cat)] } }
                        ]
                    });
                }
            }
        }
        this.container.dispatchEvent(new SplitEvent(filterDescs));
    }
    getSpec(data) {
        this.catAttribute = this.attributes.find((attr) => ['categorical', 'string'].includes(attr.type));
        this.numAttribute = this.attributes.find((attr) => attr.type === `number`);
        if (!this.catAttribute || !this.numAttribute) {
            throw new Error(`Boxplot requires attributes of type number and categorical`);
        }
        const [yField, rowField] = groupByConfig.getSelected().label === 'Same Category' ? [DATA_LABEL, this.catAttribute.dataKey] : [this.catAttribute.dataKey, DATA_LABEL];
        const vegaSpec = {
            $schema: `https://vega.github.io/schema/vega/v5.json`,
            background: `white`,
            padding: { left: 5, top: 0, right: 5, bottom: 5 },
            data: [
                { name: `selected_store` },
                {
                    name: `source_0`,
                    values: data
                },
                { name: BRUSH_DATA_NAME, values: this.brushData },
                {
                    name: `splitvalues_x`, values: this.splitValuesX,
                    on: [
                        {
                            trigger: `draggedMark_x`,
                            modify: `draggedMark_x`,
                            values: `dragTo_x`
                        },
                        {
                            trigger: `addMark_x`,
                            insert: `addMark_x`
                        },
                        {
                            trigger: `remMark_x`,
                            remove: `remMark_x`
                        }
                    ]
                },
                {
                    name: `row_domain`,
                    source: `source_0`,
                    transform: [{ type: `aggregate`, groupby: [rowField] }]
                },
                {
                    name: `data_2`,
                    source: `source_0`,
                    transform: [
                        {
                            type: `joinaggregate`,
                            as: [`lower_box_${this.numAttribute.dataKey}`, `upper_box_${this.numAttribute.dataKey}`],
                            ops: [`q1`, `q3`],
                            fields: [`${this.numAttribute.dataKey}`, `${this.numAttribute.dataKey}`],
                            groupby: [yField, rowField]
                        }
                    ]
                },
                {
                    name: `data_3`,
                    source: `data_2`,
                    transform: [
                        {
                            type: `filter`,
                            expr: `(datum['${this.numAttribute.dataKey}'] < datum['lower_box_${this.numAttribute.dataKey}'] - 1.5 * (datum['upper_box_${this.numAttribute.dataKey}'] - datum['lower_box_${this.numAttribute.dataKey}'])) || (datum['${this.numAttribute.dataKey}'] > datum['upper_box_${this.numAttribute.dataKey}'] + 1.5 * (datum['upper_box_${this.numAttribute.dataKey}'] - datum['lower_box_${this.numAttribute.dataKey}']))`
                        },
                        {
                            type: `filter`,
                            expr: `isValid(datum['${this.numAttribute.dataKey}']) && isFinite(+datum['${this.numAttribute.dataKey}'])`
                        }
                    ]
                },
                {
                    name: `data_4`,
                    source: `data_2`,
                    transform: [
                        {
                            type: `filter`,
                            expr: `(datum['lower_box_${this.numAttribute.dataKey}'] - 1.5 * (datum['upper_box_${this.numAttribute.dataKey}'] - datum['lower_box_${this.numAttribute.dataKey}']) <= datum['${this.numAttribute.dataKey}']) && (datum['${this.numAttribute.dataKey}'] <= datum['upper_box_${this.numAttribute.dataKey}'] + 1.5 * (datum['upper_box_${this.numAttribute.dataKey}'] - datum['lower_box_${this.numAttribute.dataKey}']))`
                        },
                        {
                            type: `aggregate`,
                            groupby: [yField, rowField],
                            ops: [`min`, `max`, `min`, `max`],
                            fields: [`${this.numAttribute.dataKey}`, `${this.numAttribute.dataKey}`, `lower_box_${this.numAttribute.dataKey}`, `upper_box_${this.numAttribute.dataKey}`],
                            as: [
                                `lower_whisker_${this.numAttribute.dataKey}`,
                                `upper_whisker_${this.numAttribute.dataKey}`,
                                `lower_box_${this.numAttribute.dataKey}`,
                                `upper_box_${this.numAttribute.dataKey}`
                            ]
                        }
                    ]
                },
                {
                    name: `data_5`,
                    source: `source_0`,
                    transform: [
                        {
                            type: `aggregate`,
                            groupby: [yField, rowField],
                            ops: [`q1`, `q3`, `median`, `min`, `max`],
                            fields: [`${this.numAttribute.dataKey}`, `${this.numAttribute.dataKey}`, `${this.numAttribute.dataKey}`, `${this.numAttribute.dataKey}`, `${this.numAttribute.dataKey}`],
                            as: [
                                `lower_box_${this.numAttribute.dataKey}`,
                                `upper_box_${this.numAttribute.dataKey}`,
                                `mid_box_${this.numAttribute.dataKey}`,
                                `min_${this.numAttribute.dataKey}`,
                                `max_${this.numAttribute.dataKey}`
                            ]
                        }
                    ]
                },
                {
                    name: `data_6`,
                    source: BRUSH_DATA_NAME,
                    transform: [
                        {
                            type: `filter`,
                            expr: `isValid(datum['brush_start']) && isFinite(+datum['brush_start'])`
                        }
                    ]
                },
                {
                    name: `data_7`,
                    source: `splitvalues_x`,
                    transform: [
                        {
                            type: `filter`,
                            expr: `isValid(datum['data']) && isFinite(+datum['data'])`
                        }
                    ]
                }
            ],
            signals: [
                { name: `child_width`, value: 520 },
                { name: `y_step`, value: 20 },
                {
                    name: `child_height`,
                    update: `bandspace(domain('y').length, 0, 0) * y_step`
                },
                {
                    name: `unit`,
                    value: {},
                    on: [
                        { events: `mousemove`, update: `isTuple(group()) ? group() : unit` }
                    ]
                },
                {
                    name: `selected`,
                    update: `vlSelectionResolve('selected_store', 'union')`
                },
                {
                    name: `dragTo_x`,
                    on: [
                        {
                            events: `[@grabber_x:mousedown, window:mouseup] > window:mousemove`,
                            update: `{data: invert('x',x())}`
                        }
                    ]
                },
                {
                    name: `draggedMark_x`,
                    on: [
                        {
                            events: [
                                {
                                    markname: `grabber_x`,
                                    type: `mousedown`,
                                    filter: [
                                        `!event.ctrlKey`
                                    ]
                                }
                            ],
                            update: `group().datum`
                        }
                    ]
                },
                {
                    name: `addMark_x`,
                    on: [
                        {
                            events: [
                                {
                                    source: `view`,
                                    type: `click`,
                                    filter: [
                                        `event.ctrlKey`,
                                        `item().mark.name !== 'grabber_x'`
                                    ]
                                }
                            ],
                            update: `{data: invert('x',x())}`
                        }
                    ]
                },
                {
                    name: `remMark_x`,
                    on: [
                        {
                            events: [
                                {
                                    markname: `grabber_x`,
                                    type: `click`,
                                    filter: `event.ctrlKey`
                                },
                                {
                                    markname: `splitrule_x`,
                                    type: `click`,
                                    filter: `event.ctrlKey`
                                }
                            ],
                            update: `group().datum`
                        }
                    ]
                }
            ],
            layout: {
                padding: { row: -2, column: 20 },
                offset: { rowTitle: 10 },
                columns: 1,
                bounds: `full`,
                align: `all`,
                titleBand: { row: 0 }
            },
            marks: [
                {
                    name: `row-title`,
                    type: `group`,
                    role: `row-title`,
                    title: {
                        text: this.catAttribute.label,
                        orient: `left`,
                        style: `guide-title`,
                        align: `right`,
                        anchor: `end`,
                        font: `Roboto`,
                        fontSize: 16,
                        fontWeight: 500,
                        offset: 10
                    }
                },
                {
                    name: `row_header`,
                    type: `group`,
                    role: `row-header`,
                    from: { data: `row_domain` },
                    sort: { field: `datum['${rowField}']`, order: `ascending` },
                    title: groupByConfig.getSelected().label === 'Same Cohort' ? null : {
                        text: {
                            signal: `isValid(parent['${this.catAttribute.dataKey}']) ? parent['${this.catAttribute.dataKey}'] : ''+parent['${this.catAttribute.dataKey}']`
                        },
                        orient: `left`,
                        style: `guide-label`,
                        frame: `group`,
                        baseline: `middle`,
                        align: `left`,
                        angle: 0,
                        font: `Roboto`,
                        fontSize: 12,
                        limit: 150,
                        offset: 10
                    },
                    axes: groupByConfig.getSelected().label === 'Same Cohort' ? [
                        {
                            scale: 'y',
                            orient: 'left',
                            grid: false,
                            domain: false,
                            ticks: false,
                            zindex: 0
                        }
                    ] : [],
                    encode: { update: { height: { signal: `child_height` } } }
                },
                {
                    name: `column_header`,
                    type: `group`,
                    role: `column-header`,
                    encode: { update: { width: { signal: `child_width` } } },
                    axes: [
                        {
                            scale: `x`,
                            orient: `top`,
                            grid: false,
                            title: this.numAttribute.label,
                            labelFlush: true,
                            tickCount: { signal: `ceil(child_width/40)` },
                            zindex: 0
                        }
                    ]
                },
                {
                    name: `cell`,
                    type: `group`,
                    style: `cell`,
                    from: {
                        facet: { name: `facet`, data: `source_0`, groupby: [rowField] }
                    },
                    sort: { field: [`datum['${this.catAttribute.dataKey}']`], order: [`ascending`] },
                    data: [
                        {
                            source: `facet`,
                            name: `data_0`,
                            transform: [
                                {
                                    type: `joinaggregate`,
                                    as: [`lower_box_${this.numAttribute.dataKey}`, `upper_box_${this.numAttribute.dataKey}`],
                                    ops: [`q1`, `q3`],
                                    fields: [`${this.numAttribute.dataKey}`, `${this.numAttribute.dataKey}`],
                                    groupby: [yField, DATA_LABEL]
                                }
                            ]
                        },
                        {
                            name: `data_1`,
                            source: `data_0`,
                            transform: [
                                {
                                    type: `filter`,
                                    expr: `(datum['${this.numAttribute.dataKey}'] < datum['lower_box_${this.numAttribute.dataKey}'] - 1.5 * (datum['upper_box_${this.numAttribute.dataKey}'] - datum['lower_box_${this.numAttribute.dataKey}'])) || (datum['${this.numAttribute.dataKey}'] > datum['upper_box_${this.numAttribute.dataKey}'] + 1.5 * (datum['upper_box_${this.numAttribute.dataKey}'] - datum['lower_box_${this.numAttribute.dataKey}']))`
                                },
                                {
                                    type: `filter`,
                                    expr: `isValid(datum['${this.numAttribute.dataKey}']) && isFinite(+datum['${this.numAttribute.dataKey}'])`
                                }
                            ]
                        },
                        {
                            name: `data_2`,
                            source: `data_0`,
                            transform: [
                                {
                                    type: `filter`,
                                    expr: `(datum['lower_box_${this.numAttribute.dataKey}'] - 1.5 * (datum['upper_box_${this.numAttribute.dataKey}'] - datum['lower_box_${this.numAttribute.dataKey}']) <= datum['${this.numAttribute.dataKey}']) && (datum['${this.numAttribute.dataKey}'] <= datum['upper_box_${this.numAttribute.dataKey}'] + 1.5 * (datum['upper_box_${this.numAttribute.dataKey}'] - datum['lower_box_${this.numAttribute.dataKey}']))`
                                },
                                {
                                    type: `aggregate`,
                                    groupby: [yField, rowField],
                                    ops: [`min`, `max`, `min`, `max`],
                                    fields: [`${this.numAttribute.dataKey}`, `${this.numAttribute.dataKey}`, `lower_box_${this.numAttribute.dataKey}`, `upper_box_${this.numAttribute.dataKey}`],
                                    as: [
                                        `lower_whisker_${this.numAttribute.dataKey}`,
                                        `upper_whisker_${this.numAttribute.dataKey}`,
                                        `lower_box_${this.numAttribute.dataKey}`,
                                        `upper_box_${this.numAttribute.dataKey}`
                                    ]
                                }
                            ]
                        },
                        {
                            source: `facet`,
                            name: `data_3`,
                            transform: [
                                {
                                    type: `aggregate`,
                                    groupby: [yField, rowField],
                                    ops: [`q1`, `q3`, `median`, `min`, `max`],
                                    fields: [`${this.numAttribute.dataKey}`, `${this.numAttribute.dataKey}`, `${this.numAttribute.dataKey}`, `${this.numAttribute.dataKey}`, `${this.numAttribute.dataKey}`],
                                    as: [
                                        `lower_box_${this.numAttribute.dataKey}`,
                                        `upper_box_${this.numAttribute.dataKey}`,
                                        `mid_box_${this.numAttribute.dataKey}`,
                                        `min_${this.numAttribute.dataKey}`,
                                        `max_${this.numAttribute.dataKey}`
                                    ]
                                }
                            ]
                        }
                    ],
                    encode: {
                        update: {
                            width: { signal: `child_width` },
                            height: { signal: `child_height` }
                        }
                    },
                    signals: [
                        {
                            name: `facet`,
                            value: {},
                            on: [
                                {
                                    events: [{ source: `scope`, type: `mousemove` }],
                                    update: `isTuple(facet) ? facet : group('cell').datum`
                                }
                            ]
                        },
                        {
                            name: `selected_x`,
                            value: [],
                            on: [
                                {
                                    events: {
                                        source: `scope`,
                                        type: `mousedown`,
                                        filter: [
                                            `!event.item || event.item.mark.name !== 'selected_brush'`,
                                            `event.item.mark.name !== 'grabber_x'`
                                        ]
                                    },
                                    update: `[x(unit), x(unit)]`
                                },
                                {
                                    events: {
                                        source: `window`,
                                        type: `mousemove`,
                                        consume: true,
                                        between: [
                                            {
                                                source: `scope`,
                                                type: `mousedown`,
                                                filter: [
                                                    `!event.item || event.item.mark.name !== 'selected_brush'`,
                                                    `event.item.mark.name !== 'grabber_x'`
                                                ]
                                            },
                                            { source: `window`, type: `mouseup` }
                                        ]
                                    },
                                    update: `[selected_x[0], clamp(x(unit), 0, child_width)]`
                                },
                                {
                                    events: { signal: `selected_scale_trigger` },
                                    update: `[scale('x', selected_brush_start[0]), scale('x', selected_brush_start[1])]`
                                },
                                {
                                    events: [{ source: `view`, type: `dblclick` }],
                                    update: `[0, 0]`
                                },
                                {
                                    events: { signal: `selected_translate_delta` },
                                    update: `clampRange(panLinear(selected_translate_anchor.extent_x, selected_translate_delta.x / span(selected_translate_anchor.extent_x)), 0, child_width)`
                                },
                                {
                                    events: { signal: `selected_zoom_delta` },
                                    update: `clampRange(zoomLinear(selected_x, selected_zoom_anchor.x, selected_zoom_delta), 0, child_width)`
                                }
                            ]
                        },
                        {
                            name: `selected_brush_start`,
                            on: [
                                {
                                    events: { signal: `selected_x` },
                                    update: `selected_x[0] === selected_x[1] ? null : invert('x', selected_x)`
                                }
                            ]
                        },
                        {
                            name: `selected_scale_trigger`,
                            value: {},
                            on: [
                                {
                                    events: [{ scale: `x` }],
                                    update: `(!isArray(selected_brush_start) || (+invert('x', selected_x)[0] === +selected_brush_start[0] && +invert('x', selected_x)[1] === +selected_brush_start[1])) ? selected_scale_trigger : {}`
                                }
                            ]
                        },
                        {
                            name: `selected_tuple`,
                            on: [
                                {
                                    events: [{ signal: `selected_brush_start` }],
                                    update: `selected_brush_start ? {unit: 'child_layer_0' + '__facet_row_' + (facet['${rowField}']), fields: selected_tuple_fields, values: [selected_brush_start]} : null`
                                }
                            ]
                        },
                        {
                            name: `selected_tuple_fields`,
                            value: [{ field: `brush_start`, channel: `x`, type: `R` }]
                        },
                        {
                            name: `selected_translate_anchor`,
                            value: {},
                            on: [
                                {
                                    events: [
                                        {
                                            source: `scope`,
                                            type: `mousedown`,
                                            markname: `selected_brush`
                                        }
                                    ],
                                    update: `{x: x(unit), y: y(unit), extent_x: slice(selected_x)}`
                                }
                            ]
                        },
                        {
                            name: `selected_translate_delta`,
                            value: {},
                            on: [
                                {
                                    events: [
                                        {
                                            source: `window`,
                                            type: `mousemove`,
                                            consume: true,
                                            between: [
                                                {
                                                    source: `scope`,
                                                    type: `mousedown`,
                                                    markname: `selected_brush`
                                                },
                                                { source: `window`, type: `mouseup` }
                                            ]
                                        }
                                    ],
                                    update: `{x: selected_translate_anchor.x - x(unit), y: selected_translate_anchor.y - y(unit)}`
                                }
                            ]
                        },
                        {
                            name: `selected_zoom_anchor`,
                            on: [
                                {
                                    events: [
                                        {
                                            source: `scope`,
                                            type: `wheel`,
                                            consume: true,
                                            markname: `selected_brush`
                                        }
                                    ],
                                    update: `{x: x(unit), y: y(unit)}`
                                }
                            ]
                        },
                        {
                            name: `selected_zoom_delta`,
                            on: [
                                {
                                    events: [
                                        {
                                            source: `scope`,
                                            type: `wheel`,
                                            consume: true,
                                            markname: `selected_brush`
                                        }
                                    ],
                                    force: true,
                                    update: `pow(1.001, event.deltaY * pow(16, event.deltaMode))`
                                }
                            ]
                        },
                        {
                            name: `selected_modify`,
                            on: [
                                {
                                    events: { signal: `selected_tuple` },
                                    update: `modify('selected_store', selected_tuple, true)`
                                }
                            ]
                        }
                    ],
                    marks: [
                        {
                            name: `selected_brush_bg`,
                            type: `rect`,
                            clip: true,
                            encode: {
                                enter: { fill: { value: `#333` }, fillOpacity: { value: 0 } },
                                update: {
                                    x: [
                                        {
                                            test: `data('selected_store').length && data('selected_store')[0].unit === 'child_layer_0' + '__facet_row_' + (facet['${rowField}'])`,
                                            signal: `selected_x[0]`
                                        },
                                        { value: 0 }
                                    ],
                                    y: [
                                        {
                                            test: `data('selected_store').length && data('selected_store')[0].unit === 'child_layer_0' + '__facet_row_' + (facet['${rowField}'])`,
                                            value: 0
                                        },
                                        { value: 0 }
                                    ],
                                    x2: [
                                        {
                                            test: `data('selected_store').length && data('selected_store')[0].unit === 'child_layer_0' + '__facet_row_' + (facet['${rowField}'])`,
                                            signal: `selected_x[1]`
                                        },
                                        { value: 0 }
                                    ],
                                    y2: [
                                        {
                                            test: `data('selected_store').length && data('selected_store')[0].unit === 'child_layer_0' + '__facet_row_' + (facet['${rowField}'])`,
                                            field: { group: `height` }
                                        },
                                        { value: 0 }
                                    ]
                                }
                            }
                        },
                        {
                            name: `selected_brush_facethelper`,
                            type: `rect`,
                            style: [`rect`],
                            interactive: true,
                            from: { data: `data_6` },
                            encode: {
                                update: {
                                    opacity: { value: 0.125 },
                                    fill: { value: `#333` },
                                    description: {
                                        signal: `'brush_start: ' + (format(datum['brush_start'], '')) + '; brush_end: ' + (format(datum['brush_end'], ''))`
                                    },
                                    x: [
                                        {
                                            test: `!isValid(datum['brush_start']) || !isFinite(+datum['brush_start'])`,
                                            value: 0
                                        },
                                        { scale: `x`, field: `brush_start` }
                                    ],
                                    x2: [
                                        {
                                            test: `!isValid(datum['brush_end']) || !isFinite(+datum['brush_end'])`,
                                            value: 0
                                        },
                                        { scale: `x`, field: `brush_end` }
                                    ],
                                    y: { value: 0 },
                                    y2: { field: { group: `height` } }
                                }
                            }
                        },
                        {
                            name: `child_layer_1_layer_0_layer_0_marks`,
                            type: `symbol`,
                            style: [`point`, `boxplot-outliers`],
                            interactive: false,
                            from: { data: `data_1` },
                            encode: {
                                update: {
                                    opacity: { value: 0.7 },
                                    fill: { value: `transparent` },
                                    stroke: { scale: `color`, field: DATA_LABEL },
                                    ariaRoleDescription: { value: `point` },
                                    description: {
                                        signal: `'${this.catAttribute.label}: ' + (format(datum['${this.numAttribute.dataKey}'], '')) + '; ${DATA_LABEL}: ' + (isValid(datum['${DATA_LABEL}']) ? datum['${DATA_LABEL}'] : ''+datum['${DATA_LABEL}'])`
                                    },
                                    x: [
                                        {
                                            test: `!isValid(datum['${this.numAttribute.dataKey}']) || !isFinite(+datum['${this.numAttribute.dataKey}'])`,
                                            value: 0
                                        },
                                        { scale: `x`, field: `${this.numAttribute.dataKey}` }
                                    ],
                                    y: { scale: `y`, field: yField, band: 0.5 }
                                }
                            }
                        },
                        {
                            name: `child_layer_1_layer_0_layer_1_layer_0_marks`,
                            type: `rule`,
                            style: [`rule`, `boxplot-rule`],
                            interactive: true,
                            aria: false,
                            from: { data: `data_2` },
                            encode: {
                                update: {
                                    stroke: { value: `black` },
                                    tooltip: {
                                        signal: `{'Upper Whisker of ${this.numAttribute.dataKey}': format(datum['upper_whisker_${this.numAttribute.dataKey}'], ''), 'Lower Whisker of ${this.catAttribute.label}': format(datum['lower_whisker_${this.numAttribute.dataKey}'], ''), '${DATA_LABEL}': isValid(datum['${DATA_LABEL}']) ? datum['${DATA_LABEL}'] : ''+datum['${DATA_LABEL}']}`
                                    },
                                    x: { scale: `x`, field: `lower_whisker_${this.numAttribute.dataKey}` },
                                    x2: { scale: `x`, field: `lower_box_${this.numAttribute.dataKey}` },
                                    y: { scale: `y`, field: yField, band: 0.5 }
                                }
                            }
                        },
                        {
                            name: `child_layer_1_layer_0_layer_1_layer_1_marks`,
                            type: `rule`,
                            style: [`rule`, `boxplot-rule`],
                            interactive: true,
                            aria: false,
                            from: { data: `data_2` },
                            encode: {
                                update: {
                                    stroke: { value: `black` },
                                    tooltip: {
                                        signal: `{'Upper Whisker of ${this.catAttribute.label}': format(datum['upper_whisker_${this.numAttribute.dataKey}'], ''), 'Lower Whisker of ${this.catAttribute.label}': format(datum['lower_whisker_${this.numAttribute.dataKey}'], ''), '${DATA_LABEL}': isValid(datum['${DATA_LABEL}']) ? datum['${DATA_LABEL}'] : ''+datum['${DATA_LABEL}']}`
                                    },
                                    x: { scale: `x`, field: `upper_box_${this.numAttribute.dataKey}` },
                                    x2: { scale: `x`, field: `upper_whisker_${this.numAttribute.dataKey}` },
                                    y: { scale: `y`, field: yField, band: 0.5 }
                                }
                            }
                        },
                        {
                            name: `child_layer_1_layer_1_layer_0_marks`,
                            type: `rect`,
                            style: [`bar`, `boxplot-box`],
                            interactive: true,
                            from: { data: `data_3` },
                            encode: {
                                update: {
                                    ariaRoleDescription: { value: `box` },
                                    fill: { scale: `color`, field: DATA_LABEL },
                                    tooltip: {
                                        signal: `{'Max of ${this.catAttribute.label}': format(datum['max_${this.numAttribute.dataKey}'], ''), 'Q3 of ${this.catAttribute.label}': format(datum['upper_box_${this.numAttribute.dataKey}'], ''), 'Median of ${this.catAttribute.label}': format(datum['mid_box_${this.numAttribute.dataKey}'], ''), 'Q1 of ${this.catAttribute.label}': format(datum['lower_box_${this.numAttribute.dataKey}'], ''), 'Min of ${this.catAttribute.label}': format(datum['min_${this.numAttribute.dataKey}'], ''), '${DATA_LABEL}': isValid(datum['${DATA_LABEL}']) ? datum['${DATA_LABEL}'] : ''+datum['${DATA_LABEL}']}`
                                    },
                                    description: {
                                        signal: `'${this.catAttribute.label}: ' + (format(datum['lower_box_${this.numAttribute.dataKey}'], '')) + '; upper_box_${this.numAttribute.dataKey}: ' + (format(datum['upper_box_${this.numAttribute.dataKey}'], '')) + '; ${DATA_LABEL}: ' + (isValid(datum['${DATA_LABEL}']) ? datum['${DATA_LABEL}'] : ''+datum['${DATA_LABEL}']) + '; Max of ${this.catAttribute.label}: ' + (format(datum['max_${this.numAttribute.dataKey}'], '')) + '; Q3 of ${this.catAttribute.label}: ' + (format(datum['upper_box_${this.numAttribute.dataKey}'], '')) + '; Median of ${this.catAttribute.label}: ' + (format(datum['mid_box_${this.numAttribute.dataKey}'], '')) + '; Q1 of ${this.catAttribute.label}: ' + (format(datum['lower_box_${this.numAttribute.dataKey}'], '')) + '; Min of ${this.catAttribute.label}: ' + (format(datum['min_${this.numAttribute.dataKey}'], ''))`
                                    },
                                    x: { scale: `x`, field: `lower_box_${this.numAttribute.dataKey}` },
                                    x2: { scale: `x`, field: `upper_box_${this.numAttribute.dataKey}` },
                                    yc: { scale: `y`, field: yField, band: 0.5 },
                                    height: { value: 14 }
                                }
                            }
                        },
                        {
                            name: `child_layer_1_layer_1_layer_1_marks`,
                            type: `rect`,
                            style: [`tick`, `boxplot-median`],
                            interactive: true,
                            aria: false,
                            from: { data: `data_3` },
                            encode: {
                                update: {
                                    opacity: { value: 0.7 },
                                    fill: { value: `black` },
                                    tooltip: {
                                        signal: `{'Max of ${this.catAttribute.label}': format(datum['max_${this.numAttribute.dataKey}'], ''), 'Q3 of ${this.catAttribute.label}': format(datum['upper_box_${this.numAttribute.dataKey}'], ''), 'Median of ${this.catAttribute.label}': format(datum['mid_box_${this.numAttribute.dataKey}'], ''), 'Q1 of ${this.catAttribute.label}': format(datum['lower_box_${this.numAttribute.dataKey}'], ''), 'Min of ${this.catAttribute.label}': format(datum['min_${this.numAttribute.dataKey}'], ''), '${DATA_LABEL}': isValid(datum['${DATA_LABEL}']) ? datum['${DATA_LABEL}'] : ''+datum['${DATA_LABEL}']}`
                                    },
                                    xc: { scale: `x`, field: `mid_box_${this.numAttribute.dataKey}` },
                                    yc: { scale: `y`, field: yField, band: 0.5 },
                                    height: { value: 14 },
                                    width: { value: 1 }
                                }
                            }
                        },
                        {
                            name: `splitmarks_x`,
                            type: `group`,
                            from: {
                                data: `data_7`
                            },
                            encode: {
                                enter: {
                                    height: {
                                        field: {
                                            group: `height`
                                        }
                                    }
                                },
                                update: {
                                    x: [
                                        {
                                            test: `!isValid(datum['data']) || !isFinite(+datum['data'])`,
                                            value: 0
                                        },
                                        {
                                            scale: `x`,
                                            field: `data`
                                        }
                                    ]
                                }
                            },
                            marks: [
                                {
                                    name: `splitrule_x`,
                                    type: `rule`,
                                    style: [
                                        `rule`
                                    ],
                                    encode: {
                                        update: {
                                            strokeDash: {
                                                value: [
                                                    3,
                                                    2
                                                ]
                                            },
                                            stroke: {
                                                value: `black`
                                            },
                                            y: {
                                                value: 0
                                            },
                                            y2: {
                                                field: {
                                                    group: `height`
                                                }
                                            }
                                        }
                                    }
                                },
                                {
                                    type: `path`,
                                    name: `grabber_x`,
                                    encode: {
                                        enter: {
                                            x: {
                                                offset: 1
                                            },
                                            y: {
                                                field: {
                                                    group: `height`
                                                },
                                                mult: 0.5,
                                                offset: -7.5 //half the height of the svg grabber
                                            },
                                            fill: {
                                                value: `#fff`
                                            },
                                            stroke: {
                                                value: `#666`
                                            },
                                            cursor: {
                                                value: `ew-resize`
                                            }
                                        },
                                        update: {
                                            path: {
                                                signal: `'M 0.5,14.85 A 6,2.583 0 0 0 6.5,12.267 V 3.083 A 6,2.583 0 0 0 0.5,0.5 Z M 2.5,11.406 V 3.944 m 2,7.462 V 3.944'`
                                            }
                                        }
                                    }
                                }
                            ]
                        },
                        {
                            name: `selected_brush`,
                            type: `rect`,
                            clip: true,
                            encode: {
                                enter: {
                                    cursor: { value: `pointer` },
                                    fill: { value: `transparent` }
                                },
                                update: {
                                    x: [
                                        {
                                            test: `data('selected_store').length && data('selected_store')[0].unit === 'child_layer_0' + '__facet_row_' + (facet['${rowField}'])`,
                                            signal: `selected_x[0]`
                                        },
                                        { value: 0 }
                                    ],
                                    y: [
                                        {
                                            test: `data('selected_store').length && data('selected_store')[0].unit === 'child_layer_0' + '__facet_row_' + (facet['${rowField}'])`,
                                            value: 0
                                        },
                                        { value: 0 }
                                    ],
                                    x2: [
                                        {
                                            test: `data('selected_store').length && data('selected_store')[0].unit === 'child_layer_0' + '__facet_row_' + (facet['${rowField}'])`,
                                            signal: `selected_x[1]`
                                        },
                                        { value: 0 }
                                    ],
                                    y2: [
                                        {
                                            test: `data('selected_store').length && data('selected_store')[0].unit === 'child_layer_0' + '__facet_row_' + (facet['${rowField}'])`,
                                            field: { group: `height` }
                                        },
                                        { value: 0 }
                                    ],
                                    stroke: [
                                        { test: `selected_x[0] !== selected_x[1]`, value: `white` },
                                        { value: null }
                                    ],
                                    strokeOpacity: [
                                        { test: `selected_x[0] !== selected_x[1]`, value: 0 },
                                        { value: null }
                                    ]
                                }
                            }
                        }
                    ],
                    axes: [
                        {
                            scale: `x`,
                            orient: `top`,
                            gridScale: `y`,
                            grid: true,
                            tickCount: { signal: `ceil(child_width/40)` },
                            domain: false,
                            labels: false,
                            aria: false,
                            maxExtent: 0,
                            minExtent: 0,
                            ticks: false,
                            zindex: 0
                        }
                    ]
                }
            ],
            scales: [
                {
                    name: `x`,
                    type: `linear`,
                    domain: {
                        fields: [
                            { data: `data_6`, field: `brush_start` },
                            { data: `data_6`, field: `brush_end` },
                            { data: `data_3`, field: `${this.numAttribute.dataKey}` },
                            { data: `data_4`, field: `lower_whisker_${this.numAttribute.dataKey}` },
                            { data: `data_4`, field: `lower_box_${this.numAttribute.dataKey}` },
                            { data: `data_4`, field: `upper_box_${this.numAttribute.dataKey}` },
                            { data: `data_4`, field: `upper_whisker_${this.numAttribute.dataKey}` },
                            { data: `data_5`, field: `lower_box_${this.numAttribute.dataKey}` },
                            { data: `data_5`, field: `upper_box_${this.numAttribute.dataKey}` },
                            { data: `data_5`, field: `mid_box_${this.numAttribute.dataKey}` },
                            { data: `data_7`, field: `data` }
                        ]
                    },
                    range: [0, { signal: `child_width` }],
                    clamp: true,
                    nice: false,
                    zero: false
                },
                {
                    name: `y`,
                    type: `band`,
                    domain: {
                        fields: [
                            { data: `data_3`, field: yField },
                            { data: `data_4`, field: yField },
                            { data: `data_5`, field: yField }
                        ]
                    },
                    range: { step: { signal: `y_step` } },
                    paddingInner: 0,
                    paddingOuter: 0
                },
                {
                    name: `color`,
                    type: `ordinal`,
                    domain: { data: 'data_5', field: DATA_LABEL },
                    range: `category`
                }
            ],
            config: {
                range: { category: this.colorPalette },
                axis: {
                    titleFontSize: 16,
                    titleFontWeight: 500,
                    titleFont: `Roboto`,
                    labelFontSize: 12,
                    labelLimit: 150,
                    labelFont: `Roboto`,
                    labelOverlap: `parity`,
                    labelSeparation: 5,
                    labelBound: true
                },
                legend: {
                    titleFontSize: 16,
                    titleFontWeight: 500,
                    titleFont: `Roboto`,
                    labelFontSize: 12,
                    labelLimit: 150,
                    labelFont: `Roboto`,
                    labelOverlap: `parity`
                },
                style: { cell: { cursor: `text` } }
            }
        };
        return vegaSpec;
    }
}
GroupedBoxplot.NAME = 'Boxplot';
//# sourceMappingURL=GroupedBoxplot.js.map