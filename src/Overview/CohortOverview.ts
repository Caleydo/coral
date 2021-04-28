import {UniqueIdManager} from 'phovea_core';
import {IDatabaseViewDesc} from 'tdp_core';
import tippy from 'tippy.js';
import {Cohort} from '../Cohort';
import {IElement, IOverviewLayout, IRectCohortRep, IRectTaskRep, ITask, ITaskParams, TaskType} from '../CohortInterfaces';
import {RectCohortRep} from '../CohortRepresentations';
import {IAttribute} from '../data/Attribute';
import {RectTaskRep} from '../TaskRepresentations';
import {Task, TaskFilter, TaskSplit} from '../Tasks';
import {log, ScrollLinker} from '../util';
import {CohortRemoveEvent, CohortSelectionEvent, COHORT_REMOVE_EVENT_TYPE, OVERVIEW_PREVIEW_CHANGE_EVENT_TYPE, OVERVIEW_PREVIEW_CONFIRM_EVENT_TYPE, PreviewChangeEvent} from '../utilCustomEvents';
import {niceName} from '../utilLabels';

export class CohortOverview {
  private root: Cohort;
  private elements: Array<IElement>;
  public sizeReference: number;
  public layout: IOverviewLayout;
  public container: HTMLDivElement;
  public viewDescr: IDatabaseViewDesc;
  public taskHistory: Array<Task>;

  private _arrangements: any;
  private _zoomFactor: number;
  private _showTaskHistoryDetails: boolean;
  private _currentPreviewTasks: Task[];
  private _lastAddedTasks: Task[];
  private eventListenerChange;
  private eventListenerConfirm;
  private cohortAppNode: HTMLDivElement;

  constructor(private parent: HTMLDivElement, layout: IOverviewLayout, root: Cohort, viewDescr: IDatabaseViewDesc) {
    this.root = root;
    this.layout = layout;
    this.elements = [root];
    this.taskHistory = [];
    this._arrangements = [];
    this._zoomFactor = 1;
    this._showTaskHistoryDetails = false;
    this._currentPreviewTasks = [];
    this._lastAddedTasks = [];

    if (viewDescr) {
      this.viewDescr = viewDescr;
    }

    this.setReferenceSize();

    this.cohortAppNode = document.querySelector('.cohort_app');
    this.eventListenerChange = (ev) => this.handlePreviewChange(ev as PreviewChangeEvent);
    this.eventListenerConfirm = (ev) => this.handlePreviewConfirm();

    // event listener to change the preview
    this.cohortAppNode.addEventListener(OVERVIEW_PREVIEW_CHANGE_EVENT_TYPE, this.eventListenerChange);
    // event listener to confirm the preview
    this.cohortAppNode.addEventListener(OVERVIEW_PREVIEW_CONFIRM_EVENT_TYPE, this.eventListenerConfirm);

  }

  private setReferenceSize() {
    this.root.size.then((size) => {
      this.sizeReference = size;
      log.info(`Root cohort size is ${this.sizeReference}`);
    });
  }

  private retrieveReferenceSize(): Promise<number> {
    return this.root.size.then((size) => {
      this.sizeReference = size;
      log.info(`Root cohort size is ${this.sizeReference}`);
      return size;
    });
  }

  public destroy() {
    this.elements = [];
    this.elements = null;
    this.root = null;
    this.layout = null;
    this.cohortAppNode.removeEventListener(OVERVIEW_PREVIEW_CHANGE_EVENT_TYPE, this.eventListenerChange);
    this.cohortAppNode.removeEventListener(OVERVIEW_PREVIEW_CONFIRM_EVENT_TYPE, this.eventListenerConfirm);
    while (this.container.hasChildNodes()) {
      this.container.removeChild(this.container.lastChild);
    }
    this.container.remove();
    this.container = null;
  }

  public addElements(elems: Array<IElement>) {
    for (const e of elems) {
      this.addElement(e);
    }
  }

  public addElement(elem: IElement) {
    if (this.elements.map((a) => a.id).indexOf(elem.id) === -1) {
      this.elements.push(elem);
    }
  }

  // maybe remove, and only keep getElementsWithId
  public getElement(elem: IElement): IElement {
    const target = this.elements.filter((e) => e.id === elem.id);
    return target.length === 1 ? target[0] : null;
  }

