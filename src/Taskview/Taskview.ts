import { ICohort, IInputCohort, IOutputCohort, ITaskParams, TaskType } from '../app/interfaces';
import {
  CohortSelectionEvent,
  COHORT_SELECTION_EVENT_TYPE,
  ColumnCloseEvent,
  ColumnSortEvent,
  COLUMN_CLOSE_EVENT_TYPE,
  COLUMN_SORT_EVENT_TYPE,
  ConfirmOutputEvent,
  ConfirmTaskEvent,
  CONFIRM_OUTPUT_EVENT_TYPE,
  FilterEvent,
  FILTER_EVENT_TYPE,
  PreviewChangeEvent,
  SplitEvent,
  SPLIT_EVENT_TYPE,
  AutoSplitEvent,
  AUTO_SPLIT_EVENT_TYPE,
} from '../base/events';
import { RectCohortRep } from '../CohortRepresentations';
import { CoralColorSchema } from '../config/colors';
import { IAttribute } from '../data/IAttribute';
import { SortType, removeFromArray, log } from '../util';
import { ScrollLinker } from '../utils/ScrollLinker';
import SearchColumn from './SearchColumn';
import AddColumnColumn, { AColumn, ADataColumn, EmptyColumn } from './columns/AColumn';
import { InputCohortColumn, OutputCohortColumn } from './columns/CohortColumn';
import { EMPTY_COHORT_ID, getEmptyCohort, getLoaderCohort, LOADER_COHORT_ID } from '../Cohort';
import { multiAttributeFilter } from '../data/Attribute';
import AttributeColumn from './columns/AttributeColumn';
import { RectangleLayout } from '../Overview/OverviewLayout';

abstract class TaskviewTable {
  $node: HTMLDivElement;

  $floatingBtns: HTMLDivElement;

  columns: AColumn[] = [];

  cohorts: ICohort[] = [];

  constructor(private $wrapper: HTMLDivElement) {
    this.$wrapper.classList.add('task-view-table-button-wrapper');

    const tableWrapper = document.createElement('div');
    tableWrapper.classList.add('task-view-scroll-wrapper'); // this div can only be around half the height of the browser (which would lead to column border ending to early for example) --> therefore this is a container holding scrollbars
    this.$wrapper.appendChild(tableWrapper);

    this.$node = document.createElement('div'); // this div will contain the columns of our table that can be higher than half of the viewport
    this.$node.classList.add('task-view-table');
    tableWrapper.appendChild(this.$node);
    $wrapper.appendChild(tableWrapper);

    $wrapper.insertAdjacentHTML(
      'beforeend',
      `
      <div class="floating-confirm" hidden>
          <button type="button" class="btn btn-coral clearBtn">
            <i class="fas fa-times" aria-hidden="true"></i> Clear
          </button>
      </div>
    `,
    );

    this.$floatingBtns = $wrapper.querySelector('div.floating-confirm');
    $wrapper.querySelector<HTMLButtonElement>('div.floating-confirm button.clearBtn').addEventListener('click', () => this.clear());

    this.$node.addEventListener(COLUMN_CLOSE_EVENT_TYPE, (ev) => this.removeColumn((ev as ColumnCloseEvent).detail.column)); // arrow function to keep "this" working in eventhandler
  }

  destroy() {
    this.$node.addEventListener(COLUMN_CLOSE_EVENT_TYPE, null);
    this.$node.remove();
  }

  update() {
    this.setCohorts(this.cohorts);
  }

  public setCohorts(cohorts: ICohort[]) {
    this.cohorts = cohorts;
    for (const column of this.columns) {
      column.setCohorts(cohorts);
    }

    this.$floatingBtns.hidden = cohorts.filter((cht) => cht.id !== LOADER_COHORT_ID && cht.id !== EMPTY_COHORT_ID).length === 0;
  }

  public addCohort(cht: ICohort) {
    this.cohorts.push(cht);
    this.setCohorts(this.cohorts);
  }

