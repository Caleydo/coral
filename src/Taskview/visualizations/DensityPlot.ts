import {format} from 'd3-format';
import {select} from 'd3-selection';
import log from 'loglevel';
import {Spec as VegaSpec} from 'vega';
import {TopLevelSpec as VegaLiteSpec} from 'vega-lite';
import {ICohort} from '../../CohortInterfaces';
import {IdValuePair} from '../../data/Attribute';
import {AVegaVisualization, SingleAttributeVisualization} from './AVegaVisualization';
import {DATA_LABEL} from './constants';
import {countConfig, counts} from './config/CountCounfig';

export class DensityPlot extends SingleAttributeVisualization {
  static readonly NAME = 'Density Plot';
  static readonly TRANSFORMED_ATTRIBUTE = 'value'; // After applying the vega density transform, the attribute is simply called value

  protected readonly type = 'quantitative';

  constructor(vegaLiteOptions: Object = {}) {
    super(vegaLiteOptions);

    this.config = [
      {icon: '<i class="fas fa-ruler"></i>', label: 'Density Estimation Method', groups: [countConfig]}
    ];
  }


  getSpec(data: IdValuePair[]): VegaLiteSpec {
    this.field = DensityPlot.TRANSFORMED_ATTRIBUTE; // set for interval selection handler

    if (this.attribute.type !== `number`) {
      throw new Error(`Type "${this.attribute.type}" is not supported for density plots.`);
    }

    const vegaSpec: VegaSpec = {
      $schema: 'https://vega.github.io/schema/vega/v5.json',
      autosize: {type: 'fit-x', contains: 'padding'},
      background: 'white',
      padding: {left: 5, top: 0, right: 0, bottom: 5},
      height: 300,
      style: 'cell',
      encode: {update: {cursor: {value: 'text'}}},
      data: [
        {name: 'selected_store'},
        {
          name: 'source_0',
          values: data.filter((d) => d[this.attribute.dataKey] !== null)
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
            {
              type: 'kde',
              field: this.attribute.dataKey,
              groupby: [DATA_LABEL],
              counts: countConfig.getSelected().label === counts.label,
              as: ['value', 'density']
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
              events: [{
                markname: 'right_grabber',
                type: 'mousedown',
                filter: ['!event.ctrlKey']
              }],
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
                  filter: ['event.ctrlKey', 'item().mark.name === \'root\'']
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
                {markname: 'right_grabber', type: 'click', filter: 'event.ctrlKey'},
                {markname: 'splitrule', type: 'click', filter: 'event.ctrlKey'}
              ],
              update: 'group().datum'
            }
          ]
        },
        {
          name: 'unit',
          value: {},
          on: [
            {events: 'mousemove', update: 'isTuple(group()) ? group() : unit'}
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
                  {source: 'window', type: 'mouseup'}
                ]
              },
              update: '[selected_x[0], clamp(x(unit), 0, width)]'
            },
            {
              events: {signal: 'selected_scale_trigger'},
              update: '[scale(\'x\', selected_value[0]), scale(\'x\', selected_value[1])]'
            },
            {
              events: [{
                source: 'view',
                type: 'dblclick',
                filter: [
                  'event.item.mark.name !== \'right_grabber\''
                ]
              }],
              update: '[0, 0]'
            },
            {
              events: {signal: 'selected_translate_delta'},
              update: 'clampRange(panLinear(selected_translate_anchor.extent_x, selected_translate_delta.x / span(selected_translate_anchor.extent_x)), 0, width)'
            },
            {
              events: {signal: 'selected_zoom_delta'},
              update: 'clampRange(zoomLinear(selected_x, selected_zoom_anchor.x, selected_zoom_delta), 0, width)'
            }
          ]
        },
        {
          name: 'selected_value',
          value: this.getBrushRange(),
          on: [
            {
              events: {signal: 'selected_x'},
              update: 'selected_x[0] === selected_x[1] ? null : invert(\'x\', selected_x)'
            }
          ]
        },
        {
          name: 'selected_scale_trigger',
          value: {},
          on: [
            {
              events: [{scale: 'x'}],
              update: '(!isArray(selected_value) || (+invert(\'x\', selected_x)[0] === +selected_value[0] && +invert(\'x\', selected_x)[1] === +selected_value[1])) ? selected_scale_trigger : {}'
            }
          ]
        },
        {
          name: 'selected_tuple',
          on: [
            {
              events: [{signal: 'selected_value'}],
              update: 'selected_value ? {unit: \'layer_0\', fields: selected_tuple_fields, values: [selected_value]} : null'
            }
          ]
        },
        {
          name: 'selected_tuple_fields',
          value: [{field: 'value', channel: 'x', type: 'R'}]
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
                    {source: 'window', type: 'mouseup'}
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
              events: {signal: 'selected_tuple'},
              update: 'modify(\'selected_store\', selected_tuple, true)'
            }
          ]
        }
      ],
      marks: [
        {
          name: 'selected_brush_bg',
          type: 'rect',
          clip: true,
          encode: {
            enter: {fill: {value: '#333'}, fillOpacity: {value: 0.125}},
            update: {
              x: [
                {
                  test: 'data(\'selected_store\').length && data(\'selected_store\')[0].unit === \'layer_0\'',
                  signal: 'selected_x[0]'
                },
                {value: 0}
              ],
              y: [
                {
                  test: 'data(\'selected_store\').length && data(\'selected_store\')[0].unit === \'layer_0\'',
                  value: 0
                },
                {value: 0}
              ],
              x2: [
                {
                  test: 'data(\'selected_store\').length && data(\'selected_store\')[0].unit === \'layer_0\'',
                  signal: 'selected_x[1]'
                },
                {value: 0}
              ],
              y2: [
                {
                  test: 'data(\'selected_store\').length && data(\'selected_store\')[0].unit === \'layer_0\'',
                  field: {group: 'height'}
                },
                {value: 0}
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
              width: {field: {group: 'width'}},
              height: {field: {group: 'height'}}
            }
          },
          marks: [
            {
              name: 'layer_0_marks',
              type: 'line',
              style: ['line'],
              sort: {field: ['datum[\'value\']'], order: ['ascending']},
              interactive: true,
              from: {data: 'faceted_path_layer_0_main'},
              encode: {
                update: {
                  cursor: {value: 'text'},
                  tooltip: {
                    signal: `{\'${this.attribute.label}\': format(datum[\'value\'], \'\'), \'Density\': format(datum[\'density\'], \'\'), \'value\': format(datum[\'value\'], \'\'), \'${DATA_LABEL}\': isValid(datum[\'${DATA_LABEL}\']) ? datum[\'${DATA_LABEL}\'] : \'\'+datum[\'${DATA_LABEL}\']}`
                  },
                  stroke: {scale: 'color', field: DATA_LABEL},
                  description: {
                    signal: `\'${this.attribute.label}: \' + (format(datum[\'value\'], \'\')) + \'; Density: \' + (format(datum[\'density\'], \'\')) + \'; value: \' + (format(datum[\'value\'], \'\')) + \'; ${DATA_LABEL}: \' + (isValid(datum[\'${DATA_LABEL}\']) ? datum[\'${DATA_LABEL}\'] : \'\'+datum[\'${DATA_LABEL}\'])`
                  },
                  x: {scale: 'x', field: 'value'},
                  y: {scale: 'y', field: 'density'},
                  defined: {
                    signal: 'isValid(datum[\'value\']) && isFinite(+datum[\'value\']) && isValid(datum[\'density\']) && isFinite(+datum[\'density\'])'
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
              cursor: {value: 'pointer'},
              fill: {value: 'transparent'}
            },
            update: {
              x: [
                {
                  test: 'data(\'selected_store\').length && data(\'selected_store\')[0].unit === \'layer_0\'',
                  signal: 'selected_x[0]'
                },
                {value: 0}
              ],
              y: [
                {
                  test: 'data(\'selected_store\').length && data(\'selected_store\')[0].unit === \'layer_0\'',
                  value: 0
                },
                {value: 0}
              ],
              x2: [
                {
                  test: 'data(\'selected_store\').length && data(\'selected_store\')[0].unit === \'layer_0\'',
                  signal: 'selected_x[1]'
                },
                {value: 0}
              ],
              y2: [
                {
                  test: 'data(\'selected_store\').length && data(\'selected_store\')[0].unit === \'layer_0\'',
                  field: {group: 'height'}
                },
                {value: 0}
              ],
              stroke: [
                {test: 'selected_x[0] !== selected_x[1]', value: 'white'},
                {value: null}
              ]
            }
          }
        },
        {
          name: 'splitmarks',
          type: 'group',
          from: {data: 'splitvalues'},
          encode: {
            enter: {height: {field: {group: 'height'}}},
            update: {
              x: [
                {
                  test: '!isValid(datum[\'x\']) || !isFinite(+datum[\'x\'])',
                  value: 0
                },
                {scale: 'x', field: 'x'}
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
                  strokeDash: {value: [4, 6]},
                  stroke: {value: 'black'},
                  y: {value: 0},
                  y2: {field: {group: 'height'}}
                }
              }
            },
            {
              type: 'path',
              name: 'right_grabber',
              encode: {
                enter: {
                  y: {field: {group: 'height'}, mult: 0.5, offset: -50},
                  fill: {value: '#fff'},
                  stroke: {value: '#666'},
                  cursor: {value: 'ew-resize'}
                },
                update: {
                  path: {
                    signal: '\'M0.5,33.333333333333336A6,6 0 0 1 6.5,39.333333333333336V60.66666666666667A6,6 0 0 1 0.5,66.66666666666667ZM2.5,41.333333333333336V58.66666666666667M4.5,41.333333333333336V58.66666666666667\''
                  }
                }
              }
            }
          ]
        }
      ],
      scales: [
        {
          name: 'x',
          ... this.attribute.preferLog ? {type: 'log', base: 10} : {type: 'linear', zero: false},
          domain: {data: 'data_0', field: 'value'},
          range: [0, {signal: 'width'}],
          clamp: true,
          nice: false
        },
        {
          name: 'y',
          type: 'linear',
          domain: {data: 'data_0', field: 'density'},
          range: [{signal: 'height'}, 0],
          nice: true,
          zero: true
        },
        {
          name: 'color',
          type: 'ordinal',
          domain: {data: 'data_0', field: DATA_LABEL, sort: true},
          range: 'category'
        }
      ],
      axes: [
        {
          scale: 'x',
          orient: 'bottom',
          gridScale: 'y',
          grid: true,
          tickCount: {signal: 'ceil(width/40)'},
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
          tickCount: {signal: 'ceil(height/40)'},
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
          title: this.attribute.label,
          labelFlush: true,
          tickCount: {signal: 'ceil(width/40)'},
          zindex: 0
        },
        {
          scale: 'y',
          orient: 'left',
          grid: false,
          title: 'Density',
          tickCount: {signal: 'ceil(height/40)'},
          zindex: 0
        }
      ],
      config: {
        range: {category: this.colorPalette},
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

    return vegaSpec as unknown as VegaLiteSpec; //little workaround because the multiple types supported by vegaEmbed are not recognized correctly
  }

  /**
   * From == To for categorical data, e.g. FROM: male, TO: male
   * From is inclusive (>=) and TO exclusive (<) for numerical data, e.g. FROM 50 TO 60 = [50,60)
   */
  getSelectedData(): {cohort: ICohort, from: string | number, to: string | number}[] {
    const filters: {cohort: ICohort, from: string | number, to: string | number}[] = [];
    const formatter = format('.6~f'); // round numbers to 6 decimal digits
    if (!this.hideVisualization) {
      const selections = this.vegaView.signal(AVegaVisualization.SELECTION_SIGNAL_NAME);
      let attrSelection = selections[DensityPlot.TRANSFORMED_ATTRIBUTE]; // value == name applied through density transform
      if (!attrSelection || attrSelection.length !== 2) {
        attrSelection = this.vegaView.scale('x').domain();
      }
      this.cohorts.forEach((cohort) => {
        filters.push({from: formatter(attrSelection[0]), to: formatter(attrSelection[1]), cohort});

        const nullFilter = this.getNullValueSelectedData(cohort, this.attribute);
        if (nullFilter) {
          filters.push(nullFilter);
        }
      });
    } else {
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

  async showImpl(chart: HTMLDivElement, data: Array<IdValuePair>) {
    await super.showImpl(chart, data);

    this.vegaView.addDataListener(AVegaVisualization.SPLITVALUE_DATA_STORE, this.vegaSplitListener);
    this.vegaView.addSignalListener('remMark', (name, value) => {
      this.splitValues = this.splitValues.filter((splitVal) => splitVal.x !== value.x);
      this.vegaView.data(AVegaVisualization.SPLITVALUE_DATA_STORE, this.splitValues);
    });
    select(this.chart).selectAll('g.splitmarks').style('display', 'none');
  }
}