  // maybe remove, and only keep getElements
  public getElementWithId(eleId: string): IElement {
    const target = this.elements.filter((e) => e.id === eleId);
    return target.length === 1 ? target[0] : null;
  }

  public getLastAddedTasks() {
    return this._lastAddedTasks;
  }

  public clearLastAddedTasks() {
    this._lastAddedTasks = [];
  }

  public executeTask(taskParam: ITaskParams, attributes: IAttribute[], addToTaskHistory: boolean = true): Task {
    log.debug('executeTask: ', taskParam);
    let validType = false;
    const parentCohort: Cohort = taskParam.inputCohorts[0] as Cohort;
    let task: ITask;
    if (taskParam.type === TaskType.Filter) {
      validType = true;
      log.debug('Overview - Filter');
      task = new TaskFilter(`filter-${parentCohort.id}-${UniqueIdManager.getInstance().uniqueId('cht:task')}`, niceName(taskParam.label), attributes);
    } else if (taskParam.type === TaskType.Split) {
      validType = true;
      log.debug('Overview - Split');
      task = new TaskSplit(`split-${parentCohort.id}-${UniqueIdManager.getInstance().uniqueId('cht:task')}`, niceName(taskParam.label), attributes);
    }

    if (validType) {

      parentCohort.children.push(task);
      task.parents = [parentCohort];
      const selectedOutChts = taskParam.outputCohorts.filter((cht) => cht.selected);
      for (const ce of selectedOutChts) {
        ce.parents = [task];
      }

      task.children = selectedOutChts;
      log.debug('execute task: ', {task, selectedOutChts});
      this.addElement(task);
      this.addElements(selectedOutChts);
      if (addToTaskHistory) {
        this.taskHistory.push(task);
      }
    }

    return task;
  }

  private handlePreviewChange(ev: PreviewChangeEvent) {
    const taskParams = ev.detail.params; // task parameters (e.g. column/category to filter)
    const taskAttributes = ev.detail.attributes;
    // log.debug('handle Preview Change: ', {taskParams, taskAttribute, _currentPreviewTasks: this._currentPreviewTasks});
    if (taskAttributes !== null) {
      // only change preview if task was changed
      if (!(this._currentPreviewTasks.length === 0 && taskParams.length === 0)) {
        // change preview
        this.previewChange(taskParams, taskAttributes);
      }
    } else {
      if (!(this._currentPreviewTasks.length === 0 && taskParams.length === 0)) { // avoid clearing if there is nothing to clear
        this.clearPreview();
        this.generateOverview();
      }
    }
  }

  private previewChange(taskParams: ITaskParams[], taskAttributes: IAttribute[]) {
    const tasks: Task[] = [];
    // clear the old preview
    this.clearPreview();
    log.debug('change preview to: ', taskParams, taskAttributes);

    for (const taskParam of taskParams) {
      // execute task but do not add the task to the task history
      const prevTask = this.executeTask(taskParam, taskAttributes, false);
      tasks.push(prevTask);
    }
    // save current task fot the confirmation
    this._currentPreviewTasks.push(...tasks);
    // generate the overview with the new preview tasks
    this.generateOverview();

    // add the preview class to the tasks and cohorts
    for (const prevTask of tasks) {
      // add preview class to task
      // log.debug('prevTask: ', prevTask);
      if (prevTask.representation) {
        prevTask.representation.getRepresentation().classList.add('preview');
      }
      // add preview class to output cohorts
      for (const outCh of prevTask.children) {
        if (prevTask.representation) {
          outCh.representation.getRepresentation().classList.add('preview');
        }
      }
    }
  }

  private handlePreviewConfirm() {
    // add tasks to the task history and remove the preview class from them and their cohorts
    for (const task of this._currentPreviewTasks) {
      this.taskHistory.push(task);
      // remove preview class to task
      task.representation.getRepresentation().classList.remove('preview');
      // remove preview class to output cohorts
      for (const outCh of task.children) {
        outCh.representation.getRepresentation().classList.remove('preview');
      }
    }
    // set the confirmed task as the last added ones
    this._lastAddedTasks = this._currentPreviewTasks;
    // set current tasks of preview to empty
    this._currentPreviewTasks = [];
    this.generateOverview();
  }

