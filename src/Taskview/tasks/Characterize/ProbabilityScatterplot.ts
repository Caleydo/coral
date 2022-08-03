import {Spec as VegaSpec} from 'vega';

export class ProbabilityScatterplot{
  constructor(private data, private cohorts) {
    
  }

  public getSpec(): VegaSpec {
    return {
      "$schema": "https://vega.github.io/schema/vega/v5.json",
      "scales": [
        {
          "name": "x",
          "type": "linear",
          "round": true,
          "nice": true,
          "zero": true,
            "domain": {
            "fields": [
              {
                "signal": "[bin_x_bins.start, bin_x_bins.stop]"
              },
              {"data": "source", "field": "x"}
            ]
          },
          "domainRaw": {"signal": "zoom[\"x\"]"},
          "range": "width"
        },
        {
          "name": "y",
          "type": "linear",
          "round": true,
          "nice": true,
          "zero": true,
          "domain": {
            "fields": [
              {
                "signal": "[bin_y_bins.start, bin_y_bins.stop]"
              },
              {"data": "source", "field": "y"}
            ]
          },
          "domainRaw": {"signal": "zoom[\"y\"]"},
          "range": "height"
        },
        {
          "name": "color",
          "type": "ordinal",
          "domain": {
            "data": "source",
            "field": "cht"
          },
          "range": this.cohorts.map(c => c.colorTaskView)
        },
        {
          "name": "prob",
          "type": "linear",
          "round": false,
          "nice": false,
          "zero": true,
          "domain": {"data": "sampled_prob", "field": "max_max_prob"},
          "range": [0, 1],
          "reverse": false
        },
        {
          "name": "density",
          "type": "linear",
          "zero": true,
          "domain": [0, 1],
          "range": ["#fff", "#666"],
          "reverse": false
        }
      ],
      "marks": [
        {
          "type": "image", //density plot, first entry as it serves as background
          "from": {"data": "sampled_density"},
          "encode": {
            "update": {
              "x": {"value": 0},
              "y": {"value": 0},
              "width": {"signal": "width"},
              "height": {"signal": "height"},
              "aspect": {"value": false},
              "smooth": {"value": true}
            }
          },
          "transform": [
            {
              "type": "heatmap",
              "field": "datum.grid",
              "resolve": "shared",
              "color": {"expr": "scale('color', warn(datum.datum.max_cht))"}
            }
          ]
        },
        {
          "name": "marks", // scatterplot points on top of density plot
          "type": "symbol",
          "from": {"data": "source"},
          "encode": {
            "update": {
              "x": {"scale": "x", "field": "x"},
              "y": {"scale": "y", "field": "y"},
              "fill": {"scale": "color", "field": "cht"},
              "opacity": {"value": 0.7},
              "size": {"value": 15}
            }
          }
        },
        {
          // invisible heatmap over everything else for regional tooltips
          "type": "rect",
          "style": ["rect"],
          "from": {"data": "sampled_prob"},
          "encode": {
            "update": {
              "x": {"scale": "x", "field": "bin_x", "offset": 0.5},
              "x2": {"scale": "x", "field": "bin_x_end", "offset": 0.5},
              "y": {"scale": "y", "field": "bin_y", "offset": 0.5},
              "y2": {"scale": "y", "field": "bin_y_end", "offset": 0.5},
              "tooltip": {
                "signal": "{\"cht\": datum[\"max_cht\"], \"prob\": format(datum[\"max_max_prob\"], \".0%\")}"
              },
              "opacity": {"value": 0}
            }
          }
        }
      ],
      "data": [
        {
          "name": "source", // used by the scatterplot points
          "values": this.data
        },
        {
          "name": "sampled_prob", // bin the data and aggregate by max so that the "density" will be computed on uniformly distributed data
          "source": "source",
          "transform": [
            {"type": "extent", "field": "x", "signal": "bin_x_extent"},
            {
              "type": "bin",
              "field": "x",
              "as": ["bin_x", "bin_x_end"],
              "signal": "bin_x_bins",
              "extent": {"signal": "bin_x_extent"},
              "maxbins": 60,
              "nice": false
            },
            {"type": "extent", "field": "y", "signal": "bin_y_extent"},
            {
              "type": "bin",
              "field": "y",
              "as": ["bin_y", "bin_y_end"],
              "signal": "bin_y_bins",
              "extent": {"signal": "bin_y_extent"},
              "maxbins": 60,
              "nice": false
            },
            {
              "type": "aggregate",
              "groupby": ["bin_x", "bin_x_end", "bin_y", "bin_y_end"],
              "ops": ["argmax"],
              "fields": ["max_prob"],
              "as": ["max"],
              "drop": false
            },
            {
              "type": "formula",
              "expr": "datum.max.cht",
              "as": "max_cht"
            },
            {
              "type": "formula",
              "expr": "datum.max.max_prob",
              "as": "max_max_prob"
            },
            {
              "type": "formula",
              "expr": "(datum.bin_x + datum.bin_x_end)/2",
              "as": "x_sampled"
            },
            {
              "type": "formula",
              "expr": "(datum.bin_y + datum.bin_y_end)/2",
              "as": "y_sampled"
            }
          ]
        },
        {
          "name": "sampled_density", // calc density on binned data
          "source": "sampled_prob",
          "transform": [
            {
              "type": "kde2d",
              "groupby": ["max_cht"],
              "size": [{"signal": "width"}, {"signal": "height"}],
              "x": {"expr": "scale('x', datum.x_sampled)"},
              "y": {"expr": "scale('y', datum.y_sampled)"},
              "weight": {"expr": "scale('prob', datum.max_max_prob)"},
              "bandwidth": [10,10],
              "cellSize": 4
            },
            {
              "type": "heatmap",
              "field": "grid",
              "color": {"expr": "scale('density', datum.$value / datum.$max)"},
              "opacity": 0.9
            }
          ]
        },
        {"name": "zoom_store"}
      ],"signals": [
        {
          "name": "width",
          "init": "isFinite(containerSize()[0]) ? containerSize()[0] : 200",
          "on": [
            {
              "update": "isFinite(containerSize()[0]) ? containerSize()[0] : 200",
              "events": "window:resize"
            }
          ]
        },
        {
          "name": "height",
          "init": "isFinite(containerSize()[1]) ? containerSize()[1] : 200",
          "on": [
            {
              "update": "isFinite(containerSize()[1]) ? containerSize()[1] : 200",
              "events": "window:resize"
            }
          ]
        },
        {
          "name": "unit",
          "value": {},
          "on": [
            {"events": "mousemove", "update": "isTuple(group()) ? group() : unit"}
          ]
        },
        {"name": "zoom", "update": "vlSelectionResolve(\"zoom_store\", \"union\")"},
        {
          "name": "zoom_x",
          "on": [
            {"events": [{"source": "view", "type": "dblclick"}], "update": "null"},
            {
              "events": {"signal": "zoom_translate_delta"},
              "update": "panLinear(zoom_translate_anchor.extent_x, -zoom_translate_delta.x / width)"
            },
            {
              "events": {"signal": "zoom_zoom_delta"},
              "update": "zoomLinear(domain(\"x\"), zoom_zoom_anchor.x, zoom_zoom_delta)"
            }
          ]
        },
        {
          "name": "zoom_y",
          "on": [
            {"events": [{"source": "view", "type": "dblclick"}], "update": "null"},
            {
              "events": {"signal": "zoom_translate_delta"},
              "update": "panLinear(zoom_translate_anchor.extent_y, zoom_translate_delta.y / height)"
            },
            {
              "events": {"signal": "zoom_zoom_delta"},
              "update": "zoomLinear(domain(\"y\"), zoom_zoom_anchor.y, zoom_zoom_delta)"
            }
          ]
        },
        {
          "name": "zoom_tuple",
          "on": [
            {
              "events": [{"signal": "zoom_x || zoom_y"}],
              "update": "zoom_x && zoom_y ? {unit: \"layer_1\", fields: zoom_tuple_fields, values: [zoom_x,zoom_y]} : null"
            }
          ]
        },
        {
          "name": "zoom_tuple_fields",
          "value": [
            {"field": "x", "channel": "x", "type": "R"},
            {"field": "y", "channel": "y", "type": "R"}
          ]
        },
        {
          "name": "zoom_translate_anchor",
          "value": {},
          "on": [
            {
              "events": [{"source": "scope", "type": "mousedown"}],
              "update": "{x: x(unit), y: y(unit), extent_x: domain(\"x\"), extent_y: domain(\"y\")}"
            }
          ]
        },
        {
          "name": "zoom_translate_delta",
          "value": {},
          "on": [
            {
              "events": [
                {
                  "source": "window",
                  "type": "mousemove",
                  "consume": true,
                  "between": [
                    {"source": "scope", "type": "mousedown"},
                    {"source": "window", "type": "mouseup"}
                  ]
                }
              ],
              "update": "{x: zoom_translate_anchor.x - x(unit), y: zoom_translate_anchor.y - y(unit)}"
            }
          ]
        },
        {
          "name": "zoom_zoom_anchor",
          "on": [
            {
              "events": [{"source": "scope", "type": "wheel", "consume": true}],
              "update": "{x: invert(\"x\", x(unit)), y: invert(\"y\", y(unit))}"
            }
          ]
        },
        {
          "name": "zoom_zoom_delta",
          "on": [
            {
              "events": [{"source": "scope", "type": "wheel", "consume": true}],
              "force": true,
              "update": "pow(1.001, event.deltaY * pow(16, event.deltaMode))"
            }
          ]
        },
        {
          "name": "zoom_modify",
          "on": [
            {
              "events": {"signal": "zoom_tuple"},
              "update": "modify(\"zoom_store\", zoom_tuple, true)"
            }
          ]
        }
      ],
    }
  }
}