  public getAttributeColumns(): AttributeColumn[] {
    const attCol = [];
    for (const ac of this.columns) {
      if (ac instanceof AttributeColumn) {
        attCol.push(ac);
      }
    }
    return attCol;
  }

  public getUnpinnedAttributeColumns(): AttributeColumn[] {
    const attCol = [];
    for (const ac of this.columns) {
      if (ac instanceof AttributeColumn) {
        if (!ac.pinned) {
          attCol.push(ac);
        }
      }
    }
    return attCol;
  }

  public addAttributeColumn(attr: IAttribute, allowDuplicates = false, onInputCohortSide = true, color = false, pinned = false) {
    if (
      allowDuplicates ||
      !this.columns.find((column) => column instanceof AttributeColumn && (column as AttributeColumn).attribute.dataKey === attr.dataKey)
    ) {
      // if duplicates are allowed or the column wasn't added yet
      const newCol = new AttributeColumn(attr, this.$node, onInputCohortSide, color, pinned);
      newCol.setCohorts(this.cohorts);
      this.columns.unshift(newCol); // add columnt as first element
      // only adding the new column as first element doesn't reorder column HTML elements
      // because the new one gets added at the end -> set order attribute to define order of columns
      let orderCnt = 0;
      this.columns.forEach((elem) => {
        if (elem instanceof AttributeColumn) {
          elem.setOrder(orderCnt);
          orderCnt++;
        }
      });
      window.dispatchEvent(new Event('resize')); // update vega chart sizes in case the columns became narrower
    }
  }

  public removeColumn(col: AColumn) {
    removeFromArray(this.columns, col);
    window.dispatchEvent(new Event('resize')); // update vega chart sizes in case the columns became wider
  }

  clear() {
    // this.columns.filter((col) => !(col instanceof OutputCohortColumn || col instanceof EmptyColumn)).forEach((col) => col.close()); //close all but default columns
    this.setCohorts([]);
  }
}

class TaskviewInput extends TaskviewTable {
  cohortOrder: number[];

  cohorts: IInputCohort[] = [];

  usedColorsForCohorts = CoralColorSchema.COLOR_SCHEME.map((elem) => {
    return { color: elem, cohorts: [] };
  });

  private inputCohortCol: InputCohortColumn;

  maxColors: number;

  constructor($wrapper: HTMLDivElement, reference: ICohort, private taskview: Taskview) {
    super($wrapper);
    this.$node.classList.add('input');

    // this.columns.push(new NumberColumn(this.$node));
    this.inputCohortCol = new InputCohortColumn(this.$node);
    this.columns.push(new AddColumnColumn(this.$node, taskview, reference.database, reference.view));
    this.columns.push(this.inputCohortCol);
    // this.columns.push(new PrevalenceColumn(reference, this.$node));
    this.columns.push(new EmptyColumn(this.$node));
    this.clearColorCohorts();
  }

  private clearColorCohorts() {
    // setup color options
    this.usedColorsForCohorts = CoralColorSchema.COLOR_SCHEME.map((elem) => {
      return { color: elem, cohorts: [] };
    });
    this.maxColors = this.usedColorsForCohorts.length;
  }