  private clearPreview() {
    log.debug('clear old preview');

    for (const task of this._currentPreviewTasks) {
      // remove output cohorts from elements
      const outputCht = task.children;

      for (const outCh of outputCht) {
        // get index of the cohort in the elements array
        const chtIndex = this.elements.findIndex((a) => a.id === outCh.id);
        // remove cohort from the elements arry
        this.elements.splice(chtIndex, 1);
      }

      // remove reference of task from input cohorts
      // get input cohorts
      const inputCht = task.parents;
      for (const inCh of inputCht) {
        // get index of the cohort in the children of the parent
        const childIndex = inCh.children.findIndex((a) => a.id === task.id);
        // remove cohort from the children of parent
        inCh.children.splice(childIndex, 1);
      }

      // remove the task from the elements
      // get index of the cohort in the elements array
      const chtIndex = this.elements.findIndex((a) => a.id === task.id);
      // remove cohort from the elements arry
      this.elements.splice(chtIndex, 1);
    }
    // set current tasks of preview to empty
    this._currentPreviewTasks = [];
  }

  //maybe add a updateOverview function
  public generateOverview() {
    // remove old graph
    if (this.container) {
      while (this.container.firstChild) {
        this.container.removeChild(this.container.firstChild);
      }

      this.container.remove();
    }

    // ------ OVERVIEW GRAPH
    // div wrap container for graph to scroll
    const chtOverviewGraphWrapper: HTMLDivElement = document.createElement('div');
    chtOverviewGraphWrapper.id = 'chtOverviewGraphWrapper';
    this.parent.appendChild(chtOverviewGraphWrapper);
    tippy(chtOverviewGraphWrapper, {
      content: 'Click a cohort to toggle its selection. To directly select only a single cohort, double-click it.',
      delay: [5000, 0]
    });
    this.container = chtOverviewGraphWrapper;
    // div container for grid layout and svg paths
    const chtOverviewGraph: HTMLDivElement = document.createElement('div');
    chtOverviewGraph.id = 'chtOverviewGraph';
    chtOverviewGraphWrapper.appendChild(chtOverviewGraph);

    // div container for grid layout and svg paths
    const chtGraph: HTMLDivElement = document.createElement('div');
    chtGraph.id = 'chtGraph';
    chtOverviewGraph.appendChild(chtGraph);

    // add wheel event to the Overview container
    chtOverviewGraphWrapper.addEventListener('wheel', (event) => {
      const deltaY = (event as WheelEvent).deltaY;
      // only if CTRL-key is pressend in combination with wheel action
      if ((event as WheelEvent).ctrlKey || (event as WheelEvent).altKey) {
        event.preventDefault();
        if (deltaY >= 0) {
          this.zoomOut();
        } else {
          this.zoomIn();
        }
      }
    });
    //create the placement of the elements
    this._generatePlacement(chtGraph);

    //generate the path between the elements
    this._generatePaths(chtGraph);

    // always apply current zoom factor
    chtGraph.style.transform = `scale(${this._zoomFactor})`;
    chtGraph.style.transformOrigin = '0% 0% 0px';

    // add eventlistern for the removal of a cohort
    chtGraph.addEventListener(COHORT_REMOVE_EVENT_TYPE, (event: CohortRemoveEvent) => this.handleRemoveCohort(event));

    // NOTE: commented out for paper ready version
    // create task history
    // this.setupTaskHistory();
  }

