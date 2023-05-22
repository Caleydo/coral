import tippy from 'tippy.js';
import { select } from 'd3v7';
import { EMPTY_COHORT_ID, LOADER_COHORT_ID } from '../../Cohort';
import { colors } from '../../config/colors';
import { getAnimatedLoadingBars, log } from '../../util';
import { ColumnCloseEvent } from '../../base/events';
import type Taskview from '../Taskview';
import { CohortContext } from '../../CohortContext';
import { ICohort, IInputCohort, IOutputCohort } from '../../app/interfaces';
import { SearchBar } from '../SearchBar';
import { toAttribute } from '../../Tasks';

function createSearchBarTooltip(elemWithTooltip: HTMLDivElement, cssClassName: string, database: string, view: string, positionStart = true) {
  // start of tooltip content
  const divAddAttr = document.createElement('div');
  divAddAttr.classList.add('tooltip-serachbar');
  const divText = document.createElement('div');
  divText.innerHTML = 'Add attribute columns to the input and output sides:';
  divText.classList.add('tooltip-txt');
  divAddAttr.appendChild(divText);
  const divSearchBar = document.createElement('div');
  const searchBar = new SearchBar(divSearchBar, database, view, cssClassName);
  divAddAttr.appendChild(divSearchBar);

  const divControls = document.createElement('div');
  const divOK = document.createElement('div');
  divOK.classList.add('okay', 'btn', 'btn-coral', 'tooltip-btn');
  divOK.innerHTML = 'Okay';
  divOK.addEventListener('click', () => {
    // get options from search bar
    const options = searchBar ? searchBar.getSelectedOptions() : [];
    // convert options to attributes
    const attributes = options.map((opt) => toAttribute(opt, database, view));
    // add attributes to taskview
    CohortContext.taskview.addMultipleAttributeColumns(attributes, true, true);
    // remove options and close tooltip
    elemWithTooltip.click();
  });

  divControls.classList.add('tooltip-controls');
  const divCancel = document.createElement('div');
  divCancel.classList.add('cancel', 'btn', 'btn-coral', 'tooltip-btn');
  divCancel.innerHTML = 'Cancel';
  divCancel.addEventListener('click', () => {
    // remove options and close tooltip
    elemWithTooltip.click();
  });

  divControls.appendChild(divOK);
  divControls.appendChild(divCancel);
  divAddAttr.appendChild(divControls);

  elemWithTooltip.addEventListener('click', () => {
    searchBar.removeAllSelectedOptions(); // remove all selected options form the search bar
    elemWithTooltip.classList.toggle('active');
  });

  // add the tippy tool tip
  tippy(elemWithTooltip, {
    content: divAddAttr,
    allowHTML: true,
    interactive: true, // tooltip is interactive: clickable/hoverable content
    placement: positionStart ? 'top-start' : 'top-end',
    appendTo: () => document.body, // add the content to the document as a child
    trigger: 'click', // element has to be clicked to show the tooltip
    hideOnClick: 'toggle', // the tooltip is closed when the element is clicked again
    arrow: true, // show tooltip arrow
    zIndex: 9000, // default z-index: 9999 (but the searchbar option container has z-index of 9001)
    maxWidth: 'none', // default max. width is 350px
  });
}

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

    this.$headerTitle.innerHTML = title || '&#x200b;'; // zero width space if empty
    this.$headerTitle.classList.add('text');

    if (title) {
      // only when column has a title then set the title property
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

  public abstract setCohorts(cohorts: ICohort[]);
}

/**
 * Abstract base class of all data columns = columns with data to cohorts
 */
export abstract class ADataColumn extends AColumn {
  protected showLoadingAnimation = true;

  private dataCells;

  public setCohorts(cohorts: ICohort[]) {
    this.dataCells = select(this.$column)
      .selectAll<HTMLDivElement, ICohort>('div.data')
      .data(cohorts, (d) => d.id);

    // eslint-disable-next-line @typescript-eslint/no-this-alias, @typescript-eslint/naming-convention
    const _thisColumn = this;

    // Update
    this.dataCells.each(function (d, i) {
      _thisColumn.setCellStyle(select(this).node() as HTMLDivElement, d, i);
    });

    // Enter
    const enterSelection = this.dataCells.enter();
    enterSelection
      .append('div')
      .classed('data', true)
      .each(function (d, i) {
        // function so we can refer to the html element with 'this'
        _thisColumn.setCell(select(this).node() as HTMLDivElement, d, i);
      });

    this.dataCells.exit().remove(); // Exit
  }

  public orderCohorts(cohorts: ICohort[]) {
    this.setCohorts(cohorts);
    this.dataCells.order();
  }

  async setCell(cell: HTMLDivElement, cht: ICohort, index: number): Promise<void> {
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

  async setCellStyle(cell: HTMLDivElement, cht: ICohort, index: number): Promise<void> {
    let cellHeight = 56; // Cohort Representation + Padding + Border Top = 52px + 2*2px + 1px = 57px

    if ((cht as IInputCohort).outputCohorts) {
      // check chohort type -> InputCohort always has a outputCohorts array
      const rows = (cht as IInputCohort).outputCohorts.length; // one row for each output cohort
      cellHeight *= Math.max(rows, 1); // at least one row
      cellHeight += 10 - 2; // extra padding - default padding
      cellHeight += 1; // border
      cell.dataset.inputCohort = `${cht.dbId}`;
    } else {
      log.debug('cohort: ', cht, ' | parents: ', cht.getCohortParents());
      const parent = cht.getCohortParents()[0];
      cell.dataset.inputCohort = `${parent.dbId}`;
      cell.classList.remove('last-output-cohort');
      cell.classList.remove('first-output-cohort');
      if ((cht as IOutputCohort).isLastOutputCohort) {
        cell.classList.add('last-output-cohort');
        cellHeight += 10 - 2; // extra padding - default padding
        cellHeight += 1; // border
      }
      if ((cht as IOutputCohort).isFirstOutputCohort) {
        cell.classList.add('first-output-cohort');
        cellHeight += 0; // margin (not part of border-box)
      }
    }

    cell.style.height = `${cellHeight}px`;
    const { selected } = cht;
    cell.classList.toggle('deselected', !selected);
  }

  abstract setCellContent(cell: HTMLDivElement, cht: ICohort, index: number): Promise<void>;
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

  async setCellContent(cell: HTMLDivElement, cht: ICohort, index: number): Promise<void> {
    // Empty
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
        <i class="fas fa-plus fa-fw icon-top-left" style="color: ${colors.backgroundColor}; background: ${`${colors.barColor}cc`};"></i>
      </span>
    </span>
    `;
    divEmptyColHeader.appendChild(divAdd);

    createSearchBarTooltip(divAdd, cssClassName, database, view, onInputCohortSide);
  }

  async setCellContent(cell: HTMLDivElement, cht: ICohort, index: number): Promise<void> {
    // Empty
  }
}