  public setCohorts(cohorts: IInputCohort[]) {
    this.clearColorCohorts();
    cohorts.filter((cht) => !cht.outputCohorts).forEach((cht) => (cht.outputCohorts = [])); // handle undefined outputCohort array

    // set selction order of cohorts
    this.cohortOrder = cohorts.map((cht) => cht.dbId);
    this.inputCohortCol.setDefaultSort();

    // get all cohorts that have already a color
    cohorts
      .filter((cht) => cht.colorTaskView)
      .forEach((cht) => {
        const colorIndex = this.usedColorsForCohorts.map((a) => a.color).indexOf(cht.colorTaskView);
        if (colorIndex !== -1) {
          this.usedColorsForCohorts[colorIndex].cohorts.push(cht.id);
        }
      });

    // assign color to cohort without one
    const maxCohortPerColor = Math.ceil(cohorts.length / this.maxColors);
    cohorts.forEach((elem, i) => {
      const colorIndex = i % this.maxColors; // circle through all colors

      // check if color exists
      if (elem.colorTaskView === null) {
        // check if the color for the current cohort index is available
        if (this.usedColorsForCohorts[colorIndex].cohorts.length < maxCohortPerColor) {
          this.usedColorsForCohorts[colorIndex].cohorts.push(elem.id); // add cohort to the cohort array for the color
          elem.colorTaskView = this.usedColorsForCohorts[colorIndex].color; // set color for the cohort
        } else {
          // go through all possible color and use the first one not used
          for (const cc of this.usedColorsForCohorts) {
            if (cc.cohorts.length < maxCohortPerColor) {
              cc.cohorts.push(elem.id); // add cohort to the cohort array for the color
              elem.colorTaskView = cc.color; // set color for the cohort
              break;
            }
          }
        }
      }
    });
    super.setCohorts(cohorts);
  }

  public addAttributeColumn(attr: IAttribute, allowDuplicates = false, pinned = false) {
    super.addAttributeColumn(attr, allowDuplicates, true, true, pinned);
  }

  clear() {
    this.cohorts
      .slice() // duplicate because the cohort array will change through the event
      .forEach((cht) => this.$node.dispatchEvent(new CohortSelectionEvent(cht))); // deselect each
    super.clear();
  }
}

class TaskviewOutput extends TaskviewTable {
  cohortOrders: { inputCht: number; cohorts: number[] }[];

  private outputCohortCol: OutputCohortColumn;

  constructor($wrapper: HTMLDivElement, reference: ICohort, private taskview: Taskview) {
    super($wrapper);
    $wrapper.classList.add('output');

    this.$floatingBtns.insertAdjacentHTML(
      `beforeend`,
      `
      <button type="button" class="btn btn-coral-prime confirmBtn">
        <i class="fas fa-check" aria-hidden="true"></i> Add to Cohort Graph
      </button>
    `,
    );
    $wrapper
      .querySelector<HTMLButtonElement>('div.floating-confirm button.confirmBtn')
      .addEventListener('click', (clickEv) => clickEv.target.dispatchEvent(new ConfirmOutputEvent(this.cohorts)));

    this.columns.push(new EmptyColumn(this.$node)); // same flex order as outputcohort column -> ordered by position in DOM
    this.columns.push(new AddColumnColumn(this.$node, taskview, reference.database, reference.view, false));
    this.outputCohortCol = new OutputCohortColumn(this.$node);
    this.columns.push(this.outputCohortCol);

    this.$node.addEventListener(COHORT_SELECTION_EVENT_TYPE, (ev: CohortSelectionEvent) => {
      ev.stopPropagation(); // prevent this ev from going to the global selection handler that sets the taskview inputs
      ev.detail.cohort.selected = !ev.detail.cohort.selected;
      const updatedTaskParams: ITaskParams[] = [];
      // only add the output cohorts that are selected to each of the task parameters
      for (const tsk of this.taskview.getTaskParams()) {
        const selectedOutputCohorts = tsk.outputCohorts.filter((a) => a.selected === true);
        // check if task has output cohorts
        if (selectedOutputCohorts.length > 0) {
          updatedTaskParams.push({
            inputCohorts: tsk.inputCohorts,
            outputCohorts: selectedOutputCohorts,
            type: tsk.type,
            label: tsk.label,
          });
        }
      }
      // update the preview to only show the selected output cohorts
      this.$node.dispatchEvent(new PreviewChangeEvent(updatedTaskParams, this.taskview.getTaskAttributes()));
      this.update();
    });
  }

  clear() {
    super.clear();

    this.taskview.getInputCohorts().forEach((cht) => ((cht as IInputCohort).outputCohorts = []));
    this.taskview.updateInput();
    // remove the preview by setting the taskParams to an empty array
    this.$node.dispatchEvent(new PreviewChangeEvent([], null));
  }