  // function to handle the remove cohort event
  private handleRemoveCohort(event: CohortRemoveEvent) {
    const cohort = event.detail.cohort;
    log.debug('cohort to remove: ', cohort);
    // get index of the cohort in the elements array
    const chtIndex = this.elements.findIndex((a) => a.id === cohort.id);
    // remove clone from taskview if selected
    if (cohort.selected) {
      cohort.selected = false; // set selected state to false

      // dispatch event to remove cohort from taskview if it was selected
      cohort.representation.getRepresentation().dispatchEvent(new CohortSelectionEvent(cohort));
    }
    // remove backtracking highlighting
    (cohort.representation as RectCohortRep).removeBacktrackingHighlighting();

    // remove cohort from the elements arry
    this.elements.splice(chtIndex, 1);
    // get all parents (task) of the cohort
    const parents = cohort.parents;

    for (const p of parents) {
      // get index of the cohort in the children of the parent
      const childIndex = p.children.findIndex((a) => a.id === cohort.id);
      // remove cohort from the children of parent (task)
      p.children.splice(childIndex, 1);

      // check if parent (task) has still children (cohorts)
      if (p.children.length === 0) {
        // remove parent (task) from grandparent (cohort)
        const grandparents = p.parents;
        for (const gp of grandparents) {
          const parentIndex = gp.children.findIndex((elem) => elem.id === p.id);
          // remove parent (task) from the children of the grandparent (cohort)
          gp.children.splice(parentIndex, 1);
        }

        // remove the task from task history
        const taskHistIndex = this.taskHistory.findIndex((elem) => elem.id === p.id);
        this.taskHistory.splice(taskHistIndex, 1);

        // remove the task from element array
        const taskElemIndex = this.elements.findIndex((elem) => elem.id === p.id);
        this.elements.splice(taskElemIndex, 1);
      }
    }

    this.generateOverview();
  }

  // sets up the task history with details and adds the tasks
  private setupTaskHistory() {
    // div container for the task history and details
    const taskSideBar: HTMLDivElement = document.createElement('div');
    taskSideBar.id = 'taskSideBar';
    this.parent.appendChild(taskSideBar);

    // -- Details to the tasks
    // div container for the details to the tasks
    const taskDetails: HTMLDivElement = document.createElement('div');
    taskDetails.id = 'taskDetails';
    taskDetails.classList.add('taskDetails', 'task-sidebar-column');
    taskDetails.classList.remove('hide');
    if (!this._showTaskHistoryDetails) {
      taskDetails.classList.add('hide');
    }
    taskSideBar.appendChild(taskDetails);

    // header of the task details column
    const taskDetailsHeader: HTMLDivElement = document.createElement('div');
    taskDetailsHeader.id = 'taskDetailsHeader';
    taskDetailsHeader.classList.add('task-history-header');
    taskDetails.appendChild(taskDetailsHeader);

    // wrap container with all task detail representations
    const taskDetailsStackWrapper: HTMLDivElement = document.createElement('div');
    taskDetailsStackWrapper.id = 'taskDetailsStackWrapper';
    taskDetailsStackWrapper.classList.add('task-history-stack-wrapper');
    taskDetails.appendChild(taskDetailsStackWrapper);

    // container with all task detail representations
    const taskDetailsStack: HTMLDivElement = document.createElement('div');
    taskDetailsStack.id = 'taskDetailsStack';
    taskDetailsStack.classList.add('task-history-stack');
    taskDetailsStackWrapper.appendChild(taskDetailsStack);


    // -- History of tasks
    // div container for the tasks
    const taskHistory: HTMLDivElement = document.createElement('div');
    taskHistory.id = 'taskHistory';
    taskHistory.classList.add('taskHistory', 'task-sidebar-column');
    taskSideBar.appendChild(taskHistory);

    // header of the task history
    const taskHistoryHeader: HTMLDivElement = document.createElement('div');
    taskHistoryHeader.id = 'taskHistoryHeader';
    taskHistoryHeader.classList.add('task-history-header');

    // button to show/hide details
    const detailsToggleBtn = document.createElement('a');
    detailsToggleBtn.id = 'btnDetailsToggle';
    taskHistoryHeader.appendChild(detailsToggleBtn);
    detailsToggleBtn.addEventListener('click', (event) => {
      this._showTaskHistoryDetails = !this._showTaskHistoryDetails; // toggle value
      if (this._showTaskHistoryDetails) {
        taskDetails.classList.remove('hide');
        detailsToggleBtn.classList.add('close-detail');
      } else {
        taskDetails.classList.add('hide');
        detailsToggleBtn.classList.remove('close-detail');
      }
    });
    taskHistory.appendChild(taskHistoryHeader);

    // wrap container with all task representations
    const taskHistoryStackWrapper: HTMLDivElement = document.createElement('div');
    taskHistoryStackWrapper.id = 'taskHistoryStackWrapper';
    taskHistoryStackWrapper.classList.add('task-history-stack-wrapper');
    taskHistory.appendChild(taskHistoryStackWrapper);

    // container with all task representations
    const taskHistoryStack: HTMLDivElement = document.createElement('div');
    taskHistoryStack.id = 'taskHistoryStack';
    taskHistoryStack.classList.add('task-history-stack');
    taskHistoryStackWrapper.appendChild(taskHistoryStack);

    // --- add the task elemtents
    // add all tasks and their details to the stacks
    for (const t of this.taskHistory) {
      const rep = t.representation.getClone();
      const detail = this._createDetailForTaskInHistory(t);
      taskHistoryStack.appendChild(rep);
      taskDetailsStack.appendChild(detail);
      this.handleHighlightingOnHover(t, rep, detail);
    }

    // add SrollLink so both wrapper are in sync, when one is scrolled
    const scrollLink = new ScrollLinker(taskDetailsStackWrapper, taskHistoryStackWrapper);
    // alway scroll to the botton -> last elemet added is shown
    taskHistoryStackWrapper.scrollTop = taskHistoryStackWrapper.scrollHeight;
  }

