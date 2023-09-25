/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-disable global-require */
import * as Comlink from 'comlink';
import { select } from 'd3v7';
import { Spec as VegaSpec } from 'vega';
import { TopLevelSpec as VegaLiteSpec } from 'vega-lite';
import { TopLevel, LayerSpec } from 'vega-lite/build/src/spec';
import { Field } from 'vega-lite/build/src/channeldef';
import { ICohort } from '../../app/interfaces';
import { AttributeType, IAttribute, IdValuePair, ServerColumnAttribute } from '../../data';
import {
  ICohortDBDataParams, ICohortDBDataRecommendSplitParams,
  ICohortMultiAttrDBDataParams, ICohortMultiAttrDBDataRecommendSplitParams, IEqualsList, INumRange,
  NumRangeOperators, recommendSplitDB
} from '../../base';
import {IFilterDesc, INewCohortDesc, inRange} from '../../util';
import {AutoSplitEvent, FilterEvent} from '../../base/events';
import { DATA_LABEL } from './constants';
import { AxisType, MultiAttributeVisualization } from './MultiAttributeVisualization';

import {
  createDBCohortAutomatically,
} from '../../base/rest';
import {cloneDeep} from "lodash";
import {AVegaVisualization} from "./AVegaVisualization";

export class Scatterplot extends MultiAttributeVisualization {
  static readonly NAME: string = 'Scatterplot';

  protected checkAttributeType = false;

  constructor(vegaLiteOptions: object = {}) {
    super(vegaLiteOptions);
  }