  public setCohorts(cohorts: ICohort[]) {
    super.setCohorts(cohorts);

    // set order of output cohorts for each input cohort
    this.cohortOrders = [];
    for (const cht of cohorts) {
      const existingParents = this.cohortOrders.map((o) => o.inputCht);
      const parentdbID = cht.getCohortParents()[0].dbId;
      const index = existingParents.indexOf(parentdbID);
      if (index === -1) {
        this.cohortOrders.push({
          inputCht: parentdbID,
          cohorts: [cht.dbId],
        });
      } else {
        this.cohortOrders[index].cohorts.push(cht.dbId);
      }
    }
    this.outputCohortCol.setDefaultSort();
  }
}

export default class Taskview {
  public destroy() {
    this.$node.removeEventListener(FILTER_EVENT_TYPE, this.filterListener);
    this.$node.removeEventListener(SPLIT_EVENT_TYPE, this.splitListener);
    this.$node.removeEventListener(AUTO_SPLIT_EVENT_TYPE, this.splitListener);
    this.$node.removeEventListener(CONFIRM_OUTPUT_EVENT_TYPE, this.confirmListener);

    this.scrollLink.destroy();

    this.search.destroy();
    this.input.destroy();
    this.output.destroy();

    this.$node.classList.remove('task-view');
    while (this.$node.hasChildNodes()) {
      this.$node.removeChild(this.$node.lastChild);
    }
  }

  clearOutput() {
    this.output.clear();
    this.input.update();
  }

  private input: TaskviewInput;

  private search: SearchColumn;

  private output: TaskviewOutput;

  private scrollLink: ScrollLinker;

  private taskParams: ITaskParams[];

  private taskAttributes: IAttribute[];

  private filterListener: EventListenerOrEventListenerObject = (ev) => this.handleFilterEvent(ev as FilterEvent);

  private splitListener: EventListenerOrEventListenerObject = (ev) => this.handleFilterEvent(ev as SplitEvent);

  private autoSplitListener: EventListenerOrEventListenerObject = (ev) => this.handleAutoFilterEvent(ev as AutoSplitEvent);

  private confirmListener: EventListenerOrEventListenerObject = (ev) => this.confirmTask(); // event data (cohorts) currently ignored

  private columnSortListener: EventListenerOrEventListenerObject = (ev) => this.handleColumnSortEvent(ev as ColumnSortEvent);

  constructor(public readonly $node: HTMLDivElement, private reference: ICohort) {
    this.$node.classList.add('task-view');

    const inNode = document.createElement('div');
    this.input = new TaskviewInput(inNode, this.reference, this);
    this.$node.appendChild(inNode);

    const searchNode = document.createElement('div');
    this.search = new SearchColumn(searchNode, this.reference, this);
    this.$node.appendChild(searchNode);

    const outNode = document.createElement('div');
    this.output = new TaskviewOutput(outNode, this.reference, this);
    this.$node.appendChild(outNode);

    this.scrollLink = new ScrollLinker(inNode.querySelector('div.task-view-scroll-wrapper'), outNode.querySelector('div.task-view-scroll-wrapper'));

    // Listen to cohort creation events fired by histograms in the input part
    this.$node.addEventListener(FILTER_EVENT_TYPE, this.filterListener);
    this.$node.addEventListener(SPLIT_EVENT_TYPE, this.splitListener);
    this.$node.addEventListener(AUTO_SPLIT_EVENT_TYPE, this.autoSplitListener);

    // confirmation event that adds the cohrots to cohort graph
    this.$node.addEventListener(CONFIRM_OUTPUT_EVENT_TYPE, this.confirmListener);

    // sort event that sorts the input cohorts
    this.$node.addEventListener(COLUMN_SORT_EVENT_TYPE, this.columnSortListener);
  }