  // add the event listeners to the task elements in the task history
  // to add highlighting to the task and task details and the elemnts in the overview graph
  private handleHighlightingOnHover(task: Task, taskElem: HTMLDivElement, detailElem: HTMLDivElement) {
    // get all paths
    const svgContainer = document.getElementById('svg-path-container');
    const pathsTaskIn = Array.from(svgContainer.querySelectorAll(`.path-ep-in-${task.id}`)) as SVGPathElement[];
    const pathsTaskOut = Array.from(svgContainer.querySelectorAll(`.path-ep-out-${task.id}`)) as SVGPathElement[];
    const pathsTask = pathsTaskIn.concat(pathsTaskOut);

    // hover on taskElem
    taskElem.addEventListener('mouseenter', (event) => {
      event.stopPropagation();
      // elements themself
      taskElem.classList.add('task-hist-element-highlight');
      detailElem.classList.add('task-hist-element-highlight');
      // task + parent/child in overview
      this.addHighlightingToElements(task);
      // paths from task to cohorts
      this.addHighligthingToPaths(pathsTask);
    });
    taskElem.addEventListener('mouseleave', (event) => {
      event.stopPropagation();
      // elements themself
      taskElem.classList.remove('task-hist-element-highlight');
      detailElem.classList.remove('task-hist-element-highlight');
      // task + parent/child in overview
      this.removeHighlightingFromElements(task);
      // paths from task to cohorts
      this.removeHighligthingFromPaths(pathsTask);
    });

    // hover on detailElem
    detailElem.addEventListener('mouseenter', (event) => {
      event.stopPropagation();
      // elements themself
      detailElem.classList.add('task-hist-element-highlight');
      taskElem.classList.add('task-hist-element-highlight');
      // task + parent/child in overview
      this.addHighlightingToElements(task);
      // paths from task to cohorts
      this.addHighligthingToPaths(pathsTask);
    });
    detailElem.addEventListener('mouseleave', (event) => {
      event.stopPropagation();
      // elements themself
      detailElem.classList.remove('task-hist-element-highlight');
      taskElem.classList.remove('task-hist-element-highlight');
      // task + parent/child in overview
      this.removeHighlightingFromElements(task);
      // paths from task to cohorts
      this.removeHighligthingFromPaths(pathsTask);
    });

  }

  private addHighligthingToPaths(paths: SVGPathElement[]) {
    for (const p of paths) {
      p.classList.add('overview-path-highlight');
    }
  }

  private removeHighligthingFromPaths(paths: SVGPathElement[]) {
    for (const p of paths) {
      p.classList.remove('overview-path-highlight');
    }
  }

  // adds the highlighting class to the overview graph elements
  private addHighlightingToElements(task: Task) {
    // input cohorts
    for (const inCh of task.parents) {
      inCh.representation.getRepresentation().classList.add('overview-element-highlight');
    }
    // task
    task.representation.getRepresentation().classList.add('overview-element-highlight');
    // output cohorts
    for (const outCh of task.children) {
      outCh.representation.getRepresentation().classList.add('overview-element-highlight');
    }
  }

  // removes the highlighting class from the overview graph elements
  private removeHighlightingFromElements(task: Task) {
    // input cohorts
    for (const inCh of task.parents) {
      inCh.representation.getRepresentation().classList.remove('overview-element-highlight');
    }
    // task
    task.representation.getRepresentation().classList.remove('overview-element-highlight');
    // output cohorts
    for (const outCh of task.children) {
      outCh.representation.getRepresentation().classList.remove('overview-element-highlight');
    }
  }

