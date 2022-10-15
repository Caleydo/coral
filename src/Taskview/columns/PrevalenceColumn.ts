import vegaEmbed from 'vega-embed';
import { TopLevelSpec as VegaLiteSpec } from 'vega-lite';
import { ICohort } from '../../app/interfaces';
import { colors } from '../../config/colors';
import { getAnimatedLoadingBars } from '../../util';
import { ADataColumn } from './AColumn';

export default class PrevalenceColumn extends ADataColumn {
  constructor(private reference: ICohort, $container: HTMLDivElement) {
    super(`% [${reference.label}]`, $container);
    this.$column.classList.add('prevalence');
  }

  async setCellContent(cell: HTMLDivElement, cht: ICohort): Promise<void> {
    cell.appendChild(new PrevalenceBar(cht, this.reference).getNode());
  }
}

class PrevalenceBar {
  readonly $node: HTMLDivElement;

  readonly $loader: HTMLDivElement;

  readonly $hist: HTMLDivElement;

  constructor(private cht: ICohort, private reference: ICohort) {
    this.$node = document.createElement('div');
    this.$node.classList.add('hist');

    this.$loader = document.createElement('div');
    this.$loader.classList.add('loader'); // center content with flexbox
    this.$loader.appendChild(getAnimatedLoadingBars());

    this.$hist = document.createElement('div');

    this.$node.appendChild(this.$hist);

    const that = this;
    setTimeout(() => that.updateNode.bind(that)(), 0); // run async
  }

  public async updateNode() {
    this.$node.removeChild(this.$hist);
    this.$node.appendChild(this.$loader);

    const [size, refSize] = await Promise.all([this.cht.size, this.reference.size]);

    this.$node.removeChild(this.$loader);
    this.$node.appendChild(this.$hist);
    const spec = this.getMinimalVegaSpec(size, refSize);

    vegaEmbed(this.$hist, this.getMinimalVegaSpec(size, refSize), { actions: false });
  }

  public getNode() {
    return this.$node;
  }

  /**
   *  https://vega.github.io/editor/#/url/vega-lite/N4KABGBEAkDODGALApgWwIaQFxUQFzwAdYsB6UgN2QHN0A6agSz0QFcAjOxge1IRQyUa6ALQAbZskoAWOgCtY3AHaQANOCgATdHkw5gUCujGtksbGADakAKyQAugF91ESBgBOAawuR26d2oakMhK8NyajErUFqAQrgAeMRpxUABmjMhimj7auoEprngAnoTIPgCOrOhKeMw6jFT5BZAIxmX6kJrcGJEWlgAMqgCM-f1OLs3o8Yzm+snNtXhi7WBKrGJi8xCO8zvbII5AA
   * https://vega.github.io/editor/#/url/vega-lite/N4KABGBEAkDODGALApgWwIaQFxUQFzwAdYsB6UgN2QHN0A6agSz0QFcAjOxge1IRQyUa6ALQAbZskoAWOgCtY3AHaQANOCgATdHkw5gUCujGtksbGADakAKyQAugF91ESBgBOAawuR26d2oakMhK8NyajErUFqAQrgAeMRpxUABmjMhimj7auoEprngAnoTIPgCOrOhKeMw6jFT5BZAIxmX6kJrcGJEWlgAMqgCM-f1OLs3o8Yzm+snNtfCeAMLcrDUWQxMFUIueAKLxeO56YMem281i6OyZs2CpxrDIlymQtXhi7WBKrGJirzikGo7kY2RwjzEz3mEEc82c80gRSSO0gRhM3xGgMgUxmKJ2Wm66EiAHUwSwLDYYWA4SlaTSJpAwkp0tE5m8KBkAO74t6wY7cTzfd4nJSwQj+EJ4SDwjRwxxAA
   */
  public getMinimalVegaSpec(length: number, maxLength: number): VegaLiteSpec {
    return {
      $schema: 'https://vega.github.io/schema/vega-lite/v5.json',
      width: 'container', // responsive width
      height: 50,
      autosize: { type: 'fit', contains: 'padding' }, // plots fit a bit better, if though they are specified as responsive
      data: { values: [length / maxLength] },
      mark: 'bar',
      encoding: {
        x: {
          field: 'data',
          type: 'quantitative',
          scale: { domain: [0, 1] },
          axis: {
            labels: false, // no space for labels
            title: null, // we will have the title in the column header
            tickCount: 1, // only one tick, i.e. the last one
            tickExtra: true, // include an extra tick for beginning
            domain: false,
            ticks: false,
          },
        },
        color: {
          value: colors.barColor,
          condition: [
            {
              param: 'highlight',
              value: colors.hoverColor,
            },
          ],
        },
        tooltip: {
          field: 'data',
          type: 'quantitative',
          format: '.1%',
        },
      },
      config: {
        view: {
          stroke: 'transparent', // https://vega.github.io/vega-lite/docs/spec.html#view-background
        },
      },
      params: [
        {
          name: 'highlight',
          select: {
            type: 'point',
            on: 'mouseover',
            clear: 'mouseout',
          },
        },
      ],
    };
  }
}