  public async handleColumnSortEvent(ev: ColumnSortEvent) {
    const sortDetail = ev.detail;
    const inputChts = this.getInputCohorts() as IInputCohort[];
    if (sortDetail.sortInputChts) {
      // sort input cohort
      const defaultOrder = this.input.cohortOrder;
      await this.sortCohorts(sortDetail.type, inputChts, defaultOrder);
    } else {
      // sort output cohort for each input cohort
      for (const inCht of inputChts) {
        const currOutChts = inCht.outputCohorts as IOutputCohort[];
        const outputOrder = this.output.cohortOrders.filter((order) => order.inputCht === inCht.dbId);
        const defaultOrder = outputOrder.length === 1 ? outputOrder[0].cohorts : currOutChts.map((cht) => cht.dbId);
        // TODO: fix me
        // eslint-disable-next-line no-await-in-loop
        await this.sortCohorts(sortDetail.type, currOutChts, defaultOrder);
        const sizeOutCht = currOutChts.length;
        // define the first and last cohort
        for (let i = 0; i < sizeOutCht; i++) {
          const currCht = currOutChts[i];
          currCht.isFirstOutputCohort = false;
          currCht.isLastOutputCohort = false;
          // first cohort
          if (i === 0) {
            currCht.isFirstOutputCohort = true;
          }
          // last cohort
          if (i === sizeOutCht - 1) {
            currCht.isLastOutputCohort = true;
          }
        }
      }
    }

    this.orderCohorts();
  }

  private async sortCohorts(type: SortType, cohortsToSort: ICohort[], defaultOrder: number[]) {
    if (type === SortType.Default) {
      // sort by default
      const sortingArray = defaultOrder;
      cohortsToSort.sort((a, b) => this.sortWithDbIdArray(a.dbId, b.dbId, sortingArray)); // default
    } else if (type === SortType.Alpha_AZ) {
      // sort by label name
      cohortsToSort.sort((a, b) => this.sortLabelAlpha(a, b)); // A -> Z
    } else if (type === SortType.Alpha_ZA) {
      cohortsToSort.sort((a, b) => this.sortLabelAlpha(b, a)); // Z -> A
    } else if (type === SortType.Size_19) {
      // sort by cohort size
      await this.sortCohortsBySize(false, cohortsToSort);
    } else if (type === SortType.Size_91) {
      // sort by cohort size
      await this.sortCohortsBySize(true, cohortsToSort);
    }
  }

  private sortWithDbIdArray(a, b, sortingArr) {
    return sortingArr.indexOf(a) - sortingArr.indexOf(b);
  }

  private sortLabelAlpha(a, b) {
    if (a.label < b.label) {
      return -1;
    }
    if (a.label > b.label) {
      return 1;
    }
    return 0;
  }

  private sortSizeNum(a, b) {
    if (a.size > b.size) {
      return -1;
    }
    if (a.size < b.size) {
      return 1;
    }
    return 0;
  }

  private async sortCohortsBySize(descending: boolean, cohortsToSort: ICohort[]) {
    const chtSizes = await Promise.all(
      cohortsToSort.map(async (cht) => {
        const currSize = await cht.size;
        return { id: cht.id, size: currSize };
      }),
    );
    if (descending) {
      chtSizes.sort((a, b) => this.sortSizeNum(a, b)); // 9 -> 1
    } else {
      chtSizes.sort((a, b) => this.sortSizeNum(b, a)); // 1 -> 9
    }

    cohortsToSort.sort(function (a, b) {
      const aId = a.id;
      const bId = b.id;
      const chtSizesIds = chtSizes.map((elem) => elem.id);
      if (chtSizesIds.indexOf(aId) > chtSizesIds.indexOf(bId)) {
        return 1;
      }
      if (chtSizesIds.indexOf(aId) < chtSizesIds.indexOf(bId)) {
        return -1;
      }
      return 0;
    });
  }