  getSpec(data: IdValuePair[]): VegaLiteSpec {
    if (this.checkAttributeType && this.attributes.some((attr) => attr.type !== `number`)) {
      throw new Error(`Scatterplot requires attributes of type number`);
    }

    const vegaSpec: VegaSpec = {
      $schema: `https://vega.github.io/schema/vega/v5.json`,
      autosize: { type: `fit`, contains: `padding` },
      background: `white`,
      padding: { left: 5, top: 5, right: 5, bottom: 5 }, // top and right padding are necessary for split rulers
      height: 300,
      style: `cell`,
      encode: { update: { cursor: { value: `crosshair` } } },
      data: [
        {
          name: `selected_store`,
          values: [
            {
              unit: `layer_0`,
              fields: [
                { field: `${this.attributes[0].dataKey}`, channel: `x`, type: `R` },
                { field: `${this.attributes[1].dataKey}`, channel: `y`, type: `R` },
              ],
              values: [[], []],
            },
          ],
        },
        {
          name: `source_0`,
          values: data,
        },
        {
          name: `splitvalues_x`,
          values: this.splitValuesX,
          on: [
            {
              trigger: `draggedMark_x`,
              modify: `draggedMark_x`,
              values: `dragTo_x`,
            },
            { trigger: `addMark_x`, insert: `addMark_x` },
            { trigger: `remMark_x`, remove: `remMark_x` },
          ],
        },
        {
          name: `splitvalues_y`,
          values: this.splitValuesY,
          on: [
            {
              trigger: `draggedMark_y`,
              modify: `draggedMark_y`,
              values: `dragTo_y`,
            },
            { trigger: `remMark_y`, remove: `remMark_y` },
          ],
        },
        {
          name: `data_0`,
          source: `source_0`,
          transform: [
            {
              type: `filter`,
              expr: `isValid(datum['${this.attributes[0].dataKey}']) && isFinite(+datum['${this.attributes[0].dataKey}']) && isValid(datum['${this.attributes[1].dataKey}']) && isFinite(+datum['${this.attributes[1].dataKey}'])`,
            },
          ],
        },
        {
          name: `data_1`,
          source: `splitvalues_x`,
          transform: [
            {
              type: `filter`,
              expr: `isValid(datum['data']) && isFinite(+datum['data'])`,
            },
          ],
        },
        {
          name: `data_2`,
          source: `splitvalues_y`,
          transform: [
            {
              type: `filter`,
              expr: `isValid(datum['data']) && isFinite(+datum['data'])`,
            },
          ],
        },
      ],
      signals: [
        {
          name: `width`,
          init: `isFinite(containerSize()[0]) ? containerSize()[0] : 200`,
          on: [
            {
              update: `isFinite(containerSize()[0]) ? containerSize()[0] : 200`,
              events: `window:resize`,
            },
          ],
        },
        {
          name: `dragTo_x`,
          on: [
            {
              events: `[@grabber_x:mousedown, window:mouseup] > window:mousemove`,
              update: `{data: invert('x',x())}`,
            },
          ],
        },
        {
          name: `draggedMark_x`,
          on: [
            {
              events: [
                {
                  markname: `grabber_x`,
                  type: `mousedown`,
                  filter: [`!event.ctrlKey`],
                },
              ],
              update: `group().datum`,
            },
          ],
        },
        {
          name: `addMark_x`,
          on: [
            {
              events: [
                {
                  source: `view`,
                  type: `click`,
                  filter: [`event.ctrlKey`, `item().mark.name === 'root'`],
                },
              ],
              update: `{data: invert('x',x())}`,
            },
          ],
        },
        {
          name: `remMark_x`,
          on: [
            {
              events: [
                {
                  markname: `grabber_x`,
                  type: `click`,
                  filter: `event.ctrlKey`,
                },
                {
                  markname: `splitrule_x`,
                  type: `click`,
                  filter: `event.ctrlKey`,
                },
              ],
              update: `group().datum`,
            },
          ],
        },
        {
          name: `dragTo_y`,
          on: [
            {
              events: `[@grabber_y:mousedown, window:mouseup] > window:mousemove`,
              update: `{data: invert('y',y())}`,
            },
          ],
        },
        {
          name: `draggedMark_y`,
          on: [
            {
              events: [
                {
                  markname: `grabber_y`,
                  type: `mousedown`,
                  filter: [`!event.ctrlKey`],
                },
              ],
              update: `group().datum`,
            },
          ],
        },
        {
          name: `remMark_y`,
          on: [
            {
              events: [
                {
                  markname: `grabber_y`,
                  type: `click`,
                  filter: `event.ctrlKey`,
                },
                {
                  markname: `splitrule_y`,
                  type: `click`,
                  filter: `event.ctrlKey`,
                },
              ],
              update: `group().datum`,
            },
          ],
        },
        {
          name: `unit`,
          value: {},
          on: [{ events: `mousemove`, update: `isTuple(group()) ? group() : unit` }],
        },
        {
          name: `selected`,
          update: `vlSelectionResolve('selected_store', 'union')`,
        },
        {
          name: `selected_x`,
          init: `[]`,
          on: [
            {
              events: {
                source: `scope`,
                type: `mousedown`,
                filter: [
                  `!event.item || event.item.mark.name !== 'selected_brush'`,
                  `event.item.mark.name !== 'grabber_x'`,
                  `event.item.mark.name !== 'grabber_y'`,
                ],
              },
              update: `[x(unit), x(unit)]`,
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
                      `event.item.mark.name !== 'grabber_x'`,
                      `event.item.mark.name !== 'grabber_y'`,
                    ],
                  },
                  { source: `window`, type: `mouseup` },
                ],
              },
              update: `[selected_x[0], clamp(x(unit), 0, width)]`,
            },
            {
              events: { signal: `selected_scale_trigger` },
              update: `[scale('x', selected_attr0[0]), scale('x', selected_attr0[1])]`,
            },
            {
              events: [{ source: `view`, type: `dblclick` }],
              update: `[0, 0]`,
            },
            {
              events: { signal: `selected_translate_delta` },
              update: `clampRange(panLinear(selected_translate_anchor.extent_x, selected_translate_delta.x / span(selected_translate_anchor.extent_x)), 0, width)`,
            },
            {
              events: { signal: `selected_zoom_delta` },
              update: `clampRange(zoomLinear(selected_x, selected_zoom_anchor.x, selected_zoom_delta), 0, width)`,
            },
          ],
        },
        {
          name: `selected_attr0`,
          init: `[]`,
          on: [
            {
              events: { signal: `selected_x` },
              update: `selected_x[0] === selected_x[1] ? null : invert('x', selected_x)`,
            },
          ],
        },
        {
          name: `selected_y`,
          init: `[]`,
          on: [
            {
              events: {
                source: `scope`,
                type: `mousedown`,
                filter: [`!event.item || event.item.mark.name !== 'selected_brush'`],
              },
              update: `[y(unit), y(unit)]`,
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
                    filter: [`!event.item || event.item.mark.name !== 'selected_brush'`],
                  },
                  { source: `window`, type: `mouseup` },
                ],
              },
              update: `[selected_y[0], clamp(y(unit), 0, height)]`,
            },
            {
              events: { signal: `selected_scale_trigger` },
              update: `[scale('y', selected_attr1[0]), scale('y', selected_attr1[1])]`,
            },
            {
              events: [{ source: `view`, type: `dblclick` }],
              update: `[0, 0]`,
            },
            {
              events: { signal: `selected_translate_delta` },
              update: `clampRange(panLinear(selected_translate_anchor.extent_y, selected_translate_delta.y / span(selected_translate_anchor.extent_y)), 0, height)`,
            },
            {
              events: { signal: `selected_zoom_delta` },
              update: `clampRange(zoomLinear(selected_y, selected_zoom_anchor.y, selected_zoom_delta), 0, height)`,
            },
          ],
        },
        {
          name: `selected_attr1`,
          init: `[]`,
          on: [
            {
              events: { signal: `selected_y` },
              update: `selected_y[0] === selected_y[1] ? null : invert('y', selected_y)`,
            },
          ],
        },
        {
          name: `selected_scale_trigger`,
          value: {},
          on: [
            {
              events: [{ scale: `x` }, { scale: `y` }],
              update: `(!isArray(selected_attr0) || (+invert('x', selected_x)[0] === +selected_attr0[0] && +invert('x', selected_x)[1] === +selected_attr0[1])) && (!isArray(selected_attr1) || (+invert('y', selected_y)[0] === +selected_attr1[0] && +invert('y', selected_y)[1] === +selected_attr1[1])) ? selected_scale_trigger : {}`,
            },
          ],
        },
        {
          name: `selected_tuple`,
          init: `{unit: 'layer_0', fields: selected_tuple_fields, values: [[], []]}`,
          on: [
            {
              events: [{ signal: `selected_attr0 || selected_attr1` }],
              update: `selected_attr0 && selected_attr1 ? {unit: 'layer_0', fields: selected_tuple_fields, values: [selected_attr0,selected_attr1]} : null`,
            },
          ],
        },
        {
          name: `selected_tuple_fields`,
          value: [
            { field: `${this.attributes[0].dataKey}`, channel: `x`, type: `R` },
            { field: `${this.attributes[1].dataKey}`, channel: `y`, type: `R` },
          ],
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
                  markname: `selected_brush`,
                },
              ],
              update: `{x: x(unit), y: y(unit), extent_x: slice(selected_x), extent_y: slice(selected_y)}`,
            },
          ],
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
                      markname: `selected_brush`,
                    },
                    { source: `window`, type: `mouseup` },
                  ],
                },
              ],
              update: `{x: selected_translate_anchor.x - x(unit), y: selected_translate_anchor.y - y(unit)}`,
            },
          ],
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
                  markname: `selected_brush`,
                },
              ],
              update: `{x: x(unit), y: y(unit)}`,
            },
          ],
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
                  markname: `selected_brush`,
                },
              ],
              force: true,
              update: `pow(1.001, event.deltaY * pow(16, event.deltaMode))`,
            },
          ],
        },
        {
          name: `selected_modify`,
          on: [
            {
              events: { signal: `selected_tuple` },
              update: `modify('selected_store', selected_tuple, true)`,
            },
          ],
        },
      ],
      marks: [
        {
          name: `selected_brush_bg`,
          type: `rect`,
          clip: true,
          encode: {
            enter: { fill: { value: `#333` }, fillOpacity: { value: 0.125 } },
            update: {
              x: [
                {
                  test: `data('selected_store').length && data('selected_store')[0].unit === 'layer_0'`,
                  signal: `selected_x[0]`,
                },
                { value: 0 },
              ],
              y: [
                {
                  test: `data('selected_store').length && data('selected_store')[0].unit === 'layer_0'`,
                  signal: `selected_y[0]`,
                },
                { value: 0 },
              ],
              x2: [
                {
                  test: `data('selected_store').length && data('selected_store')[0].unit === 'layer_0'`,
                  signal: `selected_x[1]`,
                },
                { value: 0 },
              ],
              y2: [
                {
                  test: `data('selected_store').length && data('selected_store')[0].unit === 'layer_0'`,
                  signal: `selected_y[1]`,
                },
                { value: 0 },
              ],
            },
          },
        },
        {
          name: `layer_0_marks`,
          type: `symbol`,
          style: [`circle`],
          interactive: true,
          from: { data: `data_0` },
          encode: {
            update: {
              opacity: { value: 0.9 },
              size: { value: 15 },
              cursor: { value: `crosshair` },
              tooltip: {
                signal: `{'${this.attributes[0].label}': format(datum['${this.attributes[0].dataKey}'], ''), '${this.attributes[1].label}': format(datum['${this.attributes[1].dataKey}'], ''), '${DATA_LABEL}': isValid(datum['${DATA_LABEL}']) ? datum['${DATA_LABEL}'] : ''+datum['${DATA_LABEL}']}`,
              },
              fill: { scale: `color`, field: `${DATA_LABEL}` },
              ariaRoleDescription: { value: `circle` },
              description: {
                signal: `'${this.attributes[0].label}: ' + (format(datum['${this.attributes[0].dataKey}'], '')) + '; ${this.attributes[1].label}: ' + (format(datum['${this.attributes[1].dataKey}'], '')) + '; ${DATA_LABEL}: ' + (isValid(datum['${DATA_LABEL}']) ? datum['${DATA_LABEL}'] : ''+datum['${DATA_LABEL}'])`,
              },
              x: [
                {
                  test: `!isValid(datum['${this.attributes[0].dataKey}']) || !isFinite(+datum['${this.attributes[0].dataKey}'])`,
                  value: 0,
                },
                { scale: `x`, field: `${this.attributes[0].dataKey}` },
              ],
              y: [
                {
                  test: `!isValid(datum['${this.attributes[1].dataKey}']) || !isFinite(+datum['${this.attributes[1].dataKey}'])`,
                  field: { group: `height` },
                },
                { scale: `y`, field: `${this.attributes[1].dataKey}` },
              ],
              shape: { value: `circle` },
            },
          },
        },
        {
          name: `splitmarks_x`,
          type: `group`,
          from: { data: `data_1` },
          encode: {
            enter: { height: { field: { group: `height` } } },
            update: {
              x: [
                {
                  test: `!isValid(datum['data']) || !isFinite(+datum['data'])`,
                  value: 0,
                },
                { scale: `x`, field: `data` },
              ],
            },
          },
          marks: [
            {
              name: `splitrule_x`,
              type: `rule`,
              style: [`rule`],
              encode: {
                update: {
                  strokeDash: { value: [4, 6] },
                  stroke: { value: `black` },
                  y: { value: 0 },
                  y2: { field: { group: `height` } },
                },
              },
            },
            {
              type: `path`,
              name: `grabber_x`,
              encode: {
                enter: {
                  y: { field: { group: `height` }, mult: 0.5, offset: -80 },
                  fill: { value: `#fff` },
                  stroke: { value: `#666` },
                  cursor: { value: `ew-resize` },
                },
                update: {
                  path: {
                    signal: `'M0.5,33.333A6,6 0 0 1 6.5,39.333V60.666A6,6 0 0 1 0.5,66.666ZM2.5,41.333V58.666M4.5,41.333V58.666'`,
                  },
                },
              },
            },
          ],
        },
        {
          name: `splitmarks_y`,
          type: `group`,
          from: { data: `data_2` },
          encode: {
            update: {
              x: { field: { group: `width` } },
              x2: { value: 0 },
              y: [
                {
                  test: `!isValid(datum['data']) || !isFinite(+datum['data'])`,
                  value: 0,
                },
                { scale: `y`, field: `data` },
              ],
            },
          },
          marks: [
            {
              name: `splitrule_y`,
              type: `rule`,
              style: [`rule`],
              encode: {
                update: {
                  strokeDash: { value: [4, 6] },
                  stroke: { value: `black` },
                  description: {
                    signal: `'data: ' + (format(datum['data'], ''))`,
                  },
                  x: { field: { group: `width` } },
                  x2: { value: 0 },
                  y: [
                    {
                      test: `!isValid(datum['data']) || !isFinite(+datum['data'])`,
                      field: { group: `height` },
                    },
                    { scale: `y`, field: `data` },
                  ],
                },
              },
            },
            {
              type: `path`,
              name: `grabber_y`,
              encode: {
                enter: {
                  x: { field: { group: `width` }, mult: 0.5, offset: 15 },
                  y: [
                    {
                      test: `!isValid(datum['data']) || !isFinite(+datum['data'])`,
                      field: { group: `height` },
                    },
                    { scale: `y`, field: `data` },
                  ],
                  fill: { value: `#fff` },
                  stroke: { value: `#666` },
                  cursor: { value: `ns-resize` },
                },
                update: {
                  path: {
                    signal: `'M33.333,0a6,6 0 0 0 -6,-6H6A6,6 0 0 0 0,0Zm-8,-2 H8M25.333,-4H8'`,
                  },
                },
              },
            },
          ],
        },
        {
          name: `selected_brush`,
          type: `rect`,
          clip: true,
          encode: {
            enter: {
              cursor: { value: `pointer` },
              fill: { value: `transparent` },
            },
            update: {
              x: [
                {
                  test: `data('selected_store').length && data('selected_store')[0].unit === 'layer_0'`,
                  signal: `selected_x[0]`,
                },
                { value: 0 },
              ],
              y: [
                {
                  test: `data('selected_store').length && data('selected_store')[0].unit === 'layer_0'`,
                  signal: `selected_y[0]`,
                },
                { value: 0 },
              ],
              x2: [
                {
                  test: `data('selected_store').length && data('selected_store')[0].unit === 'layer_0'`,
                  signal: `selected_x[1]`,
                },
                { value: 0 },
              ],
              y2: [
                {
                  test: `data('selected_store').length && data('selected_store')[0].unit === 'layer_0'`,
                  signal: `selected_y[1]`,
                },
                { value: 0 },
              ],
              stroke: [
                {
                  test: `selected_x[0] !== selected_x[1] && selected_y[0] !== selected_y[1]`,
                  value: `white`,
                },
                { value: null },
              ],
            },
          },
        },
      ],
      scales: [
        {
          name: `x`,
          ...(this.attributes[0].preferLog ? { type: 'log', base: 10 } : { type: 'linear', zero: false }),
          domain: {
            fields: [
              { data: `data_0`, field: `${this.attributes[0].dataKey}` },
              { data: `data_1`, field: `data` },
            ],
          },
          range: [0, { signal: `width` }],
          clamp: true,
          nice: false,
          zero: false,
        },
        {
          name: `y`,
          ...(this.attributes[1].preferLog ? { type: 'log', base: 10 } : { type: 'linear', zero: false }),
          domain: {
            fields: [
              { data: `data_0`, field: `${this.attributes[1].dataKey}` },
              { data: `data_2`, field: `data` },
            ],
          },
          range: [{ signal: `height` }, 0],
          clamp: true,
          nice: false,
          zero: false,
        },
        {
          name: `color`,
          type: `ordinal`,
          domain: { data: 'data_0', field: DATA_LABEL, sort: true },
          range: `category`,
        },
      ],
      axes: [
        {
          scale: `x`,
          orient: `bottom`,
          gridScale: `y`,
          grid: false,
          tickCount: { signal: `ceil(width/40)` },
          domain: false,
          labels: false,
          aria: false,
          maxExtent: 0,
          minExtent: 0,
          ticks: false,
          zindex: 0,
        },
        {
          scale: `y`,
          orient: `left`,
          gridScale: `x`,
          grid: false,
          tickCount: { signal: `ceil(height/40)` },
          domain: false,
          labels: false,
          aria: false,
          maxExtent: 0,
          minExtent: 0,
          ticks: false,
          zindex: 0,
        },
        {
          scale: `x`,
          orient: `bottom`,
          grid: false,
          title: `${this.attributes[0].label}`,
          labelFlush: true,
          tickCount: { signal: `ceil(width/40)` },
          zindex: 0,
        },
        {
          scale: `y`,
          orient: `left`,
          grid: false,
          title: `${this.attributes[1].label}`,
          tickCount: { signal: `ceil(height/40)` },
          zindex: 0,
        },
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
          labelBound: true,
        },
        legend: {
          titleFontSize: 16,
          titleFontWeight: 500,
          titleFont: `Roboto`,
          labelFontSize: 12,
          labelLimit: 150,
          labelFont: `Roboto`,
          labelOverlap: `parity`,
        },
      },
    };

    return vegaSpec as unknown as VegaLiteSpec;
  }

  async showImpl(chart: HTMLDivElement, data: Array<IdValuePair>) {
    await super.showImpl(chart, data);

    this.vegaView.addDataListener('splitvalues_x', this.vegaSplitListener);
    this.vegaView.addDataListener('splitvalues_y', this.vegaSplitListener);

    this.vegaView.addSignalListener('remMark_x', (name, value) => {
      this.splitValuesX = this.splitValuesX.filter((splitVal) => splitVal !== value);
      this.vegaView.data('splitvalues_x', this.splitValuesX);
    });
    this.vegaView.addSignalListener('remMark_y', (name, value) => {
      this.splitValuesY = this.splitValuesY.filter((splitVal) => splitVal !== value);
      this.vegaView.data('splitvalues_y', this.splitValuesY);
    });

    this.toggleFilterSplitMarks(this.getActiveTask());
  }

  filter() {
    const filterDescs: IFilterDesc[] = [];
    for (const cht of this.cohorts) {
      const filter = [];
      for (const [i, axis] of this.axes.entries()) {
        const interval = this.getInterval(axis);
        const range = [
          {
            operatorOne: NumRangeOperators.gte,
            valueOne: interval[0],
            operatorTwo: NumRangeOperators.lte,
            valueTwo: interval[1],
          },
        ];
        if (this.getNullCheckboxState(this.attributes[i])) {
          range.push({
            operatorOne: NumRangeOperators.gte,
            valueOne: null,
            operatorTwo: NumRangeOperators.lte,
            valueTwo: null,
          });
        }
        filter.push({
          attr: this.attributes[i],
          range,
        });
      }
      filterDescs.push({
        cohort: cht,
        filter,
      });
    }

    this.container.dispatchEvent(new FilterEvent(filterDescs));
  }


  // unused, because it does not make sense for more than 1 attribute
  /** Calls the recommendSplit webservice and sets the bins according to the returned results */
  async recommendSplit(useNumberOfClusters = false) {
    console.log("does not make sense for more than 1 attribute");
  //   console.log("recommendSplit scatterplot");
  //
  //   let numberOfClusters = 0;
  //   if (useNumberOfClusters) {
  //     // select the bins field
  //     // binsCount0 = (this.controls.querySelector(`#split input.bins[data-axis=x]`) as HTMLInputElement).valueAsNumber;
  //     // console.log("binsCountX", binsCount0);
  //     // binsCount1 = (this.controls.querySelector(`#split input.bins[data-axis=y]`) as HTMLInputElement).valueAsNumber;
  //     // console.log("binsCountY", binsCount1);
  //     numberOfClusters = (this.controls.querySelector(`#split #recommendSplitControls input.clusters`) as HTMLInputElement).valueAsNumber;
  //     console.log("useNumberOfClusters", useNumberOfClusters);
  //   }
  //
  //   const cohorts = this.cohorts;
  //
  //   let filterDesc: IFilterDesc[] = [];
  //   if (cohorts.length === 1) {
  //     // it does not make sense to do a recommendSplit on multiple cohorts at once
  //     // createAutomatically looks at the data of one cohort and creates new cohorts based on that
  //     // recommendSplit recommends splits that are used for ALL cohorts, so it would not make sense to use it on multiple cohorts
  //
  //     // 1 cohort, 1 category
  //     let filter: INumRange[] | IEqualsList = [];
  //
  //     filterDesc.push({
  //       cohort: cohorts[0],
  //       filter: [
  //         {
  //           attr: this.attributes[0],
  //           range: filter,
  //         },
  //       ],
  //     });
  //
  //     filterDesc.push({
  //       cohort: cohorts[0],
  //       filter: [
  //         {
  //           attr: this.attributes[1],
  //           range: filter,
  //         },
  //       ],
  //     });
  //
  //     const params: ICohortMultiAttrDBDataRecommendSplitParams = {
  //       cohortId: filterDesc[0].cohort.dbId,
  //       attribute0: this.attributes[0].dataKey,
  //       attribute1: this.attributes[1].dataKey,
  //       numberOfClusters: numberOfClusters,
  //     };
  //
  //     const data = await recommendSplitDB(params);
  //     console.log("recommendSplit", data);
  //
  //     // set the bins for x-axis
  //     let splitValues = [];
  //     for (let i = 0; i < data[this.attributes[0].dataKey].length; i++) {
  //       // get the int val of the data[i]
  //       const binBorder = Number(data[this.attributes[0].dataKey][i]);
  //       splitValues.push(binBorder);
  //     }
  //
  //     this.vegaView.data(`splitvalues_x`, splitValues.slice()); // set a defensive copy
  //     console.log("split values x", splitValues.slice());
  //     // this.vegaView.runAsync(); // update the view
  //     this.vegaView.runAsync().then(
  //       (
  //         vegaView, // defer adding signallistener until the new data is set internally
  //       ) => vegaView.addDataListener(`splitvalues_x`, this.vegaSplitListener), // add listener again
  //     );
  //
  //
  //     // set the bins for y-axis
  //     splitValues = [];
  //     for (let i = 0; i < data[this.attributes[1].dataKey].length; i++) {
  //       // get the int val of the data[i]
  //       const binBorder = Number(data[this.attributes[1].dataKey][i]);
  //       splitValues.push(binBorder);
  //     }
  //
  //     this.vegaView.data(`splitvalues_y`, splitValues.slice()); // set a defensive copy
  //     console.log("split values y", splitValues.slice());
  //     // this.vegaView.runAsync(); // update the view
  //     this.vegaView.runAsync().then(
  //       (
  //         vegaView, // defer adding signallistener until the new data is set internally
  //       ) => vegaView.addDataListener(`splitvalues_y`, this.vegaSplitListener), // add listener again
  //     );
  //   }
  }

  async createAutomatically(useNumberOfClusters = false) {
    console.log("createAutomatically scatterplot");

    let numberOfClusters = 0;
    if (useNumberOfClusters) {
      // select the bins field
      // binsCount = (this.controls.querySelector('#split input.bins') as HTMLInputElement).valueAsNumber;
      numberOfClusters = (this.controls.querySelector(`#split #recommendSplitControls input.clusters`) as HTMLInputElement).valueAsNumber;
      console.log("numberOfClusters", numberOfClusters);
    }

    let newCohortIds = [];
    let attributesMapped = this.attributes.map((attr) => {return {dataKey: attr.dataKey, type: attr.type}});
    // convert the attributesParam to a JSON object
    let attributesParam: string = JSON.stringify(attributesMapped);
    for (const cht of this.cohorts) {
      // const params: ICohortMultiAttrDBDataParams = {
      //   cohortId: cht.dbId,
      //   attribute0: this.attributes[0].dataKey,
      //   attribute0type: this.attributes[0].type,
      //   attribute1: this.attributes[1].dataKey,
      //   attribute1type: this.attributes[1].type,
      //   numberOfClusters: numberOfClusters,
      // };

      const params: ICohortMultiAttrDBDataParams = {
        cohortId: cht.dbId,
        attributes: attributesParam,
        numberOfClusters: numberOfClusters,
      };

      newCohortIds = await createDBCohortAutomatically(params)
      console.log("createAutomatically scatterplot data", newCohortIds);
    }

    let cohortDescs: INewCohortDesc[];
    cohortDescs = [];
    // for every selected cohort
    for (const cohort of this.cohorts) {
      // for every newCohort create a filter (for now... the filter is actually not needed, will be changed in the future)
      for (const newCohort of newCohortIds){
        cohortDescs.push({
          cohort: cohort,
          newCohortId: newCohort,
          attr:[this.attributes[0], this.attributes[1]]
        });
      }
    }

    this.container.dispatchEvent(new AutoSplitEvent(cohortDescs));
  }

  split() {
    const filterDescs: IFilterDesc[] = [];
    for (const cht of this.cohorts) {
      const filter = [];

      const [minX, maxX] = this.vegaView.scale('x').domain();
      const [minY, maxY] = this.vegaView.scale('y').domain();

      // one filterdesc per cohort and split bin
      // a bin consits of x and y range
      for (const [ix, splitX] of [...this.splitValuesX, maxX].entries()) {
        for (const [iy, splitY] of [...this.splitValuesY, maxY].entries()) {
          const desc = {
            cohort: cht,
            filter: [
              {
                // x
                attr: this.attributes[0],
                range: [
                  this.getGeneralNumericalFilter(
                    ix >= 1 ? this.splitValuesX[ix - 1] : minX,
                    splitX,
                    NumRangeOperators.gte,
                    splitX === maxX ? NumRangeOperators.lte : NumRangeOperators.lt,
                  ),
                ],
              },
              {
                // y
                attr: this.attributes[1],
                range: [
                  this.getGeneralNumericalFilter(
                    iy >= 1 ? this.splitValuesY[iy - 1] : minY,
                    splitY,
                    NumRangeOperators.gte,
                    splitY === maxY ? NumRangeOperators.lte : NumRangeOperators.lt,
                  ),
                ],
              },
            ],
          };

          filterDescs.push(desc);
        }
      }

      if (this.getNullCheckboxState(this.attributes[0])) {
        // x =  null
        for (const [iy, splitY] of [...this.splitValuesY, maxY].entries()) {
          filterDescs.push({
            cohort: cht,
            filter: [
              {
                // x
                attr: this.attributes[0],
                range: [
                  {
                    operatorOne: NumRangeOperators.gte,
                    valueOne: null,
                    operatorTwo: NumRangeOperators.lte,
                    valueTwo: null,
                  },
                ],
              },
              {
                // y
                attr: this.attributes[1],
                range: [
                  this.getGeneralNumericalFilter(
                    iy >= 1 ? this.splitValuesY[iy - 1] : minY,
                    splitY,
                    NumRangeOperators.gte,
                    splitY === maxY ? NumRangeOperators.lte : NumRangeOperators.lt,
                  ),
                ],
              },
            ],
          });
        }
      }
      if (this.getNullCheckboxState(this.attributes[1])) {
        // y= null
        for (const [ix, splitX] of [...this.splitValuesX, maxX].entries()) {
          filterDescs.push({
            cohort: cht,
            filter: [
              {
                // x
                attr: this.attributes[0],
                range: [
                  this.getGeneralNumericalFilter(
                    ix >= 1 ? this.splitValuesX[ix - 1] : minX,
                    splitX,
                    NumRangeOperators.gte,
                    splitX === maxX ? NumRangeOperators.lte : NumRangeOperators.lt,
                  ),
                ],
              },
              {
                // y
                attr: this.attributes[1],
                range: [
                  {
                    operatorOne: NumRangeOperators.gte,
                    valueOne: null,
                    operatorTwo: NumRangeOperators.lte,
                    valueTwo: null,
                  },
                ],
              },
            ],
          });
        }
      }
      if (this.getNullCheckboxState(this.attributes[0]) && this.getNullCheckboxState(this.attributes[1])) {
        filterDescs.push({
          cohort: cht,
          filter: [
            {
              // x
              attr: this.attributes[0],
              range: [
                {
                  operatorOne: NumRangeOperators.gte,
                  valueOne: null,
                  operatorTwo: NumRangeOperators.lte,
                  valueTwo: null,
                },
              ],
            },
            {
              // y
              attr: this.attributes[1],
              range: [
                {
                  operatorOne: NumRangeOperators.gte,
                  valueOne: null,
                  operatorTwo: NumRangeOperators.lte,
                  valueTwo: null,
                },
              ],
            },
          ],
        });
      }
    }
    this.container.dispatchEvent(new FilterEvent(filterDescs));
  }
}

