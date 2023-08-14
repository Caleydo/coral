import { IObjectRef, ObjectRefUtils, ProvenanceGraph, UniqueIdManager, IDatabaseViewDesc } from 'tdp_core';
import tippy from 'tippy.js';
import type { CoralApp } from '../app/CoralApp';
import { Cohort, createCohortFromDB } from '../Cohort';
import {
  EElementProvType,
  ICohort,
  IElement,
  IElementProvJSON,
  IOverviewLayout,
  IRectCohortRep,
  IRectTaskRep,
  ITask,
  ITaskParams,
  TaskType,
} from '../app/interfaces';
import { RectCohortRep } from '../CohortRepresentations';
import { getDBCohortData } from '../base/rest';
import { RectTaskRep } from '../TaskRepresentations';
import { createTaskFromProvJSON, Task, TaskFilter, TaskSplit } from '../Tasks';
import { deepCopy, log } from '../util';
import { ScrollLinker } from '../utils/ScrollLinker';
import {
  CohortRemoveEvent,
  CohortSelectionEvent,
  COHORT_REMOVE_EVENT_TYPE,
  OVERVIEW_PREVIEW_CHANGE_EVENT_TYPE,
  OVERVIEW_PREVIEW_CONFIRM_EVENT_TYPE,
  PreviewChangeEvent,
  TaskRemoveEvent,
  TASK_REMOVE_EVENT_TYPE,
} from '../base/events';
import { niceName } from '../utils/labels';
import { RectangleLayout } from './OverviewLayout';
import { IAttribute } from '../data/IAttribute';
import { addOverviewCohortAction, removeOverviewCohortAction } from '../Provenance/CohortEV';

export class CohortOverview {
  private root: ICohort;

  private rootDBid: number;

  private elements: Array<IElement> = [];

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

  private _elementsAsJSON: IElementProvJSON[];

  public graph: ProvenanceGraph;

  public readonly ref: IObjectRef<CohortOverview>;

  public readonly appRef: IObjectRef<CoralApp>;

  private refName = 'CohortApp-Overview';

  private _reference: ICohort;

  constructor(
    private parent: HTMLDivElement,
    graph: ProvenanceGraph,
    ref: IObjectRef<CoralApp>,
    layout: IOverviewLayout,
    root: ICohort,
    viewDescr: IDatabaseViewDesc,
  ) {
    this.root = root;
    this.rootDBid = root.dbId;
    this._reference = root;
    this.layout = layout;
    this.elements = [root];
    this.taskHistory = [];
    this._arrangements = [];
    this._zoomFactor = 1;
    this._showTaskHistoryDetails = false;
    this._currentPreviewTasks = [];
    this._lastAddedTasks = [];

    this.graph = graph;
    this.appRef = ref;
    this.ref = this.graph.findOrAddObject(this, this.refName, ObjectRefUtils.category.visual); // cat.visual = it is a visual operation
    // this.ref = ObjectRefUtils.objectRef(this, this.refName, ObjectRefUtils.category.visual, 'coral_123');

    if (viewDescr) {
      this.viewDescr = viewDescr;
    }

    this.setReferenceSize();
    this.updateJSONElements();

    this.cohortAppNode = document.querySelector('.cohort_app');
    this.eventListenerChange = (ev) => this.handlePreviewChange(ev as PreviewChangeEvent);
    this.eventListenerConfirm = (ev) => this.handlePreviewConfirm();

    // event listener to change the preview
    this.cohortAppNode.addEventListener(OVERVIEW_PREVIEW_CHANGE_EVENT_TYPE, this.eventListenerChange);
    // event listener to confirm the preview
    this.cohortAppNode.addEventListener(OVERVIEW_PREVIEW_CONFIRM_EVENT_TYPE, this.eventListenerConfirm);
  }