  public orderCohorts() {
    // order input side
    const inputColumns: ADataColumn[] = this.input.columns as any;
    inputColumns.forEach((element) => element.orderCohorts(this.getInputCohorts()));
    // order input side
    const outputColumns: ADataColumn[] = this.output.columns as any;
    const outChts = [].concat(...this.input.cohorts.map((cht) => cht.outputCohorts));
    outputColumns.forEach((element) => element.orderCohorts(outChts));
  }

  public confirmTask() {
    this.search.clear();
    this.removeAttributeColumns();
    this.$node.dispatchEvent(new ConfirmTaskEvent(this.taskParams, this.taskAttributes));
  }

  public setInputCohorts(cohorts: ICohort[]): void {
    this.input.setCohorts(cohorts as IInputCohort[]);
    this.search.updateTasks();
    const outChts = [].concat(...this.input.cohorts.map((cht) => cht.outputCohorts));
    this.setOutputCohorts(outChts);
  }

  public updateInput() {
    this.input.update(); // adjust height after removing output cohorts
  }

  public getInputCohorts(): IInputCohort[] {
    return this.input.cohorts;
  }

  public getOutputCohorts(): ICohort[] {
    return this.output ? this.output.cohorts : [];
  }

  public setOutputCohorts(cohorts: ICohort[]): void {
    this.output.setCohorts(cohorts);
  }

  public setReference(reference: ICohort): void {
    this.reference = reference;
  }

  public addMultipleAttributeColumns(dArray: IAttribute[], allowDuplicates = false, pinned = false) {
    dArray.forEach((d) => this.addAttributeColumn(d, allowDuplicates, pinned));
  }

  public addAttributeColumn(d: IAttribute, allowDuplicates = false, pinned = false) {
    if (this.reference.idColumn.column !== d.id) {
      this.addAttributeColumnForInput(d, allowDuplicates, pinned);
      this.addAttributeColumnForOutput(d, allowDuplicates, pinned);
    }
  }

  public addAttributeColumnForInput(d: IAttribute, allowDuplicates = false, pinned = false) {
    this.input.addAttributeColumn(d, allowDuplicates, pinned); // function is overwritten in and does not need the onInputCohortSide = true variable
  }

  public addAttributeColumnForOutput(d: IAttribute, allowDuplicates = false, pinned = false) {
    this.output.addAttributeColumn(d, allowDuplicates, false, false, pinned);
  }

  public removeAttributeColumns() {
    this.input.getUnpinnedAttributeColumns().forEach((col) => col.close());
    this.output.getUnpinnedAttributeColumns().forEach((col) => col.close());
  }

  public getTaskParams(): ITaskParams[] {
    return this.taskParams;
  }

  public getTaskAttributes(): IAttribute[] {
    return this.taskAttributes;
  }

  private currentEvent = 0;


