import {select} from 'd3-selection';
import {Cohort, EMPTY_COHORT_ID, LOADER_COHORT_ID} from '../../Cohort';
import {colors} from '../../colors';
import {createSearchBarTooltip} from '../../Tooltip';
import {getAnimatedLoadingBars, log} from '../../util';
import {ColumnCloseEvent} from '../../utilCustomEvents';
import Taskview, {InputCohort, OutputCohort} from '../Taskview';


export abstract class AColumn {
  $column: HTMLDivElement;
  $header: HTMLDivElement;
  $headerTitle: HTMLDivElement;
  $headerOptions: HTMLDivElement;

  constructor(protected title: string, protected $container: HTMLDivElement, closeable = true) {
    this.$column = select(this.$container).append('div').classed('column', true).node() as HTMLDivElement;
    this.$header = select(this.$column).append('div').classed('header', true).node() as HTMLDivElement;
    this.$headerOptions = select(this.$header).append('div').classed('header-option', true).node() as HTMLDivElement;
    this.$headerTitle = select(this.$header).append('div').classed('header-title', true).node() as HTMLDivElement;

    this.$headerTitle.innerHTML = title ? title : '&#x200b;'; //zero width space if empty
    this.$headerTitle.classList.add('text');

    if (title) { // only when column has a title then set the title property
      this.$headerTitle.title = title;
    }
    if (closeable) {
      const removeElem = select(this.$headerOptions).append('i');
      removeElem.classed('options remove fas fa-trash', true).on('click', () => this.close());
      removeElem.attr('title', 'Remove Column');
      removeElem.node().style.order = '1';
    }
  }

  public close(): void {
    try {
      this.$container.removeChild(this.$column);
    } catch (e) {
      log.error('Column not found', e);
    }
    this.$container.dispatchEvent(new ColumnCloseEvent(this));
  }

  public abstract setCohorts(cohorts: Cohort[]);
}

/**
 * Abstract base class of all data columns = columns with data to cohorts
 */
export abstract class ADataColumn extends AColumn {
  protected showLoadingAnimation = true;
  private dataCells;

  public setCohorts(cohorts: Cohort[]) {
    this.dataCells = select(this.$column).selectAll<HTMLDivElement, Cohort>('div.data').data(cohorts, (d) => d.id);
    const _thisColumn = this;

    //Update
    this.dataCells.each(function (d, i) {
      _thisColumn.setCellStyle(select(this).node() as HTMLDivElement, d, i);
    });

    //Enter
    const enterSelection = this.dataCells.enter();
    enterSelection
      .append('div')
      .classed('data', true)
      .each(function (d, i) { // function so we can refer to the html element with 'this'
        _thisColumn.setCell(select(this).node() as HTMLDivElement, d, i);
      });

    this.dataCells.exit().remove(); // Exit
  }

  public orderCohorts(cohorts: Cohort[]) {
    this.setCohorts(cohorts);
    this.dataCells.order();
  }

  async setCell(cell: HTMLDivElement, cht: Cohort, index: number): Promise<void> {
    log.debug('Set cell for cohort', cht.label);
    this.setCellStyle(cell, cht, index);

    if (cht.id !== EMPTY_COHORT_ID) {
      if (cht.id === LOADER_COHORT_ID) {
        if (this.showLoadingAnimation) {
          cell.insertAdjacentElement('afterbegin', getAnimatedLoadingBars());
        }
      } else {
        this.setCellContent(cell, cht, index);
      }
    }
  }

  async setCellStyle(cell: HTMLDivElement, cht: Cohort, index: number): Promise<void> {
    let cellHeight = 56; //Cohort Representation + Padding + Border Top = 52px + 2*2px + 1px = 57px

    if ((cht as InputCohort).outputCohorts) { // check chohort type -> InputCohort always has a outputCohorts array
      const rows = (cht as InputCohort).outputCohorts.length; // one row for each output cohort
      cellHeight *= Math.max(rows, 1); // at least one row
      cellHeight += (10 - 2); // extra padding - default padding
      cellHeight += 1; // border
      cell.dataset.inputCohort = `${cht.dbId}`;
    } else {
      log.debug('cohort: ', cht, ' | parents: ', cht.getCohortParents());
      const parent = cht.getCohortParents()[0];
      cell.dataset.inputCohort = `${parent.dbId}`;
      cell.classList.remove('last-output-cohort');
      cell.classList.remove('first-output-cohort');
      if ((cht as OutputCohort).isLastOutputCohort) {
        cell.classList.add('last-output-cohort');
        cellHeight += (10 - 2); // extra padding - default padding
        cellHeight += 1; // border
      }
      if ((cht as OutputCohort).isFirstOutputCohort) {
        cell.classList.add('first-output-cohort');
        cellHeight += 0; // margin (not part of border-box)
      }
    }

    cell.style.height = `${cellHeight}px`;
    const selected = cht.selected;
    cell.classList.toggle('deselected', !selected);
  }

  abstract setCellContent(cell: HTMLDivElement, cht: Cohort, index: number): Promise<void>;
}

/**
 * Header and cells are empty, no options are shown
 * Shrinks down to 0px for the content, the border remains, and currently is 2px left, seperating the last input column from the task search and the last output column from the output cohorts
 */
export class EmptyColumn extends ADataColumn {

  constructor($container: HTMLDivElement) {
    super(undefined, $container, false);
    this.$column.classList.add('empty');
    this.showLoadingAnimation = false;
  }

  async setCellContent(cell: HTMLDivElement, cht: Cohort, index: number): Promise<void> {
    //Empty
  }
}

export default class AddColumnColumn extends ADataColumn {

  constructor($container: HTMLDivElement, taskview: Taskview, database: string, view: string, private onInputCohortSide = true) {
    super(undefined, $container, false);
    this.$column.classList.add('first', 'add-column');
    this.showLoadingAnimation = false;

    const cssClassName = onInputCohortSide ? 'tippy-input' : 'tippy-output';

    // remove (add hidden css class) the header and text div and replace with button
    this.$headerOptions.toggleAttribute('hidden', true);
    this.$headerTitle.toggleAttribute('hidden', true);

    const divEmptyColHeader = document.createElement('div');
    divEmptyColHeader.classList.add('header-only-button');
    this.$header.appendChild(divEmptyColHeader);

    const divAdd = document.createElement('div');
    divAdd.classList.add('empty-header-button', 'btn-coral');
    divAdd.innerHTML = `
    <span class="icon-custom-layers">
      <i class="fa fa-columns"></i>
      <span class="icon-layer icon-layer-shrink">
        <i class="fas fa-plus fa-fw icon-top-left" style="color: ${colors.backgroundColor}; background: ${colors.barColor + 'cc'};"></i>
      </span>
    </span>
    `;
    divEmptyColHeader.appendChild(divAdd);

    createSearchBarTooltip(divAdd, cssClassName, database, view, onInputCohortSide);
  }

  async setCellContent(cell: HTMLDivElement, cht: Cohort, index: number): Promise<void> {
    //Empty
  }
}