  // private static generate_hash(desc: IPluginDesc, selection: ISelection) {
  private static generate_hash(viewDescr: IDatabaseViewDesc) {
    // const s = (selection.idtype ? selection.idtype.id : '') + 'r' + (selection.range.toString());
    return 'test_123';
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

  public getElementsAsJSON(): IElementProvJSON[] {
    return this._elementsAsJSON;
  }

  /**
   * Updates the '_elementsAsJSON' array.
   * Converts the current state of the 'elements' array into array of JSON objects
   * and saves it in the '_elementsAsJSON' array
   */
  public updateJSONElements() {
    this._elementsAsJSON = [];
    const jsonElem = this.convertElementsToJSON();
    this._elementsAsJSON.push(...jsonElem);
  }

  /**
   * Converts the current 'elements' array into JSON objects
   * @returns array of JSON objects based on the 'elements' array
   */
  public convertElementsToJSON(): IElementProvJSON[] {
    const jsonElem = this.elements.map((elem) => {
      const jConf = elem.toProvenanceJSON();
      if (jConf.id === String(this.rootDBid)) {
        jConf.attrAndValues.isRoot = true;
      }
      return jConf;
    });
    return jsonElem;
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

  public removeElement(elem: IElement) {
    this.removeElementWithID(elem.id);
  }

  public removeElementWithID(eleId: string) {
    // get index of the element in the elements array
    const eleIdx = this.elements.findIndex((a) => a.id === eleId);
    if (eleIdx !== -1) {
      // remove element from the elements arry
      this.elements.splice(eleIdx, 1);
    }
  }

  public removeElements(elems: IElement[]) {
    for (const e of elems) {
      this.removeElement(e);
    }
  }

  // maybe remove, and only keep getElementsWithId
  public getElement(elem: IElement): IElement {
    if (elem !== null) {
      const eleId = elem.id;
      return this.getElementWithId(eleId);
    }
    return null;
  }

  // maybe remove, and only keep getElements
  public getElementWithId(eleId: string): IElement {
    if (this.elements !== null) {
      const target = this.elements.filter((e) => e.id === eleId);
      return target.length === 1 ? target[0] : null;
    }
    return null;
  }

  public getLastAddedTasks() {
    return this._lastAddedTasks;
  }

  public clearLastAddedTasks() {
    this._lastAddedTasks = [];
  }

  public executeTask(taskParam: ITaskParams, attributes: IAttribute[], addToTaskHistory = true): Task {
    log.debug('executeTask: ', taskParam);
    let validType = false;
    const parentCohort: ICohort = taskParam.inputCohorts[0];
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
      log.debug('execute task: ', { task, selectedOutChts });
      this.addElement(task);
      this.addElements(selectedOutChts);
      if (addToTaskHistory) {
        this.taskHistory.push(task);
      }
      // console.log('execute Task - task: ', task);
      // console.log('execute Task - elements: ', this.elements);
    }

    return task;
  }

  private async handlePreviewChange(ev: PreviewChangeEvent) {
    // console.log('handlePreviewCHange: ', ev);

    const taskParams = ev.detail.params; // task parameters (e.g. column/category to filter)
    const taskAttributes = ev.detail.attributes;
    // log.debug('handle Preview Change: ', {taskParams, taskAttribute, _currentPreviewTasks: this._currentPreviewTasks});
    if (taskAttributes !== null) {
      // only change preview if task was changed
      if (!(this._currentPreviewTasks.length === 0 && taskParams.length === 0)) {
        // change preview
        this.previewChange(taskParams, taskAttributes);
      }
    } else if (!(this._currentPreviewTasks.length === 0 && taskParams.length === 0)) {
      // avoid clearing if there is nothing to clear
      this.clearPreview();
      this.generateOverview();
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

  private handlePreviewConfirm() {
    // add tasks to the task history and remove the preview class from them and their cohorts
    for (const task of this._currentPreviewTasks) {
      this.taskHistory.push(task);
      // remove preview class to task
      if (task.representation) {
        task.representation.getRepresentation().classList.remove('preview');
      }
      // remove preview class to output cohorts
      for (const outCh of task.children) {
        outCh.representation.getRepresentation().classList.remove('preview');
      }
    }
    // set the confirmed task as the last added ones
    this._lastAddedTasks = this._currentPreviewTasks;
    // set current tasks of preview to empty
    this._currentPreviewTasks = [];

    const oldElements = deepCopy(this._elementsAsJSON);
    this.updateJSONElements();
    const newElements = deepCopy(this._elementsAsJSON);

    // console.log('call "Add Cohort(s)" provenance function with: ', {oldElements, newElements});
    this.graph.push(addOverviewCohortAction(this.ref, this.appRef, newElements, oldElements));
    // this.generateOverview();
  }

  public async generateOverviewProv(jsonElements: IElementProvJSON[] = []) {
    const provElements: IElement[] = [];
    // check if the elements and the jsonElements are the same
    const porvElemIDs = jsonElements.map((elem) => elem.id);
    // const copyElem = this.elements !== null ? this.elements : [];
    const elemIDs = this.elements !== null ? this.elements.map((elem) => elem.id) : [];

    const sizeEquals = elemIDs.length === porvElemIDs.length;
    const containsAll = elemIDs.every((e) => porvElemIDs.includes(e));
    // console.log('check all Elements exist: ', {porvElemIDs, elemIDs, sizeEquals, containsAll});
    // reduced double loading when the no switch the the cohort evolution tree state has been made
    if (!(containsAll && sizeEquals)) {
      // let rootProv = null;
      // let foundRoot = false;
      // console.log('root element found (BEFORE): ', foundRoot);

      const jsonElementsToCreate: IElementProvJSON[] = [];

      // check which elemets already exist and only create the non-existing ones
      for (const jElem of jsonElements) {
        const eid = jElem.id;
        const existingElem = this.getElementWithId(eid);
        if (existingElem === null) {
          // element doesn't exist -> query DB
          jsonElementsToCreate.push(jElem);
        } else {
          // element exist -> add to provElements
          // and clear parents and children arrays
          existingElem.children = [];
          existingElem.parents = [];
          provElements.push(existingElem);
        }
      }

      // create missing Cohorts
      const jsonCohorts = jsonElementsToCreate.filter((elem) => elem.type === EElementProvType.Cohort);
      const cohortIDs: number[] = jsonCohorts.map((elem) => Number(elem.id));
      // get cohort DB data
      const chtSizes = [];
      if (cohortIDs.length > 0) {
        const dbCohortInfos = await getDBCohortData({ cohortIds: cohortIDs });
        for (const cInfo of dbCohortInfos) {
          const chtId = cInfo.id;
          const jsonCht = jsonCohorts.filter((elem) => elem.id === String(chtId))[0];
          const provJSON = {
            idColumn: jsonCht.attrAndValues.idColumn,
            idType: jsonCht.attrAndValues.idType,
            values: jsonCht.attrAndValues.values,
            view: jsonCht.attrAndValues.view,
            database: jsonCht.attrAndValues.database,
            selected: jsonCht.attrAndValues.selected,
            isRoot: jsonCht.attrAndValues.isRoot,
          };

          const newCohort = createCohortFromDB(cInfo, provJSON);
          // Set representation of new cohort
          const layout = new RectangleLayout();
          newCohort.representation = new RectCohortRep(newCohort, layout.rowHeight, layout.cohortWidth);

          provElements.push(newCohort);
        }
      }

      // console.log('root element found (AFTER): ', foundRoot);

      // create missing Tasks
      const jsonTasks = jsonElementsToCreate.filter((elem) => elem.type !== EElementProvType.Cohort);
      for (const jsonT of jsonTasks) {
        const newTask = createTaskFromProvJSON(jsonT);
        provElements.push(newTask);
      }

      // set parents and children
      for (const jsonElem of jsonElements) {
        const parentsIDs = jsonElem.parent;
        const childrenIDs = jsonElem.children;
        const currentElement = provElements.filter((elem) => elem.id === jsonElem.id)[0];

        // set parents (set child of parent too)
        for (const pId of parentsIDs) {
          // check if parent is already part of the parents array
          const existingPIDs = currentElement.parents.map((elem) => elem.id);
          if (existingPIDs.indexOf(pId) === -1) {
            const currP = provElements.filter((elem) => elem.id === pId)[0];
            // set parent for current element
            currentElement.parents.push(currP);
            // set child of parent element
            currP.children.push(currentElement);
          }
        }

        // set children (set parent of children too)
        for (const cId of childrenIDs) {
          // check if child is already part of the children array
          const existingCIDs = currentElement.children.map((elem) => elem.id);
          if (existingCIDs.indexOf(cId) === -1) {
            const currC = provElements.filter((elem) => elem.id === cId)[0];
            // set child for current element
            currentElement.children.push(currC);
            // set parents of child element
            currC.parents.push(currentElement);
          }
        }
      }

      // console.log('elements from JSON - provElements: ', {provElements, rootDBid: this.rootDBid});

      // deselect the old cohorts
      // console.log('deselect old cohorts');
      const chtIDselected = [];
      if (this.elements) {
        for (const elem of this.elements) {
          if (elem instanceof Cohort) {
            if ((elem as Cohort).selected === true) {
              chtIDselected.push(elem.id);
              this.parent.dispatchEvent(new CohortSelectionEvent(elem));
            }
          }
        }
      }

      // set the newly created 'provElements' as the new 'elements'
      this.elements = [];
      this.elements = provElements;

      // set root cohort
      // console.log('Elements to find the root cohort ', {thisElements: this.elements, rootDBid: this.rootDBid, provElements});
      this.root = provElements.filter((elem) => elem.id === String(this.rootDBid))[0] as Cohort;

      // set root as reference, too
      this._reference = this.root;

      // get sizes for the cohorts and their representation
      // console.log('get sizes for the new cohorts and their representation');
      for (const elem of provElements) {
        if (elem instanceof Cohort) {
          const sizePromises = [elem.size, this._reference.size];
          chtSizes.push(...sizePromises);
          Promise.all(sizePromises).then(([newSize, refSize]) => {
            elem.representation.setSize(newSize, refSize);
          });
        }
      }

      await Promise.all(chtSizes); // wait for the cohort sizes to properly display the representation

      // update bloodline for cohorts
      for (const elem of provElements) {
        if (elem instanceof Cohort) {
          elem.updateBloodline();
        }
      }
    }

    // console.log('elemets after Prov generation: ', this.getElementsAsJSON());
    this.generateOverview();
  }

  // maybe add a updateOverview function
  public generateOverview() {
    // console.log('current elements in generateOverview function', this.elements);
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
      delay: [5000, 0],
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
      const { deltaY } = event as WheelEvent;
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
    // create the placement of the elements
    this._generatePlacement(chtGraph);

    // generate the path between the elements
    this._generatePaths(chtGraph);

    // always apply current zoom factor
    chtGraph.style.transform = `scale(${this._zoomFactor})`;
    chtGraph.style.transformOrigin = '0% 0% 0px';

    // add eventlistern for the removal of a cohort
    chtGraph.addEventListener(COHORT_REMOVE_EVENT_TYPE, (event: CohortRemoveEvent) => this.handleRemoveCohort(event));

    // add eventlistern for the removal of a task
    chtGraph.addEventListener(TASK_REMOVE_EVENT_TYPE, (event: TaskRemoveEvent) => this.handleRemoveTask(event));

    // NOTE: commented out for paper ready version
    // create task history
    // this.setupTaskHistory();
  }

  private getAllChildren(elementsToRemove: IElement[], elem: IElement): IElement[] {
    const { children } = elem;
    for (const c of children) {
      if (elementsToRemove.map((a) => a.id).indexOf(c.id) === -1) {
        elementsToRemove.push(c);
      }
    }
    for (const chi of children) {
      const grandchildren = this.getAllChildren(elementsToRemove, chi);
      for (const gc of grandchildren) {
        if (elementsToRemove.map((a) => a.id).indexOf(gc.id) === -1) {
          elementsToRemove.push(gc);
        }
      }
    }

    return elementsToRemove;
  }

  // function to handle the remove cohort event
  private handleRemoveTask(event: TaskRemoveEvent) {
    const { task } = event.detail;

    // remove all child elements
    const elementsToRemove = [];
    this.getAllChildren(elementsToRemove, task);
    // console.log('remove all children: ', elementsToRemove);
    // get selected cohorts
    const elemRemoveSelected = elementsToRemove.filter((elem) => {
      if (elem instanceof Cohort) {
        return elem.selected;
      }
      return false;
    });
    // deselect selected children
    for (const elemRS of elemRemoveSelected) {
      elemRS.selected = false; // set selected state to false
      // dispatch event to remove cohort from taskview if it was selected
      elemRS.representation.getRepresentation().dispatchEvent(new CohortSelectionEvent(elemRS));
    }
    // remove all child elements
    this.removeElements(elementsToRemove);

    // remove task from the elements arry
    this.removeElement(task);

    // get all parents (cohorts) of the task
    const { parents } = task;

    for (const p of parents) {
      // get index of the task in the children of the parent
      const childIndex = p.children.findIndex((a) => a.id === task.id);
      // remove task from the children of parent (cohort)
      p.children.splice(childIndex, 1);
    }

    const oldElements = deepCopy(this._elementsAsJSON);
    this.updateJSONElements();
    const newElements = deepCopy(this._elementsAsJSON);

    // console.log('call "Remove Cohort" provenance function with: ',{oldElements, newElements});
    this.graph.push(removeOverviewCohortAction(this.ref, this.appRef, newElements, oldElements));
  }

  // function to handle the remove cohort event
  private handleRemoveCohort(event: CohortRemoveEvent) {
    const { cohort } = event.detail;
    // log.debug('cohort to remove: ', cohort);
    // remove clone from taskview if selected
    if (cohort.selected) {
      cohort.selected = false; // set selected state to false

      // dispatch event to remove cohort from taskview if it was selected
      cohort.representation.getRepresentation().dispatchEvent(new CohortSelectionEvent(cohort));
    }
    // remove backtracking highlighting
    (cohort.representation as RectCohortRep).removeBacktrackingHighlighting();

    // remove all child elements
    const elementsToRemove = [];
    this.getAllChildren(elementsToRemove, cohort);
    // console.log('remove all children: ', elementsToRemove);
    // get selected cohorts
    const elemRemoveSelected = elementsToRemove.filter((elem) => {
      if (elem instanceof Cohort) {
        return elem.selected;
      }
      return false;
    });
    // deselect selected children
    for (const elemRS of elemRemoveSelected) {
      elemRS.selected = false; // set selected state to false
      // dispatch event to remove cohort from taskview if it was selected
      elemRS.representation.getRepresentation().dispatchEvent(new CohortSelectionEvent(elemRS));
    }
    // remove all child elements
    this.removeElements(elementsToRemove);

    // remove cohort from the elements arry
    this.removeElement(cohort);

    // get all parents (task) of the cohort
    const { parents } = cohort;

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

    const oldElements = deepCopy(this._elementsAsJSON);
    this.updateJSONElements();
    const newElements = deepCopy(this._elementsAsJSON);

    // console.log('call "Remove Cohort" provenance function with: ',{oldElements, newElements});
    this.graph.push(removeOverviewCohortAction(this.ref, this.appRef, newElements, oldElements));
    // this.generateOverview();
  }

  private _generatePlacement(containerCSSGrid: HTMLDivElement) {
    if (this.elements && this.elements.length > 0) {
      // generate the layout assignment of the elements
      this._arrangements = this.layout.createLayout(this.root);
      log.debug('Layout for placement finished: ', { root: this.root, elements: this.elements, arrangement: this._arrangements });
      // console.log('Layout for placement finished: ', {root: this.root, elements: this.elements, arrangement: this._arrangements});

      while (containerCSSGrid.firstChild) {
        containerCSSGrid.removeChild(containerCSSGrid.firstChild);
      }
      const numCol = Math.max(...this._arrangements.map((a) => a.column));
      const numRow = Math.max(...this._arrangements.map((a) => a.row));

      // define CSS grid for the container
      this.layout.setContainerGrid(containerCSSGrid, numCol, numRow);
      const { rowHeight } = this.layout;
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
        log.debug('current element placement: ', elemPos);
        // console.log('current element placement: ', elemPos);
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
    svgElement.setAttribute('width', `${gridDimension.width}`);
    svgElement.setAttribute('height', `${gridDimension.height}`);
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
          const cohort =
            ceParent instanceof Cohort
              ? document.getElementById(ceParent.id).querySelector('.rectCohort-sizeBar')
              : document.getElementById(ceChild.id).querySelector('.rectCohort-sizeBar');
          const barHeight = cohort.getBoundingClientRect().height;

          const x1 = parent.left + parent.width - chtOverviewGraph.left;
          let y1 = parent.top + parent.height / 2 - chtOverviewGraph.top;
          const x2 = child.left - chtOverviewGraph.left;
          let y2 = child.top + child.height / 2 - chtOverviewGraph.top;

          // 2px because of the upper border
          y1 += 1;
          y2 += 1;

          const mx1 = (x2 - x1) / 2 + x1;
          const my1 = y1;
          const mx2 = (x2 - x1) / 2 + x1;
          const my2 = y2;
          const d = `M ${x1} ${y1} C ${mx1} ${my1}, ${mx2} ${my2}, ${x2} ${y2}`;

          const currPath: SVGPathElement = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          currPath.setAttribute('id', `path-${ceParent.id}-to-${ceChild.id}`);
          // currPath.setAttribute('class', 'svg-path');
          currPath.classList.add('svg-path', `path-ep-out-${ceParent.id}`, `path-ep-in-${ceChild.id}`);
          currPath.setAttribute('d', d);
          currPath.setAttribute('stroke-width', '5px');
          svgElement.appendChild(currPath);
        }
      }
    }
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
    divAttribute.innerHTML = `<span>Attribute:</span> ${task.label}`;
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