  async handleAutoFilterEvent(ev: AutoSplitEvent) {
    console.log('handleAutoFilterEvent')

    const currentEv = ++this.currentEvent;
    let outputCohorts: IOutputCohort[] = []; // Stores the output cohorts in correct order, will replace the array currently used
    const taskWithSelectedOutput: ITaskParams[] = [];
    this.taskParams = [];
    this.taskAttributes = ev.detail.desc[0].filter.map((filter) => filter.attr);

    for (const inCht of this.input.cohorts) {
      const chtBins = ev.detail.desc.filter((bin) => inCht.id === bin.cohort.id);
      const outChts: IOutputCohort[] = new Array(Math.max(chtBins.length, 1)).fill(null).map(() => getLoaderCohort(inCht) as unknown as IOutputCohort);

      outChts[outChts.length - 1].isLastOutputCohort = true;
      outChts[0].isFirstOutputCohort = true;

      inCht.outputCohorts = outChts;
      outputCohorts.push(...outChts);
    }

    // Update the input cohorts
    this.updateInput();
    // Add the new cohorts to the output side
    this.setOutputCohorts(outputCohorts);

    // await DebugTools.sleep(1500);
    outputCohorts = [];

    // For each input cohort, create a new output cohort
    for (const cht of this.input.cohorts) {
      log.debug('filter/split event: ', ev);
      cht.outputCohorts = [];
      const chtBins = ev.detail.desc.filter((bin) => cht.id === bin.cohort.id);
      if (chtBins.length > 0) {
        const chtPromises = [];
        for (const bin of chtBins) {
          chtPromises.push(multiAttributeFilter(cht, bin.filter, true));
        }
        // TODO: fix me
        // eslint-disable-next-line no-await-in-loop
        const newChts = await Promise.all(chtPromises);
        if (currentEv !== this.currentEvent) {
          return;
        }

        const chtSizes = [];
        newChts.sort((a, b) => this.sortLabelAlpha(a, b)); // sort output cohorts: A -> Z
        for (const newOutCht of newChts) {
          // Set representation of new cohort
          const layout = new RectangleLayout();
          newOutCht.representation = new RectCohortRep(newOutCht, layout.rowHeight, layout.cohortWidth);
          const sizePromises = [newOutCht.size, this.reference.size];
          chtSizes.push(...sizePromises);
          Promise.all(sizePromises).then(([newSize, refSize]) => {
            newOutCht.representation.setSize(newSize, refSize);
            if (newSize > 0) {
              newOutCht.selected = true;
            }
          });

          newOutCht.setCohortParents([cht]);
          cht.outputCohorts.push(newOutCht); // Add new output cohort to existing cohorts
        }
        // TODO: fix me
        // eslint-disable-next-line no-await-in-loop
        await Promise.all(chtSizes); // wait for the cohort sizes to properly display the representation
      } else {
        cht.outputCohorts.push(getEmptyCohort(cht) as IOutputCohort);
      }

      // the async/time instensive stuff is done now, check if we should continue:
      if (currentEv !== this.currentEvent) {
        return;
      }

      cht.outputCohorts[cht.outputCohorts.length - 1].isLastOutputCohort = true;
      cht.outputCohorts[0].isFirstOutputCohort = true;
      outputCohorts.push(...cht.outputCohorts); // add all output cohorts of current input cohorts (ensures correct order in output side)

      if (chtBins.length > 0) {
        // create current task params
        const currTaskParam: ITaskParams = {
          inputCohorts: [cht],
          outputCohorts: cht.outputCohorts,
          type: ev instanceof FilterEvent ? TaskType.Filter : TaskType.Split,
          label: ev.detail.desc[0].filter.map((filter) => filter.attr.label).join(', '),
        };
        // save all curertn possibel task params
        this.taskParams.push(currTaskParam);
        // check if a task generates selected output cohorts
        if (cht.outputCohorts.filter((elem) => elem.selected === true).length >= 1) {
          // initially onyl selected output cohorts will be shown in overview
          taskWithSelectedOutput.push(currTaskParam);
        }
      }
      // Update the input cohorts
      this.updateInput();

      // show the preview for the current task
      this.$node.dispatchEvent(new PreviewChangeEvent(taskWithSelectedOutput, this.taskAttributes));

      // Add the new cohorts to the output side
      this.setOutputCohorts(outputCohorts);
      ev.detail.desc[0].filter.forEach((filter) => this.addAttributeColumn(filter.attr));
    }
  }