export class TsneScatterplot extends Scatterplot {
  static readonly NAME = 't-SNE Scatterplot';

  public readonly ITERATIONS = 100;

  iteration = 0;

  progressBar: HTMLDivElement;

  running: boolean;

  playBtn: any;

  inputData: number[][];

  tsne: any;

  progressWrapper: any;

  tsneClass: any;

  projData: any[];

  originalAttributes: IAttribute[];

  constructor(vegaLiteOptions: object = {}) {
    super(vegaLiteOptions);
    this.checkAttributeType = false;
  }

  getSpec(data: IdValuePair[]): VegaLiteSpec {
    const xDataKey = 'x_embed';
    const yDataKey = 'y_embed';

    // scatterSpec.layer[0].encoding.tooltip = this.originalAttributes.map((attr) => ({
    //   field: attr.dataKey,
    //   type: attr.type === 'number' ? 'ordinal' : 'nominal',
    // }));

    if (this.checkAttributeType && this.attributes.some((attr) => attr.type !== `number`)) {
      throw new Error(`Scatterplot requires attributes of type number`);
    }

    const vegaSpec: VegaSpec = {
      $schema: `https://vega.github.io/schema/vega/v5.json`,
      autosize: { type: `fit`, contains: `padding` },
      background: `white`,
      padding: { left: 5, top: 5, right: 5, bottom: 5 }, // top and right padding are necessary for split rulers
      height: 300,
      style: `cell`,
      encode: { update: { cursor: { value: `crosshair` } } },
      data: [
        {
          name: `selected_store`,
          values: [
            {
              unit: `layer_0`,
              fields: [
                { field: `${xDataKey}`, channel: `x`, type: `R` },
                { field: `${yDataKey}`, channel: `y`, type: `R` },
              ],
              values: [[], []],
            },
          ],
        },
        {
          name: `source_0`,
          values: data,
        },
        {
          name: `splitvalues_x`,
          values: this.splitValuesX,
          on: [
            {
              trigger: `draggedMark_x`,
              modify: `draggedMark_x`,
              values: `dragTo_x`,
            },
            { trigger: `addMark_x`, insert: `addMark_x` },
            { trigger: `remMark_x`, remove: `remMark_x` },
          ],
        },
        {
          name: `splitvalues_y`,
          values: this.splitValuesY,
          on: [
            {
              trigger: `draggedMark_y`,
              modify: `draggedMark_y`,
              values: `dragTo_y`,
            },
            { trigger: `remMark_y`, remove: `remMark_y` },
          ],
        },
        {
          name: `data_0`,
          source: `source_0`,
          transform: [
            {
              type: `filter`,
              expr: `isValid(datum['${xDataKey}']) && isFinite(+datum['${xDataKey}']) && isValid(datum['${yDataKey}']) && isFinite(+datum['${yDataKey}'])`,
            },
          ],
        },
        {
          name: `data_1`,
          source: `splitvalues_x`,
          transform: [
            {
              type: `filter`,
              expr: `isValid(datum['data']) && isFinite(+datum['data'])`,
            },
          ],
        },
        {
          name: `data_2`,
          source: `splitvalues_y`,
          transform: [
            {
              type: `filter`,
              expr: `isValid(datum['data']) && isFinite(+datum['data'])`,
            },
          ],
        },
      ],
      signals: [
        {
          name: `width`,
          init: `isFinite(containerSize()[0]) ? containerSize()[0] : 200`,
          on: [
            {
              update: `isFinite(containerSize()[0]) ? containerSize()[0] : 200`,
              events: `window:resize`,
            },
          ],
        },
        {
          name: `dragTo_x`,
          on: [
            {
              events: `[@grabber_x:mousedown, window:mouseup] > window:mousemove`,
              update: `{data: invert('x',x())}`,
            },
          ],
        },
        {
          name: `draggedMark_x`,
          on: [
            {
              events: [
                {
                  markname: `grabber_x`,
                  type: `mousedown`,
                  filter: [`!event.ctrlKey`],
                },
              ],
              update: `group().datum`,
            },
          ],
        },
        {
          name: `addMark_x`,
          on: [
            {
              events: [
                {
                  source: `view`,
                  type: `click`,
                  filter: [`event.ctrlKey`, `item().mark.name === 'root'`],
                },
              ],
              update: `{data: invert('x',x())}`,
            },
          ],
        },
        {
          name: `remMark_x`,
          on: [
            {
              events: [
                {
                  markname: `grabber_x`,
                  type: `click`,
                  filter: `event.ctrlKey`,
                },
                {
                  markname: `splitrule_x`,
                  type: `click`,
                  filter: `event.ctrlKey`,
                },
              ],
              update: `group().datum`,
            },
          ],
        },
        {
          name: `dragTo_y`,
          on: [
            {
              events: `[@grabber_y:mousedown, window:mouseup] > window:mousemove`,
              update: `{data: invert('y',y())}`,
            },
          ],
        },
        {
          name: `draggedMark_y`,
          on: [
            {
              events: [
                {
                  markname: `grabber_y`,
                  type: `mousedown`,
                  filter: [`!event.ctrlKey`],
                },
              ],
              update: `group().datum`,
            },
          ],
        },
        {
          name: `remMark_y`,
          on: [
            {
              events: [
                {
                  markname: `grabber_y`,
                  type: `click`,
                  filter: `event.ctrlKey`,
                },
                {
                  markname: `splitrule_y`,
                  type: `click`,
                  filter: `event.ctrlKey`,
                },
              ],
              update: `group().datum`,
            },
          ],
        },
        {
          name: `unit`,
          value: {},
          on: [{ events: `mousemove`, update: `isTuple(group()) ? group() : unit` }],
        },
        {
          name: `selected`,
          update: `vlSelectionResolve('selected_store', 'union')`,
        },
        {
          name: `selected_x`,
          init: `[]`,
          on: [
            {
              events: {
                source: `scope`,
                type: `mousedown`,
                filter: [
                  `!event.item || event.item.mark.name !== 'selected_brush'`,
                  `event.item.mark.name !== 'grabber_x'`,
                  `event.item.mark.name !== 'grabber_y'`,
                ],
              },
              update: `[x(unit), x(unit)]`,
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
                      `event.item.mark.name !== 'grabber_x'`,
                      `event.item.mark.name !== 'grabber_y'`,
                    ],
                  },
                  { source: `window`, type: `mouseup` },
                ],
              },
              update: `[selected_x[0], clamp(x(unit), 0, width)]`,
            },
            {
              events: { signal: `selected_scale_trigger` },
              update: `[scale('x', selected_attr0[0]), scale('x', selected_attr0[1])]`,
            },
            {
              events: [{ source: `view`, type: `dblclick` }],
              update: `[0, 0]`,
            },
            {
              events: { signal: `selected_translate_delta` },
              update: `clampRange(panLinear(selected_translate_anchor.extent_x, selected_translate_delta.x / span(selected_translate_anchor.extent_x)), 0, width)`,
            },
            {
              events: { signal: `selected_zoom_delta` },
              update: `clampRange(zoomLinear(selected_x, selected_zoom_anchor.x, selected_zoom_delta), 0, width)`,
            },
          ],
        },
        {
          name: `selected_attr0`,
          init: `[]`,
          on: [
            {
              events: { signal: `selected_x` },
              update: `selected_x[0] === selected_x[1] ? null : invert('x', selected_x)`,
            },
          ],
        },
        {
          name: `selected_y`,
          init: `[]`,
          on: [
            {
              events: {
                source: `scope`,
                type: `mousedown`,
                filter: [`!event.item || event.item.mark.name !== 'selected_brush'`],
              },
              update: `[y(unit), y(unit)]`,
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
                    filter: [`!event.item || event.item.mark.name !== 'selected_brush'`],
                  },
                  { source: `window`, type: `mouseup` },
                ],
              },
              update: `[selected_y[0], clamp(y(unit), 0, height)]`,
            },
            {
              events: { signal: `selected_scale_trigger` },
              update: `[scale('y', selected_attr1[0]), scale('y', selected_attr1[1])]`,
            },
            {
              events: [{ source: `view`, type: `dblclick` }],
              update: `[0, 0]`,
            },
            {
              events: { signal: `selected_translate_delta` },
              update: `clampRange(panLinear(selected_translate_anchor.extent_y, selected_translate_delta.y / span(selected_translate_anchor.extent_y)), 0, height)`,
            },
            {
              events: { signal: `selected_zoom_delta` },
              update: `clampRange(zoomLinear(selected_y, selected_zoom_anchor.y, selected_zoom_delta), 0, height)`,
            },
          ],
        },
        {
          name: `selected_attr1`,
          init: `[]`,
          on: [
            {
              events: { signal: `selected_y` },
              update: `selected_y[0] === selected_y[1] ? null : invert('y', selected_y)`,
            },
          ],
        },
        {
          name: `selected_scale_trigger`,
          value: {},
          on: [
            {
              events: [{ scale: `x` }, { scale: `y` }],
              update: `(!isArray(selected_attr0) || (+invert('x', selected_x)[0] === +selected_attr0[0] && +invert('x', selected_x)[1] === +selected_attr0[1])) && (!isArray(selected_attr1) || (+invert('y', selected_y)[0] === +selected_attr1[0] && +invert('y', selected_y)[1] === +selected_attr1[1])) ? selected_scale_trigger : {}`,
            },
          ],
        },
        {
          name: `selected_tuple`,
          init: `{unit: 'layer_0', fields: selected_tuple_fields, values: [[], []]}`,
          on: [
            {
              events: [{ signal: `selected_attr0 || selected_attr1` }],
              update: `selected_attr0 && selected_attr1 ? {unit: 'layer_0', fields: selected_tuple_fields, values: [selected_attr0,selected_attr1]} : null`,
            },
          ],
        },
        {
          name: `selected_tuple_fields`,
          value: [
            { field: `${xDataKey}`, channel: `x`, type: `R` },
            { field: `${yDataKey}`, channel: `y`, type: `R` },
          ],
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
                  markname: `selected_brush`,
                },
              ],
              update: `{x: x(unit), y: y(unit), extent_x: slice(selected_x), extent_y: slice(selected_y)}`,
            },
          ],
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
                      markname: `selected_brush`,
                    },
                    { source: `window`, type: `mouseup` },
                  ],
                },
              ],
              update: `{x: selected_translate_anchor.x - x(unit), y: selected_translate_anchor.y - y(unit)}`,
            },
          ],
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
                  markname: `selected_brush`,
                },
              ],
              update: `{x: x(unit), y: y(unit)}`,
            },
          ],
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
                  markname: `selected_brush`,
                },
              ],
              force: true,
              update: `pow(1.001, event.deltaY * pow(16, event.deltaMode))`,
            },
          ],
        },
        {
          name: `selected_modify`,
          on: [
            {
              events: { signal: `selected_tuple` },
              update: `modify('selected_store', selected_tuple, true)`,
            },
          ],
        },
      ],
      marks: [
        {
          name: `selected_brush_bg`,
          type: `rect`,
          clip: true,
          encode: {
            enter: { fill: { value: `#333` }, fillOpacity: { value: 0.125 } },
            update: {
              x: [
                {
                  test: `data('selected_store').length && data('selected_store')[0].unit === 'layer_0'`,
                  signal: `selected_x[0]`,
                },
                { value: 0 },
              ],
              y: [
                {
                  test: `data('selected_store').length && data('selected_store')[0].unit === 'layer_0'`,
                  signal: `selected_y[0]`,
                },
                { value: 0 },
              ],
              x2: [
                {
                  test: `data('selected_store').length && data('selected_store')[0].unit === 'layer_0'`,
                  signal: `selected_x[1]`,
                },
                { value: 0 },
              ],
              y2: [
                {
                  test: `data('selected_store').length && data('selected_store')[0].unit === 'layer_0'`,
                  signal: `selected_y[1]`,
                },
                { value: 0 },
              ],
            },
          },
        },
        {
          name: `layer_0_marks`,
          type: `symbol`,
          style: [`circle`],
          interactive: true,
          from: { data: `data_0` },
          encode: {
            update: {
              opacity: { value: 0.9 },
              size: { value: 15 },
              cursor: { value: `crosshair` },
              tooltip: {
                signal: `{'${xDataKey}': format(datum['${xDataKey}'], ''), '${yDataKey}': format(datum['${yDataKey}'], ''), '${DATA_LABEL}': isValid(datum['${DATA_LABEL}']) ? datum['${DATA_LABEL}'] : ''+datum['${DATA_LABEL}']}`,
              },
              fill: { scale: `color`, field: `${DATA_LABEL}` },
              ariaRoleDescription: { value: `circle` },
              description: {
                signal: `'${xDataKey}: ' + (format(datum['${xDataKey}'], '')) + '; ${yDataKey}: ' + (format(datum['${yDataKey}'], '')) + '; ${DATA_LABEL}: ' + (isValid(datum['${DATA_LABEL}']) ? datum['${DATA_LABEL}'] : ''+datum['${DATA_LABEL}'])`,
              },
              x: [
                {
                  test: `!isValid(datum['${xDataKey}']) || !isFinite(+datum['${xDataKey}'])`,
                  value: 0,
                },
                { scale: `x`, field: `${xDataKey}` },
              ],
              y: [
                {
                  test: `!isValid(datum['${yDataKey}']) || !isFinite(+datum['${yDataKey}'])`,
                  field: { group: `height` },
                },
                { scale: `y`, field: `${yDataKey}` },
              ],
              shape: { value: `circle` },
            },
          },
        },
        {
          name: `splitmarks_x`,
          type: `group`,
          from: { data: `data_1` },
          encode: {
            enter: { height: { field: { group: `height` } } },
            update: {
              x: [
                {
                  test: `!isValid(datum['data']) || !isFinite(+datum['data'])`,
                  value: 0,
                },
                { scale: `x`, field: `data` },
              ],
            },
          },
          marks: [
            {
              name: `splitrule_x`,
              type: `rule`,
              style: [`rule`],
              encode: {
                update: {
                  strokeDash: { value: [4, 6] },
                  stroke: { value: `black` },
                  y: { value: 0 },
                  y2: { field: { group: `height` } },
                },
              },
            },
            {
              type: `path`,
              name: `grabber_x`,
              encode: {
                enter: {
                  y: { field: { group: `height` }, mult: 0.5, offset: -80 },
                  fill: { value: `#fff` },
                  stroke: { value: `#666` },
                  cursor: { value: `ew-resize` },
                },
                update: {
                  path: {
                    signal: `'M0.5,33.333A6,6 0 0 1 6.5,39.333V60.666A6,6 0 0 1 0.5,66.666ZM2.5,41.333V58.666M4.5,41.333V58.666'`,
                  },
                },
              },
            },
          ],
        },
        {
          name: `splitmarks_y`,
          type: `group`,
          from: { data: `data_2` },
          encode: {
            update: {
              x: { field: { group: `width` } },
              x2: { value: 0 },
              y: [
                {
                  test: `!isValid(datum['data']) || !isFinite(+datum['data'])`,
                  value: 0,
                },
                { scale: `y`, field: `data` },
              ],
            },
          },
          marks: [
            {
              name: `splitrule_y`,
              type: `rule`,
              style: [`rule`],
              encode: {
                update: {
                  strokeDash: { value: [4, 6] },
                  stroke: { value: `black` },
                  description: {
                    signal: `'data: ' + (format(datum['data'], ''))`,
                  },
                  x: { field: { group: `width` } },
                  x2: { value: 0 },
                  y: [
                    {
                      test: `!isValid(datum['data']) || !isFinite(+datum['data'])`,
                      field: { group: `height` },
                    },
                    { scale: `y`, field: `data` },
                  ],
                },
              },
            },
            {
              type: `path`,
              name: `grabber_y`,
              encode: {
                enter: {
                  x: { field: { group: `width` }, mult: 0.5, offset: 15 },
                  y: [
                    {
                      test: `!isValid(datum['data']) || !isFinite(+datum['data'])`,
                      field: { group: `height` },
                    },
                    { scale: `y`, field: `data` },
                  ],
                  fill: { value: `#fff` },
                  stroke: { value: `#666` },
                  cursor: { value: `ns-resize` },
                },
                update: {
                  path: {
                    signal: `'M33.333,0a6,6 0 0 0 -6,-6H6A6,6 0 0 0 0,0Zm-8,-2 H8M25.333,-4H8'`,
                  },
                },
              },
            },
          ],
        },
        {
          name: `selected_brush`,
          type: `rect`,
          clip: true,
          encode: {
            enter: {
              cursor: { value: `pointer` },
              fill: { value: `transparent` },
            },
            update: {
              x: [
                {
                  test: `data('selected_store').length && data('selected_store')[0].unit === 'layer_0'`,
                  signal: `selected_x[0]`,
                },
                { value: 0 },
              ],
              y: [
                {
                  test: `data('selected_store').length && data('selected_store')[0].unit === 'layer_0'`,
                  signal: `selected_y[0]`,
                },
                { value: 0 },
              ],
              x2: [
                {
                  test: `data('selected_store').length && data('selected_store')[0].unit === 'layer_0'`,
                  signal: `selected_x[1]`,
                },
                { value: 0 },
              ],
              y2: [
                {
                  test: `data('selected_store').length && data('selected_store')[0].unit === 'layer_0'`,
                  signal: `selected_y[1]`,
                },
                { value: 0 },
              ],
              stroke: [
                {
                  test: `selected_x[0] !== selected_x[1] && selected_y[0] !== selected_y[1]`,
                  value: `white`,
                },
                { value: null },
              ],
            },
          },
        },
      ],
      scales: [
        {
          name: `x`,
          type: 'linear',
          zero: false,
          domain: {
            fields: [
              { data: `data_0`, field: `${xDataKey}` },
              { data: `data_1`, field: `data` },
            ],
          },
          range: [0, { signal: `width` }],
          clamp: true,
          nice: false,
        },
        {
          name: `y`,
          type: 'linear',
          zero: false,
          domain: {
            fields: [
              { data: `data_0`, field: `${yDataKey}` },
              { data: `data_2`, field: `data` },
            ],
          },
          range: [{ signal: `height` }, 0],
          clamp: true,
          nice: false,
        },
        {
          name: `color`,
          type: `ordinal`,
          domain: { data: 'data_0', field: DATA_LABEL, sort: true },
          range: `category`,
        },
      ],
      axes: [
        {
          scale: `x`,
          orient: `bottom`,
          gridScale: `y`,
          grid: false,
          tickCount: { signal: `ceil(width/40)` },
          domain: false,
          labels: false,
          aria: false,
          maxExtent: 0,
          minExtent: 0,
          ticks: false,
          zindex: 0,
        },
        {
          scale: `y`,
          orient: `left`,
          gridScale: `x`,
          grid: false,
          tickCount: { signal: `ceil(height/40)` },
          domain: false,
          labels: false,
          aria: false,
          maxExtent: 0,
          minExtent: 0,
          ticks: false,
          zindex: 0,
        },
        {
          scale: `x`,
          orient: `bottom`,
          grid: false,
          title: `${xDataKey}`,
          labelFlush: true,
          tickCount: { signal: `ceil(width/40)` },
          zindex: 0,
        },
        {
          scale: `y`,
          orient: `left`,
          grid: false,
          title: `${yDataKey}`,
          tickCount: { signal: `ceil(height/40)` },
          zindex: 0,
        },
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
          labelBound: true,
        },
        legend: {
          titleFontSize: 16,
          titleFontWeight: 500,
          titleFont: `Roboto`,
          labelFontSize: 12,
          labelLimit: 150,
          labelFont: `Roboto`,
          labelOverlap: `parity`,
        },
      },
    };

    return vegaSpec as unknown as VegaLiteSpec;
  }

  async show(container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]) {
    super.show(container, attributes, cohorts);
  }

  async showImpl(chart: HTMLDivElement, data: Array<IdValuePair>) {
    this.addProgressBar();

    const oneHotWorker = new (<any>require('worker-loader?name=OneHotEncoder.js!./dimreduce/OneHotEncoder.worker'))();
    const OneHotClass = Comlink.wrap(oneHotWorker) as any;
    const oneHot = await new OneHotClass();
    // Note: numerical attributes will be normalized
    const oneHotData = await oneHot.encode(data, this.attributes);
    oneHot[Comlink.releaseProxy]();

    const opt = {
      epsilon: 10, // epsilon is learning rate (10 = default)
      perplexity: data.length ** 0.5, // roughly how many neighbors each point influences (30 = default)
      dim: 2, // dimensionality of the embedding (2 = default)
    };

    const tsneWorker = new (<any>require('worker-loader?name=tsne.worker.js!./dimreduce/tsne.worker'))();
    this.tsneClass = Comlink.wrap(tsneWorker) as any;
    // eslint-disable-next-line new-cap
    this.tsne = await new this.tsneClass(opt);
    this.tsne.initDataRaw(oneHotData);

    this.originalAttributes = this.attributes; // backup for tooltip
    this.attributes = ['x', 'y'].map(
      (axis) =>
        ({
          id: `${axis}_embed`,
          label: axis,
          type: 'number' as AttributeType,
        } as unknown as IAttribute),
    ); // workaround to glory

    this.run(true);
  }

  async embeddStep() {
    this.progressBar.classList.toggle('active', true);
    this.progressBar.classList.toggle('progress-bar-striped', true);
    this.playBtn.select('i').classed('fa-circle-notch fa-spin', false).classed('fa-play-circle', false).classed('fa-pause-circle', true);

    await this.tsne.step(); // every time you call this, solution gets better
    this.iteration++;
    this.setProgress(this.iteration);

    if (this.iteration % 10 === 0 || this.iteration === this.ITERATIONS || !this.running) {
      const projCoords = (await this.tsne.getSolution()) as Array<Array<number>>;
      super.showImpl(this.chart, this.embeddArrToJson(projCoords)).then(() => {
        if (this.iteration === this.ITERATIONS) {
          super.addControls();
        }
      });
    }
    if (this.iteration === this.ITERATIONS) {
      this.run(false);
      this.progressWrapper.remove();
      this.tsneClass[Comlink.releaseProxy]();
    }

    if (this.running) {
      this.embeddStep(); // call self
    } else {
      this.progressBar.classList.toggle('active', false);
      this.progressBar.classList.toggle('progress-bar-striped', false);
      this.playBtn.select('i').classed('fa-circle-notch fa-spin', false).classed('fa-play-circle', true).classed('fa-pause-circle', false);
    }
  }

  embeddArrToJson(projCoords: Array<Array<number>>): IdValuePair[] {
    const projCoordsObjArr = projCoords.map((item, index) => ({
      x_embed: item[0] * 1000,
      y_embed: item[1] * 1000,
      ...this.data[index],
    }));
    this.projData = projCoordsObjArr;
    return projCoordsObjArr;
  }

  addProgressBar() {
    this.container.insertAdjacentHTML(
      'beforeend',
      `
    <div class="progress-wrapper"">
      <div class="progress-ctrl">
        <a class="run" role="button"><i class="fas fa-fw fa-circle-notch"></i></a>
      </div>
      <div  class="progress">
        <div class="progress-bar" role="progressbar">
          0/${this.ITERATIONS}
        </div>
      </div>
    </div>
    `,
    );
    this.progressWrapper = select(this.container).select('.progress-wrapper');
    this.progressBar = select(this.container).select('.progress .progress-bar').node() as HTMLDivElement;
    this.playBtn = select(this.container).select('a.run');
    this.playBtn.on('click', () => this.run(!this.running));
  }

  setProgress(iteration: number) {
    this.progressBar.textContent = `${iteration}/${this.ITERATIONS}`;
    this.progressBar.style.width = `${(100 * iteration) / this.ITERATIONS}%`;
  }

  run(run: boolean) {
    this.running = run;
    this.playBtn.select('i').classed('fa-circle-notch fa-spin', true).classed('fa-play-circle', false).classed('fa-pause-circle', false);

    if (run) {
      this.embeddStep();
    }
  }

  protected addControls() {
    // noop
  }

  addIntervalControls(attribute: string, axis: AxisType) {
    super.addIntervalControls(axis, axis);
  }

  addNullCheckbox(attribute: string) {
    /** noop */
  }

  filter() {
    const intervals = {
      x: this.getInterval('x'),
      y: this.getInterval('y'),
    };

    const selectedItems = this.projData.filter((item) => {
      let selected = true;
      for (const axis of ['x', 'y']) {
        selected = selected && inRange(item[`${axis}_embed`], intervals[axis]);
      }
      return selected;
    });

    const filterDescs: IFilterDesc[] = [];
    for (const cohort of this.cohorts) {
      filterDescs.push({
        cohort,
        filter: [
          {
            attr: new ServerColumnAttribute(cohort.idColumn.column, cohort.view, cohort.database, cohort.idColumn),
            range: { values: selectedItems.filter((item) => item.Cohort.indexOf(cohort.label) >= 0).map((item) => item[cohort.idColumn.column]) },
          },
        ],
      });
    }
    this.container.dispatchEvent(new FilterEvent(filterDescs));
  }

  async recommendSplit(useNumberOfClusters = false) {
    console.log("does not make sense for more than 1 attribute");
  }

  split() {
    const filterDescs: IFilterDesc[] = [];
    for (const cohort of this.cohorts) {
      const chtItems = this.projData.filter((item) => item.Cohort.indexOf(cohort.label) >= 0);

      const [minX, maxX] = this.vegaView.scale('x').domain();
      const [minY, maxY] = this.vegaView.scale('y').domain();

      for (const [ix, splitX] of [...this.splitValuesX, maxX].entries()) {
        for (const [iy, splitY] of [...this.splitValuesY, maxY].entries()) {
          const chtSplitItems = chtItems.filter((item) => {
            const x = item.x_embed;
            const selectedX =
              splitX === maxX
                ? x >= (ix >= 1 ? this.splitValuesX[ix - 1] : minX) && x <= splitX // splitX is maxX -> include max
                : x >= (ix >= 1 ? this.splitValuesX[ix - 1] : minX) && x < splitX; // splitX is something else

            const y = item.y_embed;
            const selectedY =
              splitY === maxY
                ? y >= (iy >= 1 ? this.splitValuesY[iy - 1] : minY) && y <= splitY
                : y >= (iy >= 1 ? this.splitValuesY[iy - 1] : minY) && y < splitY;

            return selectedX && selectedY;
          });

          filterDescs.push({
            cohort,
            filter: [
              {
                range: { values: chtSplitItems.map((item) => item[cohort.idColumn.column]) },
                attr: new ServerColumnAttribute(cohort.idColumn.column, cohort.view, cohort.database, cohort.idColumn),
              },
            ],
          });
        }
      }
    }
    this.container.dispatchEvent(new FilterEvent(filterDescs));
  }
}