  // creates the detail element fot a task
  private _createDetailForTaskInHistory(task: Task): HTMLDivElement {
    const divDetails = document.createElement('div');
    divDetails.classList.add('task-details');
    // const input = task.parents.map((p) => p.label).join(',');
    // const output = task.children.map((p) => p.label).join(', ');
    // const pAttribute = document.createElement('p');
    // pAttribute.innerHTML = '<span>Attribute:</span> ' + task.label;
    // divDetails.appendChild(pAttribute);
    // const pInput = document.createElement('p');
    // pInput.innerHTML = '<span>Input:</span> ' + input;
    // divDetails.appendChild(pInput);
    // const pOutput = document.createElement('p');
    // pOutput.innerHTML = '<span>Output:</span> ' + output;
    // divDetails.appendChild(pOutput);
    // return divDetails;


    divDetails.classList.add('task-details');
    const inputs = task.parents as Cohort[];
    const outputs = task.children as Cohort[];
    const divAttribute = document.createElement('div');
    divAttribute.classList.add('task-detail-attribute');
    divAttribute.innerHTML = '<span>Attribute:</span> ' + task.label;
    divDetails.appendChild(divAttribute);


    const divInput = document.createElement('div');
    divInput.classList.add('task-detail-cohort');

    const divInputLabel = document.createElement('div');
    divInputLabel.classList.add('task-detail-label');
    divInputLabel.innerHTML = `Input (${inputs.length}):`;
    divInput.appendChild(divInputLabel);
    for (const ic of inputs) {
      const currIn = document.createElement('div');
      currIn.classList.add('task-detail-icon');
      currIn.title = `Cohort: ${ic.label}\nSize: ${ic.getRetrievedSize()}`;
      divInput.appendChild(currIn);
    }
    divDetails.appendChild(divInput);


    const divOutput = document.createElement('div');
    divOutput.classList.add('task-detail-cohort');

    const divOutputLabel = document.createElement('div');
    divOutputLabel.classList.add('task-detail-label');
    divOutputLabel.innerHTML = `Output (${outputs.length}):`;
    divOutput.appendChild(divOutputLabel);
    for (const oc of outputs) {
      const currOut = document.createElement('div');
      currOut.classList.add('task-detail-icon');
      currOut.title = `Cohort: ${oc.label}\nSize: ${oc.getRetrievedSize()}`;
      divOutput.appendChild(currOut);
    }
    divDetails.appendChild(divOutput);

    return divDetails;
  }


  private _generatePlacement(containerCSSGrid: HTMLDivElement) {
    if (this.elements && this.elements.length > 0) {
      // generate the layout assignment of the elements
      this._arrangements = this.layout.createLayout(this.root);
      log.debug('layout finished');
      log.debug('cohortOverview arrangment: ', this._arrangements);

      while (containerCSSGrid.firstChild) {
        containerCSSGrid.removeChild(containerCSSGrid.firstChild);
      }
      const numCol = Math.max(...this._arrangements.map((a) => a.column));
      const numRow = Math.max(...this._arrangements.map((a) => a.row));

      // define CSS grid for the container
      this.layout.setContainerGrid(containerCSSGrid, numCol, numRow);
      const rowHeight = this.layout.rowHeight;
      const chtWidth = this.layout.cohortWidth;
      const opWidth = this.layout.taskWidth;
      for (const elem of this.elements) {
        if (elem.representation === null) {
          if (elem instanceof Task) {
            elem.representation = new RectTaskRep(elem, rowHeight, opWidth);
          } else if (elem instanceof Cohort) {
            elem.representation = new RectCohortRep(elem, rowHeight, chtWidth);
          }
        }

        const elemPos = this._arrangements.find((a) => a.elemID === elem.id);
        log.debug('current layout: ', elemPos);
        const tmpNode = elem.representation.getRepresentation();
        // assign CSS classes to elements
        this.layout.setPositionInGrid(tmpNode, elemPos.column, elemPos.row);

        containerCSSGrid.appendChild(tmpNode);
        if (elem instanceof Task) {
          if (elem.type === TaskType.Filter) {
            (elem.representation as IRectTaskRep).setInformation(elem.label, 'filter');
          } else {
            (elem.representation as IRectTaskRep).setInformation(elem.label, 'split');
          }
        } else {
          (elem.representation as IRectCohortRep).setLabel((elem as Cohort).labelOne, (elem as Cohort).labelTwo);
          (elem as Cohort).size.then(async (size) => {
            let refSize = this.sizeReference;
            if (refSize === null || refSize === undefined) {
              refSize = await this.retrieveReferenceSize();
              this.sizeReference = refSize;
            }
            log.debug(`Size of cohort ${size} while refernce is ${this.sizeReference}`);
            (elem.representation as IRectCohortRep).setSize(size, this.sizeReference);
          });
        }
      }
      // clear highlighting when updating overview
      const allHovered = Array.from(containerCSSGrid.querySelectorAll('.overview-element-highlight'));
      for (const elemH of allHovered) {
        elemH.classList.remove('overview-element-highlight');
      }
    }
  }