  async handleFilterEvent(ev: FilterEvent | SplitEvent) {
    const currentEv = ++this.currentEvent;
    let outputCohorts: IOutputCohort[] = []; // Stores the output cohorts in correct order, will replace the array currently used
    const taskWithSelectedOutput: ITaskParams[] = [];
    this.taskParams = [];
    this.taskAttributes = ev.detail.desc[0].filter.map((filter) => filter.attr);

    for (const inCht of this.input.cohorts) {
      const chtBins = ev.detail.desc.filter((bin) => inCht.id === bin.cohort.id);
      const outChts: IOutputCohort[] = new Array(Math.max(chtBins.length, 1)).fill(null).map(() => getLoaderCohort(inCht) as unknown as IOutputCohort);

      outChts[outChts.length - 1].isLastOutputCohort = true;
      outChts[0].isFirstOutputCohort = true;

      inCht.outputCohorts = outChts;
      outputCohorts.push(...outChts);
    }

    // Update the input cohorts
    this.updateInput();
    // Add the new cohorts to the output side
    this.setOutputCohorts(outputCohorts);

    // await DebugTools.sleep(1500);
    outputCohorts = [];

    // For each input cohort, create a new output cohort
    for (const cht of this.input.cohorts) {
      log.debug('filter/split event: ', ev);
      cht.outputCohorts = [];
      const chtBins = ev.detail.desc.filter((bin) => cht.id === bin.cohort.id);
      if (chtBins.length > 0) {
        const chtPromises = [];
        for (const bin of chtBins) {
          chtPromises.push(multiAttributeFilter(cht, bin.filter));
        }
        // TODO: fix me
        // eslint-disable-next-line no-await-in-loop
        const newChts = await Promise.all(chtPromises);
        if (currentEv !== this.currentEvent) {
          return;
        }

        const chtSizes = [];
        newChts.sort((a, b) => this.sortLabelAlpha(a, b)); // sort output cohorts: A -> Z
        for (const newOutCht of newChts) {
          // Set representation of new cohort
          const layout = new RectangleLayout();
          newOutCht.representation = new RectCohortRep(newOutCht, layout.rowHeight, layout.cohortWidth);
          const sizePromises = [newOutCht.size, this.reference.size];
          chtSizes.push(...sizePromises);
          Promise.all(sizePromises).then(([newSize, refSize]) => {
            newOutCht.representation.setSize(newSize, refSize);
            if (newSize > 0) {
              newOutCht.selected = true;
            }
          });

          newOutCht.setCohortParents([cht]);
          cht.outputCohorts.push(newOutCht); // Add new output cohort to existing cohorts
        }
        // TODO: fix me
        // eslint-disable-next-line no-await-in-loop
        await Promise.all(chtSizes); // wait for the cohort sizes to properly display the representation
      } else {
        cht.outputCohorts.push(getEmptyCohort(cht) as IOutputCohort);
      }

      // the async/time instensive stuff is done now, check if we should continue:
      if (currentEv !== this.currentEvent) {
        return;
      }

      cht.outputCohorts[cht.outputCohorts.length - 1].isLastOutputCohort = true;
      cht.outputCohorts[0].isFirstOutputCohort = true;
      outputCohorts.push(...cht.outputCohorts); // add all output cohorts of current input cohorts (ensures correct order in output side)

      if (chtBins.length > 0) {
        // create current task params
        const currTaskParam: ITaskParams = {
          inputCohorts: [cht],
          outputCohorts: cht.outputCohorts,
          type: ev instanceof FilterEvent ? TaskType.Filter : TaskType.Split,
          label: ev.detail.desc[0].filter.map((filter) => filter.attr.label).join(', '),
        };
        // save all curertn possibel task params
        this.taskParams.push(currTaskParam);
        // check if a task generates selected output cohorts
        if (cht.outputCohorts.filter((elem) => elem.selected === true).length >= 1) {
          // initially onyl selected output cohorts will be shown in overview
          taskWithSelectedOutput.push(currTaskParam);
        }
      }
    }

    // Update the input cohorts
    this.updateInput();

    // show the preview for the current task
    this.$node.dispatchEvent(new PreviewChangeEvent(taskWithSelectedOutput, this.taskAttributes));

    // Add the new cohorts to the output side
    this.setOutputCohorts(outputCohorts);
    ev.detail.desc[0].filter.forEach((filter) => this.addAttributeColumn(filter.attr));
  }

  showOutput(show: boolean) {
    const hide = !show;
    // this.output.$node.style.display = hide ? 'none' : 'flex'; // setting hidden does not work with flexbox

    this.$node.classList.toggle('no-output', hide);
  }
}
