import { select } from 'd3-selection';
import vegaEmbed from 'vega-embed';
import { colors } from '../../colors';
import { NumRangeOperators } from '../../rest';
import { getAnimatedLoadingText, log } from '../../util';
import { easyLabelFromFilter, niceName } from '../../utilLabels';
import { ADataColumn } from './AColumn';
export default class AttributeColumn extends ADataColumn {
    constructor(attribute, $container, onInputCohortSide = true, color = false) {
        super(niceName(attribute.label), $container);
        this.attribute = attribute;
        this.onInputCohortSide = onInputCohortSide;
        this.color = color;
        this.hists = new WeakMap();
        this.showOutputChtHistRef = false;
        this.$column.dataset.attribute = this.attribute.label;
        this.$header.addEventListener('mouseover', (event) => {
            event.stopPropagation();
            if (event.target === this.$header) {
                // add highlight
                this.addHighlightForColumn();
            }
            else if (event.target === this.$headerOptions) {
                // add highlight
                this.addHighlightForColumn();
            }
            else if (event.target === this.$headerTitle) {
                // add highlight
                this.addHighlightForColumn();
            }
            else {
                // remove highlight
                this.removeHighlightForColumn();
            }
        }, false);
        this.$header.addEventListener('mouseout', (event) => {
            event.stopPropagation();
            // remove highlight
            this.removeHighlightForColumn();
        }, false);
        if (this.onInputCohortSide) {
            // set show reference for output cohort to false
            this.showOutputChtHistRef = false;
            // add options for attributes on the input side
            // const showAttrBtn = select(this.$headerOptions).append('div');
            // showAttrBtn.classed('options', true).html('<i class="fas fa-chart-bar"></i>').on('click', () => log.debug('show in serach column'));
            // showAttrBtn.attr('title', 'Show Attribute');
        }
        else {
            // add options for attributes on the ouput side
            // toggle reference for the mini visulaization
            const toggleRefBtn = select(this.$headerOptions).append('div');
            toggleRefBtn.node().classList.add('options', 'toggle-ref');
            toggleRefBtn.classed('active', this.showOutputChtHistRef);
            toggleRefBtn.html('<i class="fas fa-bars"></i>').on('click', () => {
                toggleRefBtn.node().classList.toggle('active');
                this.showOutputChtHistRef = !this.showOutputChtHistRef;
                this.updateCellContent();
            });
            toggleRefBtn.attr('title', 'Toogle Input Cohort as Reference');
        }
    }
    updateCellContent() {
        const chts = select(this.$column).selectAll('div.data').data();
        for (const cht of chts) {
            const hist = this.hists.get(cht);
            hist.showReference = this.showOutputChtHistRef;
            hist.updateNode();
        }
    }
    addHighlightForColumn() {
        // html elements hierarchy: task-view -> task-view-scroll-wrapper -> task-view-table -> column
        const cols = this.$column.parentElement.parentElement.parentElement.querySelectorAll(`.column[data-attribute='${this.attribute.label}']`);
        cols.forEach((col) => {
            col.classList.add('highlight');
        });
    }
    removeHighlightForColumn() {
        // html elements hierarchy: task-view -> task-view-scroll-wrapper -> task-view-table -> column
        const cols = this.$column.parentElement.parentElement.parentElement.querySelectorAll(`.column[data-attribute='${this.attribute.label}']`);
        cols.forEach((col) => {
            col.classList.remove('highlight');
        });
    }
    async setCellStyle(cell, cht, index) {
        super.setCellStyle(cell, cht, index);
        if (this.color) {
            const hist = this.hists.get(cht);
            if (hist && !hist.$node.classList.contains('text')) {
                const color = cht.colorTaskView;
                // recolor displayed vis:
                select(cell).selectAll('svg .mark-rect > path').style('fill', color);
                // store new color:
                if (hist && hist.vegaView) {
                    hist.vegaView.scale('color').range([color]);
                }
            }
        }
    }
    // called by base class in constructor
    async setCellContent(cell, cht, index) {
        const hist = new Histogram(this.attribute, cht, this.showOutputChtHistRef, index, this.color);
        this.hists.set(cht, hist);
        cell.appendChild(hist.getNode());
    }
}
class Histogram {
    constructor(attribute, cohort, showReference, index, color) {
        this.attribute = attribute;
        this.cohort = cohort;
        this.index = index;
        this.color = color;
        this.showReference = true;
        this.showReference = showReference;
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
        this.$hist.remove();
        try {
            if (!this.cohort.hasfilterConflict()) {
                this.$node.appendChild(this.$loader);
                // get hist data of attribute for cohort
                let data;
                try {
                    data = await this.attribute.getHist(this.cohort.dbId, this.cohort.filters);
                }
                catch (e) {
                    log.error('get hist failed', e);
                    this.$loader.remove();
                    this.$node.classList.add('text');
                    this.$node.insertAdjacentHTML('afterbegin', `
            <p>
              <i class="fa fa-hourglass-end" aria-hidden="true"></i>
              Request timeout.
            </p>
          `);
                    return;
                }
                const notZeroData = data.filter((d) => d.count > 0); // filter only for categories/bins with count bigger 0
                const showText = notZeroData.length === 1; // show text when only one category/bin with count bigger 0
                const chtSize = await this.cohort.size;
                // -> size = 0: show only line in data cell with vega vis (all bins/categories have count 0)
                // check if reference should be shown and
                // if the size of the current cohort is bigger then 0
                if (this.showReference && chtSize > 0) {
                    if (this.cohort.getCohortParents().length > 0) {
                        // get parent cohort
                        const parentCht = this.cohort.getCohortParents()[0];
                        // get hist data of attribtue for parent cohort
                        const parentData = await this.attribute.getHist(parentCht.dbId, parentCht.filters);
                        const notZeroParentData = parentData.filter((d) => d.count > 0); // filter only for categories/bins with count bigger 0
                        const showParentText = notZeroParentData.length === 1; // show text when only one category/bin with count bigger 0
                        const vegaData = {
                            data,
                            parentData,
                            parentColor: parentCht.colorTaskView
                        };
                        if (showParentText) {
                            const bin = notZeroParentData[0].bin;
                            // TODO labels
                            // const text = this.formatText(bin);
                            const text = this.formatText(bin, this.cohort.values);
                            this.$node.classList.add('text');
                            this.$hist.innerHTML = text;
                        }
                        else {
                            // show histogram with reference
                            this.$node.classList.remove('text');
                            vegaEmbed(this.$hist, this.getMinimalVegaSpecWithRef(vegaData), { actions: false, renderer: 'svg' }).then((result) => {
                                this.vegaView = result.view;
                            });
                        }
                    }
                }
                else { // when no reference should be shown (is also the case for the input cohort side)
                    // check if only one category/bin has values
                    if (showText) {
                        // show only text
                        const bin = notZeroData[0].bin;
                        // TODO labels
                        // const text = this.formatText(bin);
                        this.$node.classList.add('text');
                        const text = this.formatText(bin, this.cohort.values);
                        this.$hist.innerHTML = text;
                    }
                    else {
                        // show histogram
                        this.$node.classList.remove('text');
                        vegaEmbed(this.$hist, this.getMinimalVegaSpec(data), { actions: false, renderer: 'svg' }).then((result) => {
                            this.vegaView = result.view;
                        });
                    }
                }
                this.$loader.remove();
                this.$node.appendChild(this.$hist);
            }
            else {
                throw new Error('Can not show histogram due to filter contradiction');
            }
        }
        catch (e) {
            log.error('Cant show histogram', e);
            this.$loader.remove();
            this.$node.classList.add('text');
            this.$node.insertAdjacentHTML('afterbegin', `
        <p>
          <i class="fa fa-times" aria-hidden="true"></i>
          Can not display histogram.
        </p>
      `);
        }
    }
    // TODO labels
    // private formatText(value: string): string {
    formatText(value, filters) {
        if (value === 'null' || value === null || value === undefined) {
            value = `Missing Values`;
        }
        let text = String(value); // turn boolean categories into strings
        if (text.indexOf('(') >= 0 || text.indexOf('[') >= 0) {
            const values = text.split(', ');
            const params = {
                firstOp: values[0][0],
                firstValue: Number(values[0].substring(1)),
                secondOp: values[1][values[1].length - 1],
                // TODO labels
                // secondValue: Number(values[1].substring(0, values[1].length - 2))
                secondValue: Number(values[1].substring(0, values[1].length - 1))
            };
            // TODO lables
            // text = labelFromRanges(params.firstOp === '(' ? '(' : '[', params.firstValue, params.secondValue, params.secondOp === ')' ? ')' : ']', this.attribute);
            const range = {
                operatorOne: params.firstOp === '(' ? NumRangeOperators.gt : NumRangeOperators.gte,
                valueOne: params.firstValue,
                operatorTwo: params.secondOp === ')' ? NumRangeOperators.lt : NumRangeOperators.lte,
                valueTwo: params.secondValue
            };
            text = easyLabelFromFilter(range, this.attribute.label);
        }
        else {
            text = niceName(text);
        }
        return text;
    }
    getNode() {
        return this.$node;
    }
    getMinimalVegaSpec(data) {
        let sort = 'ascending';
        if (this.attribute.type === 'number') {
            sort = { field: 'index' };
        }
        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            width: 'container',
            height: 50,
            background: '#ffffff00',
            autosize: { type: 'fit', contains: 'padding' },
            data: { values: data },
            mark: {
                type: 'bar',
                tooltip: true
            },
            encoding: {
                x: {
                    field: 'bin',
                    type: 'nominal',
                    axis: {
                        title: null,
                        labels: false,
                        ticks: false
                    },
                    sort
                },
                y: {
                    field: 'count',
                    type: 'quantitative',
                    axis: null //  no axis, no title, labels, no grid
                },
                color: {
                    field: 'this_does_not_exist',
                    type: 'nominal',
                    scale: {
                        range: [this.cohort.colorTaskView || colors.barColor] //[this.color ? Cat16.get(this.index) : colors.barColor]
                    },
                    condition: [
                        {
                            selection: 'highlight',
                            value: colors.hoverColor
                        }
                    ],
                    legend: null // no legend
                },
                tooltip: [
                    { field: 'bin', type: 'nominal' },
                    { field: 'count', type: 'quantitative' }
                ]
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
    getMinimalVegaSpecWithRef(data) {
        let sort = 'ascending';
        if (this.attribute.type === 'number') {
            sort = { field: 'index' };
        }
        return {
            $schema: 'https://vega.github.io/schema/vega-lite/v4.json',
            width: 'container',
            height: 50,
            background: '#ffffff00',
            autosize: { type: 'fit', contains: 'padding' },
            datasets: {
                parentData: data.parentData,
                data: data.data
            },
            layer: [
                {
                    data: { name: 'parentData' },
                    mark: {
                        type: 'bar',
                        tooltip: true
                    },
                    encoding: {
                        x: {
                            field: 'bin',
                            type: 'nominal',
                            axis: {
                                title: null,
                                labels: false,
                                ticks: false
                            },
                            sort
                        },
                        y: {
                            field: 'count',
                            type: 'quantitative',
                            axis: null //  no axis, no title, labels, no grid
                        },
                        fill: {
                            value: data.parentColor,
                            // condition: [
                            //   {
                            //     selection: 'highlight_parent',
                            //     value: colors.hoverColor,
                            //   }
                            // ],
                            legend: null // no legend
                        },
                        tooltip: [
                            { field: 'bin', type: 'nominal' },
                            { field: 'count', type: 'quantitative' }
                        ]
                    },
                },
                {
                    data: { name: 'data' },
                    mark: {
                        type: 'bar',
                        tooltip: true
                    },
                    encoding: {
                        x: {
                            field: 'bin',
                            type: 'nominal',
                            axis: {
                                title: null,
                                labels: false,
                                ticks: false
                            },
                            sort
                        },
                        y: {
                            field: 'count',
                            type: 'quantitative',
                            axis: null //  no axis, no title, labels, no grid
                        },
                        fill: {
                            value: colors.barColor,
                            // condition: [
                            //   {
                            //     selection: 'highlight',
                            //     value: colors.hoverColor,
                            //   }
                            // ],
                            legend: null // no legend
                        },
                        tooltip: [
                            { field: 'bin', type: 'nominal' },
                            { field: 'count', type: 'quantitative' }
                        ]
                    },
                }
            ],
            config: {
                view: {
                    stroke: 'transparent' // https://vega.github.io/vega-lite/docs/spec.html#view-background
                }
            }
        };
    }
}
//# sourceMappingURL=AttributeColumn.js.map