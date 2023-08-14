import { select } from 'd3v7';
import { niceName } from '../../utils/labels';
import { ADataColumn } from './AColumn';
import { ICohort } from '../../app/interfaces';
import type { IAttribute } from '../../data/IAttribute';
import { Histogram } from './Histogram';

export default class AttributeColumn extends ADataColumn {
  private hists: WeakMap<ICohort, Histogram> = new WeakMap();

  private showOutputChtHistRef = false;

  private _pinned = false;

  private togglePinBtn;

  private _order = 50;

  constructor(public attribute: IAttribute, $container: HTMLDivElement, private onInputCohortSide = true, private color = false, pinned = false) {
    super(niceName(attribute.label), $container);

    this.$column.dataset.attribute = this.attribute.label;
    this.$column.style.order = `${this._order}`;
    this._pinned = pinned;

    this.$header.addEventListener(
      'mouseover',
      (event) => {
        event.stopPropagation();
        if (event.target === this.$header) {
          // add highlight
          this.addHighlightForColumn();
        } else if (event.target === this.$headerOptions) {
          // add highlight
          this.addHighlightForColumn();
        } else if (event.target === this.$headerTitle) {
          // add highlight
          this.addHighlightForColumn();
        } else {
          // remove highlight
          this.removeHighlightForColumn();
        }
      },
      false,
    );

    this.$header.addEventListener(
      'mouseout',
      (event) => {
        event.stopPropagation();
        // remove highlight
        this.removeHighlightForColumn();
      },
      false,
    );

    // add option to pin column
    this.togglePinBtn = select(this.$headerOptions).append('i');
    this.togglePinBtn.node().classList.add('options', 'fas', 'fa-thumbtack', 'left-side');
    this.togglePinBtn.node().classList.toggle('active', this.pinned);
    this.togglePinBtn.node().style.order = '10';
    this.togglePinBtn.attr('title', this.pinned === true ? 'Unpin Column' : 'Pin Column');

    this.togglePinBtn.on('click', () => {
      this.pinned = !this.pinned;
      this.togglePinBtn.node().classList.toggle('active', this.pinned);
      this.togglePinBtn.attr('title', this.pinned === true ? 'Unpin Column' : 'Pin Column');
    });

    if (this.onInputCohortSide) {
      // set show reference for output cohort to false
      this.showOutputChtHistRef = false;

      // add options for attributes on the input side
      // const showAttrBtn = select(this.$headerOptions).append('div');
      // showAttrBtn.classed('options', true).html('<i class="fas fa-chart-bar"></i>').on('click', () => log.debug('show in serach column'));
      // showAttrBtn.attr('title', 'Show Attribute');
    } else {
      // add options for attributes on the ouput side
      // toggle reference for the mini visulaization
      const toggleRefBtn = select(this.$headerOptions).append('i');
      toggleRefBtn.node().classList.add('options', 'fas', 'fa-bars', 'toggle-ref');
      toggleRefBtn.node().style.order = '9';
      toggleRefBtn.classed('active', this.showOutputChtHistRef);
      toggleRefBtn.on('click', () => {
        toggleRefBtn.node().classList.toggle('active');
        this.showOutputChtHistRef = !this.showOutputChtHistRef;
        this.updateCellContent();
      });
      toggleRefBtn.attr('title', 'Toogle Input Cohort as Reference');
    }
  }

  updateCellContent() {
    const chts = select(this.$column).selectAll<HTMLDivElement, ICohort>('div.data').data();
    for (const cht of chts) {
      const hist = this.hists.get(cht);
      hist.showReference = this.showOutputChtHistRef;
      hist.updateNode();
    }
  }

  public get pinned() {
    return this._pinned;
  }

  public set pinned(value) {
    this._pinned = value;
    this.togglePinBtn.node().classList.toggle('active', this.pinned);
    this.togglePinBtn.attr('title', this.pinned === true ? 'Unpin Column' : 'Pin Column');
  }

  public setOrder(incOrderValueBy: number) {
    const currOrder = this._order + incOrderValueBy;
    this.$column.style.order = `${currOrder}`;
  }

  private addHighlightForColumn() {
    // html elements hierarchy: task-view -> task-view-scroll-wrapper -> task-view-table -> column
    const cols = this.$column.parentElement.parentElement.parentElement.querySelectorAll(`.column[data-attribute='${this.attribute.label}']`);
    cols.forEach((col) => {
      col.classList.add('highlight');
    });
  }

  private removeHighlightForColumn() {
    // html elements hierarchy: task-view -> task-view-scroll-wrapper -> task-view-table -> column
    const cols = this.$column.parentElement.parentElement.parentElement.querySelectorAll(`.column[data-attribute='${this.attribute.label}']`);
    cols.forEach((col) => {
      col.classList.remove('highlight');
    });
  }

  async setCellStyle(cell: HTMLDivElement, cht: ICohort, index: number): Promise<void> {
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
  async setCellContent(cell: HTMLDivElement, cht: ICohort, index: number): Promise<void> {
    const hist = new Histogram(this.attribute, cht, this.showOutputChtHistRef, index, this.color);
    this.hists.set(cht, hist);
    cell.appendChild(hist.getNode());
  }
}
