import {format as d3Format} from 'd3-format';
import {Cohort} from '../../Cohort';
import {ADataColumn} from './AColumn';

export default class NumberColumn extends ADataColumn {
  constructor($container: HTMLDivElement) {
    super(`No.`, $container, false);
    this.$column.classList.add('first', 'number');
  }

  async setCellStyle(cell: HTMLDivElement, cht: Cohort, index: number): Promise<void> {
    super.setCellStyle(cell, cht, index);
    this.setCellContent(cell, cht, index);
  }

  async setCellContent(cell: HTMLDivElement, cht: Cohort, index: number): Promise<void> {
    while (cell.firstChild) {
      cell.removeChild(cell.firstChild);
    }
    const text = document.createElement('div');
    text.classList.add('number-color');
    const formatter = d3Format('\u2002>3'); // right align up to 3 digits, fill with en-space
    // get color from cohort
    const color = cht.colorTaskView;
    text.insertAdjacentHTML('afterbegin', `${formatter(index + 1)} <i class="fas fa-square color-icon" aria-hidden="true" style="color: ${color};"></i>`);
    cell.appendChild(text);
  }
}