  private _generatePaths(containerCSSGrid: HTMLDivElement) {
    // create a Overview Layout mit grid sizes and arrangement
    // get dimensions of the HTML/CSS GridLayout
    const gridDimension = document.getElementById(containerCSSGrid.id).getBoundingClientRect();
    const svgElement: SVGElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svgElement.setAttribute('id', 'svg-path-container');
    svgElement.setAttribute('width', '' + gridDimension.width);
    svgElement.setAttribute('height', '' + gridDimension.height);
    containerCSSGrid.appendChild(svgElement);

    const chtOverviewGraph = document.getElementById('chtOverviewGraph').getBoundingClientRect();
    log.debug('chtOverviewGraph: ', chtOverviewGraph);

    if (this.elements) {
      for (const ceParent of this.elements) {
        for (const ceChild of ceParent.children) {
          log.debug('svg-line: ceParent: ', ceParent, ' | ceChild: ', ceChild);
          const parent = document.getElementById(ceParent.id).getBoundingClientRect();
          const child = document.getElementById(ceChild.id).getBoundingClientRect();
          log.debug('svg-line: parent: ', parent, ' | child: ', child);

          // get cohort bars size
          const cohort = ceParent instanceof Cohort ? document.getElementById(ceParent.id).querySelector('.rectCohort-sizeBar') : document.getElementById(ceChild.id).querySelector('.rectCohort-sizeBar');
          const barHeight = cohort.getBoundingClientRect().height;

          const x1 = parent.left + (parent.width) - chtOverviewGraph.left;
          let y1 = parent.top + (parent.height / 2) - chtOverviewGraph.top;
          const x2 = child.left - chtOverviewGraph.left;
          let y2 = child.top + (child.height / 2) - chtOverviewGraph.top;

          // 2px because of the upper border
          y1 = y1 + 1;
          y2 = y2 + 1;

          const mx1 = (x2 - x1) / 2 + x1;
          const my1 = y1;
          const mx2 = (x2 - x1) / 2 + x1;
          const my2 = y2;
          const d = 'M ' + x1 + ' ' + y1 +
            ' C ' + mx1 + ' ' + my1 + ', ' + mx2 + ' ' + my2 + ', ' + x2 + ' ' + y2;

          const currPath: SVGPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          currPath.setAttribute('id', 'path-' + ceParent.id + '-to-' + ceChild.id);
          // currPath.setAttribute('class', 'svg-path');
          currPath.classList.add('svg-path', `path-ep-out-${ceParent.id}`, `path-ep-in-${ceChild.id}`);
          currPath.setAttribute('d', d);
          currPath.setAttribute('stroke-width', '5px');
          svgElement.appendChild(currPath);
        }
      }
    }
  }

  public zoomIn() {
    this._zoomFactor = Math.min(this._zoomFactor + 0.1, 3.0);
    this._zoom();
  }

  public zoomOut() {
    this._zoomFactor = Math.max(this._zoomFactor - 0.1, 0.2);
    this._zoom();
  }

  private _zoom() {
    const cssGrid: HTMLDivElement = this.container.querySelector('div#chtGraph');
    cssGrid.style.transform = `scale(${this._zoomFactor})`;
    cssGrid.style.transformOrigin = '0% 0% 0px';
  }

}
