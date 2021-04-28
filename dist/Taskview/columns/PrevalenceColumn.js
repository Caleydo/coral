import vegaEmbed from 'vega-embed';
import { colors } from '../../colors';
import { getAnimatedLoadingText } from '../../util';
import { ADataColumn } from './AColumn';
export default class PrevalenceColumn extends ADataColumn {
    constructor(reference, $container) {
        super(`% [${reference.label}]`, $container);
        this.reference = reference;
        this.$column.classList.add('prevalence');
    }
    async setCellContent(cell, cht) {
        cell.appendChild(new PrevalenceBar(cht, this.reference).getNode());
    }
}
class PrevalenceBar {
    constructor(cht, reference) {
        this.cht = cht;
        this.reference = reference;
        this.$node = document.createElement('div');
        this.$node.classList.add('hist');
        this.$loader = document.createElement('div');
        this.$loader.classList.add('loader'); // center content with flexbox
        this.$loader.appendChild(getAnimatedLoadingText());
        this.$hist = document.createElement('div');
        this.$node.appendChild(this.$hist);
        const that = this;
        setTimeout(() => that.updateNode.bind(that)(), 0); // run async
    }
    async updateNode() {
        this.$node.removeChild(this.$hist);
        this.$node.appendChild(this.$loader);
        const [size, refSize] = await Promise.all([this.cht.size, this.reference.size]);
        this.$node.removeChild(this.$loader);
        this.$node.appendChild(this.$hist);
        const spec = this.getMinimalVegaSpec(size, refSize);
        vegaEmbed(this.$hist, this.getMinimalVegaSpec(size, refSize), { actions: false });
    }
    getNode() {
        return this.$node;
    }
    /**
     *  https://vega.github.io/editor/#/url/vega-lite/N4KABGBEAkDODGALApgWwIaQFxUQFzwAdYsB6UgN2QHN0A6agSz0QFcAjOxge1IRQyUa6ALQAbZskoAWOgCtY3AHaQANOCgATdHkw5gUCujGtksbGADakAKyQAugF91ESBgBOAawuR26d2oakMhK8NyajErUFqAQrgAeMRpxUABmjMhimj7auoEprngAnoTIPgCOrOhKeMw6jFT5BZAIxmX6kJrcGJEWlgAMqgCM-f1OLs3o8Yzm+snNtXhi7WBKrGJi8xCO8zvbII5AA
     * https://vega.github.io/editor/#/url/vega-lite/N4KABGBEAkDODGALApgWwIaQFxUQFzwAdYsB6UgN2QHN0A6agSz0QFcAjOxge1IRQyUa6ALQAbZskoAWOgCtY3AHaQANOCgATdHkw5gUCujGtksbGADakAKyQAugF91ESBgBOAawuR26d2oakMhK8NyajErUFqAQrgAeMRpxUABmjMhimj7auoEprngAnoTIPgCOrOhKeMw6jFT5BZAIxmX6kJrcGJEWlgAMqgCM-f1OLs3o8Yzm+snNtfCeAMLcrDUWQxMFUIueAKLxeO56YMem281i6OyZs2CpxrDIlymQtXhi7WBKrGJirzikGo7kY2RwjzEz3mEEc82c80gRSSO0gRhM3xGgMgUxmKJ2Wm66EiAHUwSwLDYYWA4SlaTSJpAwkp0tE5m8KBkAO74t6wY7cTzfd4nJSwQj+EJ4SDwjRwxxAA
     */
    getMinimalVegaSpec(length, maxLength) {
        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            width: 'container',
            height: 50,
            autosize: { type: 'fit', contains: 'padding' },
            data: { values: [length / maxLength] },
            mark: 'bar',
            encoding: {
                x: {
                    field: 'data',
                    type: 'quantitative',
                    scale: { domain: [0, 1] },
                    axis: {
                        labels: false,
                        title: null,
                        tickCount: 1,
                        tickExtra: true,
                        domain: false,
                        ticks: false,
                    }
                },
                color: {
                    value: colors.barColor,
                    condition: [
                        {
                            selection: 'highlight',
                            value: colors.hoverColor
                        }
                    ]
                },
                tooltip: {
                    field: 'data',
                    type: 'quantitative',
                    format: '.1%'
                }
            },
            config: {
                view: {
                    stroke: 'transparent' // https://vega.github.io/vega-lite/docs/spec.html#view-background
                }
            },
            selection: {
                'highlight': {
                    type: 'single',
                    empty: 'none',
                    on: 'mouseover',
                    clear: 'mouseout',
                }
            }
        };
    }
}
//# sourceMappingURL=PrevalenceColumn.js.map