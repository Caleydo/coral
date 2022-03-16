import log from 'loglevel';
import { ServerColumnAttribute } from '../../data/Attribute';
import { DATA_LABEL } from './constants';
import { desc, op, from, rolling, table, not } from 'arquero';
import { getCohortLabel, getCohortLabels } from '../../Cohort';
import { SingleAttributeVisualization, AVegaVisualization } from './AVegaVisualization';
import { confidenceToggleGroup, confidenceNone } from './config/ConfidenceConfig';
import confidenceIcon from '../../assets/icons/confidence.svg';
export class KaplanMeierPlot extends SingleAttributeVisualization {
    constructor(vegaLiteOptions = {}) {
        super(vegaLiteOptions);
        this.type = 'quantitative';
        this.config = [
            {
                icon: `<img src="${confidenceIcon}" />`,
                label: 'Confidence Intervals',
                groups: [confidenceToggleGroup]
            }
        ];
    }
    async getData() {
        const attributes = [this.attribute];
        let missingAttrId = 'days_to_last_followup';
        if (this.attribute.id === 'days_to_last_followup') {
            missingAttrId = 'days_to_death';
        }
        log.debug('Also get data for ', missingAttrId);
        const missingAttr = new ServerColumnAttribute(missingAttrId, this.attribute.view, this.attribute.database, { type: 'number', label: missingAttrId, column: missingAttrId });
        attributes.push(missingAttr);
        if (missingAttrId === 'days_to_death') {
            this.attribute = missingAttr;
        }
        const dataPromises = this.cohorts
            .map((cht) => {
            const promise = new Promise(async (resolve, reject) => {
                const chtDataPromises = attributes.map((attr) => attr.getData(cht.dbId));
                try {
                    const chtData = await Promise.all(chtDataPromises); // array with one entry per attribute, which contains an array with one value for every item in the cohort
                    const mergedChtData = chtData[0].map((_, itemIndex) => chtData.reduce((mergedItem, attribute, i) => Object.assign(mergedItem, attribute[itemIndex]), { [DATA_LABEL]: getCohortLabel(cht) }));
                    resolve(mergedChtData);
                }
                catch (e) {
                    reject(e);
                }
            });
            return promise;
        });
        return Promise.all(dataPromises);
    }
    getSpec(data) {
        if (this.attribute.type !== `number`) {
            throw new Error(`${KaplanMeierPlot.NAME} requires a numerical attribute.`);
        }
        data = this.convertData(data);
        this.field = KaplanMeierPlot.TIME;
        const vegaSpec = {
            '$schema': 'https://vega.github.io/schema/vega/v5.json',
            autosize: { type: 'fit-x', contains: 'padding' },
            background: 'white',
            padding: { left: 5, top: 0, right: 5, bottom: 5 },
            height: 300,
            style: 'cell',
            encode: { update: { cursor: { value: 'text' } } },
            data: [
                { name: 'selected_store' },
                {
                    name: 'source_0',
                    values: data
                },
                {
                    name: 'splitvalues',
                    values: this.splitValues,
                    on: [
                        {
                            trigger: 'draggedMark',
                            modify: 'draggedMark',
                            values: 'dragTo'
                        },
                        {
                            trigger: 'addMark',
                            insert: 'addMark'
                        },
                        {
                            trigger: 'remMark',
                            remove: 'remMark'
                        }
                    ]
                },
                {
                    name: 'data_0',
                    source: 'source_0',
                    transform: [
                        { type: 'formula', expr: 'toNumber(datum[\'' + KaplanMeierPlot.TIME + '\'])', as: KaplanMeierPlot.TIME }
                    ]
                },
                {
                    name: 'data_1',
                    source: 'data_0',
                    transform: [
                        { type: 'filter', expr: 'datum[\'last_followups\']>0' },
                        {
                            type: 'filter',
                            expr: 'isValid(datum[\'' + KaplanMeierPlot.TIME + '\']) && isFinite(+datum[\'' + KaplanMeierPlot.TIME + '\']) && isValid(datum[\'' + KaplanMeierPlot.SURVIVAL + '\']) && isFinite(+datum[\'' + KaplanMeierPlot.SURVIVAL + '\'])'
                        }
                    ]
                },
                {
                    name: 'data_2',
                    source: 'data_0',
                    transform: [
                        {
                            type: 'formula',
                            expr: 'datum[\'' + KaplanMeierPlot.SURVIVAL + '\'] + datum[\'' + KaplanMeierPlot.ERROR + '\']',
                            as: 'upper_' + KaplanMeierPlot.SURVIVAL + ''
                        },
                        {
                            type: 'formula',
                            expr: 'datum[\'' + KaplanMeierPlot.SURVIVAL + '\'] - datum[\'' + KaplanMeierPlot.ERROR + '\']',
                            as: 'lower_' + KaplanMeierPlot.SURVIVAL + ''
                        }
                    ]
                }
            ],
            signals: [
                {
                    name: 'width',
                    init: 'isFinite(containerSize()[0]) ? containerSize()[0] : 200',
                    on: [
                        {
                            update: 'isFinite(containerSize()[0]) ? containerSize()[0] : 200',
                            events: 'window:resize'
                        }
                    ]
                },
                {
                    name: 'dragTo',
                    on: [
                        {
                            events: '[@right_grabber:mousedown, window:mouseup] > window:mousemove',
                            update: '{x: invert(\'x\',x())}'
                        }
                    ]
                },
                {
                    name: 'draggedMark',
                    on: [
                        {
                            events: [
                                {
                                    markname: 'right_grabber',
                                    type: 'mousedown',
                                    filter: [
                                        '!event.ctrlKey'
                                    ]
                                }
                            ],
                            update: 'group().datum'
                        }
                    ]
                },
                {
                    name: 'addMark',
                    on: [
                        {
                            events: [
                                {
                                    source: 'view',
                                    type: 'click',
                                    filter: [
                                        'event.ctrlKey',
                                        'item().mark.name === \'root\''
                                    ]
                                }
                            ],
                            update: '{x: invert(\'x\',x())}'
                        }
                    ]
                },
                {
                    name: 'remMark',
                    on: [
                        {
                            events: [
                                {
                                    markname: 'right_grabber',
                                    type: 'click',
                                    filter: 'event.ctrlKey'
                                },
                                {
                                    markname: 'splitrule',
                                    type: 'click',
                                    filter: 'event.ctrlKey'
                                }
                            ],
                            update: 'group().datum'
                        }
                    ]
                },
                {
                    name: 'unit',
                    value: {},
                    on: [
                        {
                            events: 'mousemove',
                            update: 'isTuple(group()) ? group() : unit'
                        }
                    ]
                },
                {
                    name: 'selected',
                    update: 'vlSelectionResolve(\'selected_store\', \'union\')'
                },
                {
                    name: 'selected_x',
                    value: [],
                    on: [
                        {
                            events: {
                                source: 'view',
                                type: 'mousedown',
                                filter: [
                                    '!event.item || event.item.mark.name !== \'selected_brush\'',
                                    'event.item.mark.name !== \'right_grabber\''
                                ]
                            },
                            update: '[x(unit), x(unit)]'
                        },
                        {
                            events: {
                                source: 'window',
                                type: 'mousemove',
                                consume: true,
                                between: [
                                    {
                                        source: 'scope',
                                        type: 'mousedown',
                                        filter: [
                                            '!event.item || event.item.mark.name !== \'selected_brush\'',
                                            'event.item.mark.name !== \'right_grabber\''
                                        ]
                                    },
                                    {
                                        source: 'window',
                                        type: 'mouseup'
                                    }
                                ]
                            },
                            update: '[selected_x[0], clamp(x(unit), 0, width)]'
                        },
                        {
                            events: {
                                signal: 'selected_scale_trigger'
                            },
                            update: '[scale(\'x\', selected_' + KaplanMeierPlot.TIME + '[0]), scale(\'x\', selected_' + KaplanMeierPlot.TIME + '[1])]'
                        },
                        {
                            events: [
                                {
                                    source: 'view',
                                    type: 'dblclick',
                                    filter: [
                                        'event.item.mark.name !== \'right_grabber\''
                                    ]
                                }
                            ],
                            update: '[0, 0]'
                        },
                        {
                            events: {
                                signal: 'selected_translate_delta'
                            },
                            update: 'clampRange(panLinear(selected_translate_anchor.extent_x, selected_translate_delta.x / span(selected_translate_anchor.extent_x)), 0, width)'
                        },
                        {
                            events: {
                                signal: 'selected_zoom_delta'
                            },
                            update: 'clampRange(zoomLinear(selected_x, selected_zoom_anchor.x, selected_zoom_delta), 0, width)'
                        }
                    ]
                },
                {
                    name: 'selected_' + KaplanMeierPlot.TIME,
                    value: this.getBrushRange(),
                    on: [
                        {
                            events: {
                                signal: 'selected_x'
                            },
                            update: 'selected_x[0] === selected_x[1] ? null : invert(\'x\', selected_x)'
                        }
                    ]
                },
                {
                    name: 'selected_scale_trigger',
                    value: {},
                    on: [
                        {
                            events: [
                                {
                                    scale: 'x'
                                }
                            ],
                            update: '(!isArray(selected_' + KaplanMeierPlot.TIME + ') || (+invert(\'x\', selected_x)[0] === +selected_' + KaplanMeierPlot.TIME + '[0] && +invert(\'x\', selected_x)[1] === +selected_' + KaplanMeierPlot.TIME + '[1])) ? selected_scale_trigger : {}'
                        }
                    ]
                },
                {
                    name: 'selected_tuple',
                    on: [
                        {
                            events: [
                                {
                                    signal: 'selected_' + KaplanMeierPlot.TIME
                                }
                            ],
                            update: 'selected_' + KaplanMeierPlot.TIME + ' ? {unit: \'layer_0\', fields: selected_tuple_fields, values: [selected_' + KaplanMeierPlot.TIME + ']} : null'
                        }
                    ]
                },
                {
                    name: 'selected_tuple_fields',
                    value: [
                        {
                            field: KaplanMeierPlot.TIME,
                            channel: 'x',
                            type: 'R'
                        }
                    ]
                },
                {
                    name: 'selected_translate_anchor',
                    value: {},
                    on: [
                        {
                            events: [
                                {
                                    source: 'scope',
                                    type: 'mousedown',
                                    markname: 'selected_brush'
                                }
                            ],
                            update: '{x: x(unit), y: y(unit), extent_x: slice(selected_x)}'
                        }
                    ]
                },
                {
                    name: 'selected_translate_delta',
                    value: {},
                    on: [
                        {
                            events: [
                                {
                                    source: 'window',
                                    type: 'mousemove',
                                    consume: true,
                                    between: [
                                        {
                                            source: 'scope',
                                            type: 'mousedown',
                                            markname: 'selected_brush'
                                        },
                                        {
                                            source: 'window',
                                            type: 'mouseup'
                                        }
                                    ]
                                }
                            ],
                            update: '{x: selected_translate_anchor.x - x(unit), y: selected_translate_anchor.y - y(unit)}'
                        }
                    ]
                },
                {
                    name: 'selected_zoom_anchor',
                    on: [
                        {
                            events: [
                                {
                                    source: 'scope',
                                    type: 'wheel',
                                    consume: true,
                                    markname: 'selected_brush'
                                }
                            ],
                            update: '{x: x(unit), y: y(unit)}'
                        }
                    ]
                },
                {
                    name: 'selected_zoom_delta',
                    on: [
                        {
                            events: [
                                {
                                    source: 'scope',
                                    type: 'wheel',
                                    consume: true,
                                    markname: 'selected_brush'
                                }
                            ],
                            force: true,
                            update: 'pow(1.001, event.deltaY * pow(16, event.deltaMode))'
                        }
                    ]
                },
                {
                    name: 'selected_modify',
                    on: [
                        {
                            events: {
                                signal: 'selected_tuple'
                            },
                            update: 'modify(\'selected_store\', selected_tuple, true)'
                        }
                    ]
                }
            ],
            marks: [
                ...confidenceToggleGroup.getSelected().label === confidenceNone.label ? [] : [
                    {
                        name: 'layer_1_layer_0_pathgroup',
                        type: 'group',
                        from: {
                            facet: {
                                name: 'faceted_path_layer_1_layer_0_main',
                                data: 'data_2',
                                groupby: [DATA_LABEL]
                            }
                        },
                        encode: {
                            update: {
                                width: { field: { group: 'width' } },
                                height: { field: { group: 'height' } }
                            }
                        },
                        marks: [
                            {
                                name: 'layer_1_layer_0_marks',
                                type: 'area',
                                style: ['area', 'errorband-band'],
                                sort: { field: 'datum[\'' + KaplanMeierPlot.TIME + '\']' },
                                interactive: true,
                                from: { data: 'faceted_path_layer_1_layer_0_main' },
                                encode: {
                                    update: {
                                        ariaRoleDescription: { value: 'errorband' },
                                        opacity: { value: 0.3 },
                                        interpolate: { value: 'step-after' },
                                        orient: { value: 'vertical' },
                                        fill: { scale: 'color', field: DATA_LABEL },
                                        tooltip: {
                                            signal: '{\'' + KaplanMeierPlot.SURVIVAL + '\': format(datum[\'' + KaplanMeierPlot.SURVIVAL + '\'], \'\'), \'' + KaplanMeierPlot.SURVIVAL + ' + ' + KaplanMeierPlot.ERROR + '\': format(datum[\'upper_' + KaplanMeierPlot.SURVIVAL + '\'], \'\'), \'' + KaplanMeierPlot.SURVIVAL + ' - ' + KaplanMeierPlot.ERROR + '\': format(datum[\'lower_' + KaplanMeierPlot.SURVIVAL + '\'], \'\'), \'' + KaplanMeierPlot.TIME + '\': format(datum[\'' + KaplanMeierPlot.TIME + '\'], \'\'), \'' + DATA_LABEL + '\': isValid(datum[\'' + DATA_LABEL + '\']) ? datum[\'' + DATA_LABEL + '\'] : \'\'+datum[\'' + DATA_LABEL + '\']}'
                                        },
                                        description: {
                                            signal: '\'lower_' + KaplanMeierPlot.SURVIVAL + ': \' + (format(datum[\'lower_' + KaplanMeierPlot.SURVIVAL + '\'], \'\')) + \'; upper_' + KaplanMeierPlot.SURVIVAL + ': \' + (format(datum[\'upper_' + KaplanMeierPlot.SURVIVAL + '\'], \'\')) + \'; ' + KaplanMeierPlot.TIME + ': \' + (format(datum[\'' + KaplanMeierPlot.TIME + '\'], \'\')) + \'; Cohort: \' + (isValid(datum[\'' + DATA_LABEL + '\']) ? datum[\'' + DATA_LABEL + '\'] : \'\'+datum[\'' + DATA_LABEL + '\']) + \'; ' + KaplanMeierPlot.SURVIVAL + ': \' + (format(datum[\'' + KaplanMeierPlot.SURVIVAL + '\'], \'\')) + \'; ' + KaplanMeierPlot.SURVIVAL + ' + ' + KaplanMeierPlot.ERROR + ': \' + (format(datum[\'upper_' + KaplanMeierPlot.SURVIVAL + '\'], \'\')) + \'; ' + KaplanMeierPlot.SURVIVAL + ' - ' + KaplanMeierPlot.ERROR + ': \' + (format(datum[\'lower_' + KaplanMeierPlot.SURVIVAL + '\'], \'\'))'
                                        },
                                        x: { scale: 'x', field: KaplanMeierPlot.TIME },
                                        y: { scale: 'y', field: 'lower_' + KaplanMeierPlot.SURVIVAL + '' },
                                        y2: { scale: 'y', field: 'upper_' + KaplanMeierPlot.SURVIVAL + '' },
                                        defined: {
                                            signal: 'isValid(datum[\'' + KaplanMeierPlot.TIME + '\']) && isFinite(+datum[\'' + KaplanMeierPlot.TIME + '\']) && isValid(datum[\'lower_' + KaplanMeierPlot.SURVIVAL + '\']) && isFinite(+datum[\'lower_' + KaplanMeierPlot.SURVIVAL + '\'])'
                                        }
                                    }
                                }
                            }
                        ]
                    }
                ],
                {
                    name: 'selected_brush_bg',
                    type: 'rect',
                    clip: true,
                    encode: {
                        enter: { fill: { value: '#333' }, fillOpacity: { value: 0.125 } },
                        update: {
                            x: [
                                {
                                    test: 'data(\'selected_store\').length && data(\'selected_store\')[0].unit === \'layer_0\'',
                                    signal: 'selected_x[0]'
                                },
                                { value: 0 }
                            ],
                            y: [
                                {
                                    test: 'data(\'selected_store\').length && data(\'selected_store\')[0].unit === \'layer_0\'',
                                    value: 0
                                },
                                { value: 0 }
                            ],
                            x2: [
                                {
                                    test: 'data(\'selected_store\').length && data(\'selected_store\')[0].unit === \'layer_0\'',
                                    signal: 'selected_x[1]'
                                },
                                { value: 0 }
                            ],
                            y2: [
                                {
                                    test: 'data(\'selected_store\').length && data(\'selected_store\')[0].unit === \'layer_0\'',
                                    field: { group: 'height' }
                                },
                                { value: 0 }
                            ]
                        }
                    }
                },
                {
                    name: 'layer_0_pathgroup',
                    type: 'group',
                    from: {
                        facet: {
                            name: 'faceted_path_layer_0_main',
                            data: 'data_0',
                            groupby: [DATA_LABEL]
                        }
                    },
                    encode: {
                        update: {
                            width: { field: { group: 'width' } },
                            height: { field: { group: 'height' } }
                        }
                    },
                    marks: [
                        {
                            name: 'layer_0_marks',
                            type: 'line',
                            style: ['line'],
                            sort: { field: 'datum[\'' + KaplanMeierPlot.TIME + '\']' },
                            interactive: true,
                            from: { data: 'faceted_path_layer_0_main' },
                            encode: {
                                update: {
                                    interpolate: { value: 'step-after' },
                                    cursor: { value: 'text' },
                                    stroke: { scale: 'color', field: DATA_LABEL },
                                    description: {
                                        signal: '\'Time in Days: \' + (format(datum[\'' + KaplanMeierPlot.TIME + '\'], \'\')) + \'; Survival Probability: \' + (format(datum[\'' + KaplanMeierPlot.SURVIVAL + '\'], \'.1~%\')) + \'; Cohort: \' + (isValid(datum[\'' + DATA_LABEL + '\']) ? datum[\'' + DATA_LABEL + '\'] : \'\'+datum[\'' + DATA_LABEL + '\'])'
                                    },
                                    x: { scale: 'x', field: KaplanMeierPlot.TIME },
                                    y: { scale: 'y', field: KaplanMeierPlot.SURVIVAL },
                                    defined: {
                                        signal: 'isValid(datum[\'' + KaplanMeierPlot.TIME + '\']) && isFinite(+datum[\'' + KaplanMeierPlot.TIME + '\']) && isValid(datum[\'' + KaplanMeierPlot.SURVIVAL + '\']) && isFinite(+datum[\'' + KaplanMeierPlot.SURVIVAL + '\'])'
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    name: 'layer_2_marks',
                    type: 'rect',
                    style: ['tick'],
                    interactive: false,
                    from: { data: 'data_1' },
                    encode: {
                        update: {
                            opacity: { value: 0.6 },
                            fill: { scale: 'color', field: DATA_LABEL },
                            ariaRoleDescription: { value: 'tick' },
                            description: {
                                signal: '\'' + KaplanMeierPlot.TIME + ': \' + (format(datum[\'' + KaplanMeierPlot.TIME + '\'], \'\')) + \'; ' + KaplanMeierPlot.SURVIVAL + ': \' + (format(datum[\'' + KaplanMeierPlot.SURVIVAL + '\'], \'\')) + \'; Cohort: \' + (isValid(datum[\'' + DATA_LABEL + '\']) ? datum[\'' + DATA_LABEL + '\'] : \'\'+datum[\'' + DATA_LABEL + '\'])'
                            },
                            xc: [
                                {
                                    test: '!isValid(datum[\'' + KaplanMeierPlot.TIME + '\']) || !isFinite(+datum[\'' + KaplanMeierPlot.TIME + '\'])',
                                    value: 0
                                },
                                { scale: 'x', field: KaplanMeierPlot.TIME }
                            ],
                            yc: { scale: 'y', field: KaplanMeierPlot.SURVIVAL },
                            height: { value: 15 },
                            width: { value: 1 }
                        }
                    }
                },
                {
                    name: 'splitmarks',
                    type: 'group',
                    from: {
                        data: 'splitvalues'
                    },
                    encode: {
                        enter: { height: { field: { group: 'height' } } },
                        update: {
                            x: [
                                {
                                    test: '!isValid(datum[\'x\']) || !isFinite(+datum[\'x\'])',
                                    value: 0
                                },
                                { scale: 'x', field: 'x' }
                            ]
                        }
                    },
                    marks: [
                        {
                            name: 'splitrule',
                            type: 'rule',
                            style: ['rule'],
                            encode: {
                                update: {
                                    strokeDash: { value: [4, 6] },
                                    stroke: { value: 'black' },
                                    y: { value: 0 },
                                    y2: { field: { group: 'height' } }
                                }
                            }
                        },
                        {
                            type: 'path',
                            name: 'right_grabber',
                            encode: {
                                enter: {
                                    y: { field: { group: 'height' }, mult: 0.5, offset: -50 },
                                    fill: { value: '#fff' },
                                    stroke: { value: '#666' },
                                    cursor: { value: 'ew-resize' }
                                },
                                update: {
                                    path: {
                                        signal: '\'M0.5,33.333333333333336A6,6 0 0 1 6.5,39.333333333333336V60.66666666666667A6,6 0 0 1 0.5,66.66666666666667ZM2.5,41.333333333333336V58.66666666666667M4.5,41.333333333333336V58.66666666666667\''
                                    }
                                }
                            }
                        }
                    ]
                },
                {
                    name: 'selected_brush',
                    type: 'rect',
                    clip: true,
                    encode: {
                        enter: {
                            cursor: { value: 'pointer' },
                            fill: { value: 'transparent' }
                        },
                        update: {
                            x: [
                                {
                                    test: 'data(\'selected_store\').length && data(\'selected_store\')[0].unit === \'layer_0\'',
                                    signal: 'selected_x[0]'
                                },
                                { value: 0 }
                            ],
                            y: [
                                {
                                    test: 'data(\'selected_store\').length && data(\'selected_store\')[0].unit === \'layer_0\'',
                                    value: 0
                                },
                                { value: 0 }
                            ],
                            x2: [
                                {
                                    test: 'data(\'selected_store\').length && data(\'selected_store\')[0].unit === \'layer_0\'',
                                    signal: 'selected_x[1]'
                                },
                                { value: 0 }
                            ],
                            y2: [
                                {
                                    test: 'data(\'selected_store\').length && data(\'selected_store\')[0].unit === \'layer_0\'',
                                    field: { group: 'height' }
                                },
                                { value: 0 }
                            ],
                            stroke: [
                                { test: 'selected_x[0] !== selected_x[1]', value: 'white' },
                                { value: null }
                            ]
                        }
                    }
                }
            ],
            scales: [
                {
                    name: 'x',
                    type: 'linear',
                    domain: {
                        fields: [
                            { data: 'data_0', field: KaplanMeierPlot.TIME },
                            { data: 'data_2', field: KaplanMeierPlot.TIME },
                            { data: 'data_1', field: KaplanMeierPlot.TIME }
                        ]
                    },
                    range: [0, { signal: 'width' }],
                    domainMin: 0,
                    // nice: true,
                    zero: false
                },
                {
                    name: 'y',
                    type: 'linear',
                    domain: [0, 1],
                    range: [{ signal: 'height' }, 0],
                    clamp: true,
                    nice: true,
                    zero: true
                },
                {
                    name: 'color',
                    type: 'ordinal',
                    domain: {
                        fields: [
                            { data: 'data_0', field: DATA_LABEL },
                            { data: 'data_2', field: DATA_LABEL },
                            { data: 'data_1', field: DATA_LABEL }
                        ],
                        sort: true
                    },
                    range: 'category'
                }
            ],
            axes: [
                {
                    scale: 'x',
                    orient: 'bottom',
                    gridScale: 'y',
                    grid: true,
                    tickCount: { signal: 'ceil(width/40)' },
                    domain: false,
                    labels: false,
                    aria: false,
                    maxExtent: 0,
                    minExtent: 0,
                    ticks: false,
                    zindex: 0
                },
                {
                    scale: 'y',
                    orient: 'left',
                    gridScale: 'x',
                    grid: true,
                    tickCount: { signal: 'ceil(height/40)' },
                    domain: false,
                    labels: false,
                    aria: false,
                    maxExtent: 0,
                    minExtent: 0,
                    ticks: false,
                    zindex: 0
                },
                {
                    scale: 'x',
                    orient: 'bottom',
                    grid: false,
                    title: 'Time in Days',
                    labelFlush: true,
                    tickCount: { signal: 'ceil(width/40)' },
                    zindex: 0
                },
                {
                    scale: 'y',
                    orient: 'left',
                    grid: false,
                    title: 'Survival Probability',
                    format: '.1~%',
                    labelBound: false,
                    tickCount: { signal: 'ceil(height/40)' },
                    zindex: 0
                }
            ],
            config: {
                range: { category: this.colorPalette },
                axis: {
                    titleFontSize: 16,
                    titleFontWeight: 500,
                    titleFont: 'Roboto',
                    labelFontSize: 12,
                    labelLimit: 150,
                    labelFont: 'Roboto',
                    labelOverlap: 'parity',
                    labelSeparation: 5,
                    labelBound: true
                },
                legend: {
                    titleFontSize: 16,
                    titleFontWeight: 500,
                    titleFont: 'Roboto',
                    labelFontSize: 12,
                    labelLimit: 150,
                    labelFont: 'Roboto',
                    labelOverlap: 'parity'
                }
            }
        };
        return vegaSpec; //little workaround because the multiple types supported by vegaEmbed are not recognized correctly
    }
    /**
     * Arquero Resources:
     *  https://sphweb.bumc.bu.edu/otlt/mph-modules/bs/bs704_survival/bs704_survival4.html
     *  https://towardsdatascience.com/kaplan-meier-curves-c5768e349479
     *  Test calculations: https://observablehq.com/d/5426a198a7a2dca7
     */
    convertData(data) {
        const aqdata = from(data)
            // we could filter all items that have null for days to death/last followup first, but those will be removed by a later step
            // pre-processing: remove days to last follow for all patients where a death date is available (can only be before death)
            .derive({ days_to_last_followup: (d) => !op.match(/null/, d.days_to_death, null) && !op.match(/null/, d.days_to_last_followup, null) ? null : d.days_to_last_followup })
            //
            // Convert to long format (one row per sample, day, and event)
            .fold(not('tissuename', DATA_LABEL), { as: ['event', KaplanMeierPlot.TIME] }) // transform from wide form into long form (one column with days, one column showing which event (death/last followup)
            .filter((d) => !op.match(/null/, d.days, null)) //drop missing data
            //
            .groupby(DATA_LABEL, KaplanMeierPlot.TIME, 'event') // group by cohort and days to calc events (#deaths, #followups), group by event so that the events can be directly counted with ...
            .count() // sum up same events of each day per group
            //
            .concat(table({ Cohort: getCohortLabels(this.cohorts), days: [0, 0] })) //ensure to start at zero days
            //
            // convert back to wide format: one column for days, two columns for number of death followup events
            .groupby(DATA_LABEL, KaplanMeierPlot.TIME)
            .pivot('event', 'count')
            //
            // rename columns
            .derive({ deaths: (d) => d.days_to_death || 0, last_followups: (d) => d.days_to_last_followup || 0 })
            //
            // calculate risk
            .groupby(DATA_LABEL).orderby(desc(KaplanMeierPlot.TIME)) // sum up from behind to ease calculation
            .derive({ at_risk: rolling((d) => op.sum(d.deaths) + op.sum(d.last_followups)) })
            //
            // Calculate Survival and error basis, based on https://sphweb.bumc.bu.edu/otlt/mph-modules/bs/bs704_survival/bs704_survival4.html
            .groupby(DATA_LABEL).orderby(KaplanMeierPlot.TIME)
            .derive({
            [KaplanMeierPlot.SURVIVAL]: rolling((d) => op.product(1 - (d.deaths) / d.at_risk)),
            error_sum: rolling((d) => op.sum(d.deaths / (d.at_risk * (d.at_risk - d.deaths)))),
        })
            //
            // calculate actual error, has to be done in a sepeate step because it relies on values just calculated
            // "Greenwoods" Error based on https://sphweb.bumc.bu.edu/otlt/mph-modules/bs/bs704_survival/bs704_survival4.html
            .derive({
            [KaplanMeierPlot.ERROR]: (d) => 1.96 * d.survival * op.sqrt(d.error_sum),
        });
        // not necessary for plotting:
        // .derive({
        //   error_up: d => (d.survival_propability + d.error_95) > 1 ? 1 : (d.survival_propability + d.error_95),
        //   error_down: d => (d.survival_propability - d.error_95) < 0 ? 0 : (d.survival_propability - d.error_95)
        // })
        //aqdata.print({limit: 100}); // print to console
        return aqdata.objects();
    }
    /**
     * From == To for categorical data, e.g. FROM: male, TO: male
     * From is inclusive (>=) and TO exclusive (<) for numerical data, e.g. FROM 50 TO 60 = [50,60)
     */
    getSelectedData() {
        const filters = [];
        if (!this.hideVisualization) {
            const selections = this.vegaView.signal(AVegaVisualization.SELECTION_SIGNAL_NAME);
            let attrSelection = selections[KaplanMeierPlot.TIME]; // value == name applied through density transform
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
        log.debug('filters', filters);
        return filters;
    }
    async showImpl(chart, data) {
        await super.showImpl(chart, data);
        this.vegaView.addDataListener(AVegaVisualization.SPLITVALUE_DATA_STORE, this.vegaSplitListener);
        this.vegaView.addSignalListener('remMark', (name, value) => {
            this.splitValues = this.splitValues.filter((splitVal) => splitVal.x !== value.x);
            this.vegaView.data(AVegaVisualization.SPLITVALUE_DATA_STORE, this.splitValues);
        });
        this.toggleFilterSplitMarks(this.getActiveTask());
    }
}
KaplanMeierPlot.NAME = 'Kaplan-Meier Plot';
// ATTENTION! with arquero, you can't use variables for identifiers (e.g., data[CALCULATED_ERROR])
KaplanMeierPlot.SURVIVAL = 'survival'; // After applying the transform
KaplanMeierPlot.TIME = 'days'; // After applying the transform
KaplanMeierPlot.ERROR = 'error_95'; // After applying the transform
//# sourceMappingURL=KaplanMeierPlot.js.map