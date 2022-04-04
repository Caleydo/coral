import {format} from 'd3-format';
import {select} from 'd3-selection';
import {transition} from 'd3-transition';
import tippy from 'tippy.js';
import {Cohort, IBloodlineElement} from '../../Cohort';
import {ICohort} from '../../CohortInterfaces';
import {getRootCohort} from '../../cohortview';
import {IAttribute, multiFilter} from '../../data/Attribute';
import {IEqualsList, INumRange} from '../../rest';
import {Task} from '../../Tasks';
import {createHTMLElementWithClasses, getSessionStorageItem, setSessionStorageItem} from '../../util';
import {easyLabelFromFilter} from '../../utilLabels';
import {ATask} from './ATask';


interface ITaskAttributValue {
  taskId: string;
  attributes: IAttribute[];
  values: Array<INumRange[] | IEqualsList>;
}
interface ICohortAndTasksConfig {
  cht: Cohort;
  size: number;
  refSize: number;
  attributeValue: ITaskAttributValue[];
}

interface IPrevalencePack {
  chtIndex: number;
  chtId: number;
  container: HTMLDivElement;
  parentTaskId: string;
  chtConfig: ICohortAndTasksConfig;
}

export class Prevalence extends ATask {
  public label = `Prevalence`;
  public id = `prevalence`;
  public hasOutput = false;

  supports(attributes: IAttribute[], cohorts: ICohort[]) {
    return cohorts.length > 0;
  }

  showSearchBar() {
    return false;
  }

  private prevalencePacks: IPrevalencePack[] = [];
  private baseCohort: Cohort;
  private baseCohortSize: number;
  private cbExclMissingVal: HTMLInputElement;
  private excludeMissingValues: boolean = true;
  static readonly EXCL_MISSING_VAL_TEXT = 'excl. missing values';
  static readonly INCL_MISSING_VAL_TEXT = 'incl. missing values';
  static readonly INITIAL_CHT_LABEL = 'Initial Cohort';
  static readonly TASK_OPTION_LABEL = 'Applicable Tasks';
  private currentState: {
    chtId: number,
    activeTaskIds: string[]
  }[] = [];



  show(columnHeader: HTMLDivElement, container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]): void {
    super.show(columnHeader, container, attributes, cohorts);

    // log parameters
    // log.debug('PREVALENCE.show: ', {container, attributes, cohorts, body: this.body.node()});

    // check if checkbox was already checked
    this.excludeMissingValues = this.excludeMissingValues === null ? true : this.excludeMissingValues;
    // add checkbox für missin values
    this.addCheckboxForMissingValues(this.body.node());


    this.prevalencePacks = [];
    this.setBaseCohort(); // set base cohort


    // create for each selected cohort a prevalence pack
    for (let chtIndex = 0; chtIndex < cohorts.length; chtIndex++) {
      const parentTaskIDs = cohorts[chtIndex].parents.map((elem) => elem.id);
      const parentTaskId = parentTaskIDs.length === 0 ? null : parentTaskIDs[0];

      // get current cohort
      let currentCht: Cohort;
      if (parentTaskId === null) {
        currentCht = this.baseCohort;
      } else {
        currentCht = cohorts[chtIndex] as Cohort;
      }

      // create prevalence pack for the current cohort
      this.createPrevalenceCohortPack(this.body.node(), chtIndex, parentTaskId, currentCht);

    }

    // set default value of task selection
    for (const currPack of this.prevalencePacks) {
      const currStateIdx = this.currentState.map((conf) => conf.chtId).indexOf(currPack.chtId);
      if (currStateIdx !== -1) {
        const currState = this.currentState[currStateIdx];
        const currContainer = currPack.container;
        for (const at of currState.activeTaskIds) {
          currContainer.querySelector(`.${at}`).classList.add('active');
        }
        this.updatePrevalencePack(currPack);
      } else if (currPack.parentTaskId !== null) {
        const currContainer = currPack.container;
        const taskOptions = Array.from(currContainer.querySelectorAll('.ref-task-option')) as HTMLDivElement[];
        const lastTask = taskOptions[taskOptions.length - 1];
        if (lastTask) {
          lastTask.click();
        }
      } else {
        // in case that the root cohort was selected as input cohort for the prevalence task
        this.updatePrevalencePack(currPack);
      }

    }
  }

  private addCheckboxForMissingValues(container: HTMLDivElement) {
    const divExclContainer = document.createElement('div');
    divExclContainer.classList.add('exclude-container');
    container.appendChild(divExclContainer);

    // checkbox: manual created with html div elements
    const checkbox = document.createElement('div');
    checkbox.classList.add('prev-checkbox');
    if (this.excludeMissingValues === true) {
      checkbox.classList.add('active');
    }
    // checkbox indicator
    const cbIndicator = document.createElement('div');
    cbIndicator.classList.add('checkbox-indicator');
    checkbox.appendChild(cbIndicator);
    divExclContainer.appendChild(checkbox);

    // add loading effect icon container
    const cbCtrLoading = createHTMLElementWithClasses('div', ['icon-container']);
    cbCtrLoading.toggleAttribute('hidden');
    checkbox.appendChild(cbCtrLoading);

    checkbox.addEventListener('click', async (event) => {
      this.excludeMissingValues = !this.excludeMissingValues;
      // toggle active state
      checkbox.classList.toggle('active');
      cbIndicator.toggleAttribute('hidden', true); // hide check mark indicator
      checkbox.classList.add('color-loading'); // add loading style for checkbox
      cbCtrLoading.removeAttribute('hidden'); // make loading indicator visible

      await this.changeMissingValueInclusion(this.excludeMissingValues);
      cbCtrLoading.toggleAttribute('hidden', true); // hide loading indicator
      checkbox.classList.remove('color-loading');// remove loading style for checkbox
      cbIndicator.removeAttribute('hidden'); // make check mark indicator visible
    });

    // label
    const divLabelContainer = document.createElement('div');
    divLabelContainer.classList.add('label-excl-container');
    divExclContainer.appendChild(divLabelContainer);
    const labelMissingVal = document.createElement('div');
    labelMissingVal.classList.add('label-excl');
    labelMissingVal.innerHTML = 'Filter out the missing values from the reference cohorts.';
    tippy(labelMissingVal, {
      content: `
        <p>Select this option to always exclude missing data from the reference cohorts.</p>
        <p>
          This means that unknown values in one of the filter steps will not be included in the prevalence calculation, even if a filter is not applied to the reference cohort.
          This is done for each reference cohort individually.
        </p>
        `
    });
    divLabelContainer.appendChild(labelMissingVal);
  }

  private async updateBarStructures() {
    const updatePromises = [];
    // update data based on exclusion state
    for (const currPack of this.prevalencePacks) {
      if (currPack.parentTaskId !== null) {
        // update prevalence calculations
        updatePromises.push(this.updatePrevalencePack(currPack));
      }
    }
    // wait until all prevalence are updated
    await Promise.all(updatePromises);
  }

  private async changeMissingValueInclusion(exclState: boolean) {
    const updatePromises = [];
    // update data based on exclusion state
    for (const currPack of this.prevalencePacks) {
      if (currPack.parentTaskId !== null) {
        // update prevalence calculations
        updatePromises.push(this.updatePrevalencePack(currPack));
      }
    }
    // wait until all prevalence are updated
    await Promise.all(updatePromises);
  }

  private createPrevalenceCohortPack(container: HTMLDivElement, chtIndex: number, parentTaskId: string, cohort: Cohort) {
    // log.debug('cohort pack: ', {container, chtIndex, parentTaskId, cohort});

    const divPrevPack = document.createElement('div');
    divPrevPack.classList.add('prevalence-cohort-pack');
    container.appendChild(divPrevPack);

    const bloodline = cohort.getBloodline();

    // get all tasks from the bloodline
    // fist task is the one before the cohort
    let tasks = bloodline.filter((elem) => elem.elemType === 'task').map((elem) => elem.obj) as Task[];
    // reverse order of tasks -> now the first element is the first task after root cohort
    tasks = tasks.reverse();

    // get the current cohort config and its tasks attribute and value pairs
    const chtConfig: ICohortAndTasksConfig = this.createCohortAndTasksConfig(cohort, bloodline, tasks);

    // add elements for each input cohort to calculate prevelence
    this.addPackElements(divPrevPack, chtIndex, chtConfig, tasks);

    // save the pack (reference and config) data into pack array
    this.prevalencePacks.push({chtIndex, chtId: cohort.dbId, container: divPrevPack, parentTaskId, chtConfig});

  }

  // crates fot each cohort a cohort and its tasks attribute value pair configuration
  private createCohortAndTasksConfig(cohort: Cohort, bloodline: IBloodlineElement[], tasks: Task[]): ICohortAndTasksConfig {
    const chtSize = cohort.getRetrievedSize();
    // const refSize = bloodline[bloodline.length - 1].size; // is the root cohort size
    const refSize = chtSize;

    // create for each cohort the filter task in combination with the values
    const attrVal = tasks.map((elem) => {
      // get the index of the current task in the bloodline
      const currTaskIdx = bloodline.map((bItem) => bItem.obj.id).indexOf(elem.id);
      // the corresponding cohort to the task is always the element before the task in the bloodline
      const currChild = bloodline[currTaskIdx - 1].obj as Cohort;
      const taskAttValue = {
        taskId: elem.id,
        attributes: elem.attributes,
        values: currChild.values,
      };
      return taskAttValue;
    });

    // cohort configuration object with the cohort, sizes and filters used to for the creation
    const cohortAndTasksConfig = {
      cht: cohort,
      size: chtSize,
      refSize,
      attributeValue: attrVal
    };
    return cohortAndTasksConfig;
  }

  // add all the elements that are needed for an input cohort
  private addPackElements(ctrPrevPack: HTMLDivElement, chtIndex: number, chtConfig: ICohortAndTasksConfig, tasks: Task[]) {
    // split into 3 areas: 1. legend + clickable tasks, 2. bar, 3. scale with the values


    // 1. Area _______________________________________________
    const divLegend = document.createElement('div');
    divLegend.classList.add('prev-legends-tasks');
    ctrPrevPack.appendChild(divLegend);
    // ### 1. row: dataset / base cohort
    // row container
    const divAllCreation = document.createElement('div');
    divAllCreation.classList.add('prev-all-creation', 'prev-row', 'legend-task-row');

    // legend container
    const divAllLabel = document.createElement('div');
    divAllLabel.classList.add('prev-all-label', 'prev-lable-cntr');
    divAllCreation.appendChild(divAllLabel);

    // legend all (base cohort)
    const divLegendAll = this.createLegendItem(['prev-legend-all'], this.baseCohort.label);
    divLegendAll.title = `${this.baseCohort.label}`;
    // add eye icon for the dataset bar
    const iconEye = document.createElement('i');
    iconEye.classList.add('fas', 'fa-eye', 'prev-show-dataset-eye');
    iconEye.dataset.showDatasetBar = '1';
    iconEye.addEventListener('click', async (event) => {

      const showDatasetBar = Boolean(Number(iconEye.dataset.showDatasetBar));
      const toggled = !showDatasetBar;

      iconEye.dataset.showDatasetBar = toggled ? '1' : '0';

      const updatePromises = [];
      // update data based on exclusion state
      for (const currPack of this.prevalencePacks) {
        if (currPack.parentTaskId !== null) {
          // update prevalence calculations
          updatePromises.push(this.updatePrevalencePack(currPack));
        }
      }
      // wait until all prevalence are updated
      await Promise.all(updatePromises);

    });
    divLegendAll.appendChild(iconEye);

    divAllLabel.appendChild(divLegendAll);
    // enter mouse hover
    divLegendAll.addEventListener('mouseenter', (event) => {
      console.log('hover: tager: ', event.currentTarget);
      event.stopImmediatePropagation();
      this.baseCohort.representation.getRepresentation().dispatchEvent(new Event('mouseenter'));
    });
    // leave mouse hover
    divLegendAll.addEventListener('mouseleave', (event) => {
      event.stopImmediatePropagation();
      this.baseCohort.representation.getRepresentation().dispatchEvent(new Event('mouseleave'));
    });


    // ### 2. row: reference cohort
    // row container
    const divRefCreation = document.createElement('div');
    divRefCreation.classList.add('prev-ref-creation', 'prev-row', 'legend-task-row');


    // legend container
    const divRefLabel = document.createElement('div');
    divRefLabel.classList.add('prev-ref-label', 'prev-lable-cntr');
    divRefCreation.appendChild(divRefLabel);

    // legend reference
    const divLegendRef = this.createLegendItem(['prev-legend-ref'], 'Reference, defined by');
    divRefLabel.appendChild(divLegendRef);

    // tasks container
    // clickable taks
    // task container (containes all tasks)
    const divRefTaskContainer = document.createElement('div');
    divRefTaskContainer.classList.add('ref-task-container');
    divRefCreation.appendChild(divRefTaskContainer);

    //add different task options (tasks with their attributes)
    const taskAndAttribute: {task: Task, values: Array<INumRange[] | IEqualsList>}[] = tasks.map((elem) => {
      const values = chtConfig.attributeValue.filter((conf) => conf.taskId === elem.id)[0].values;
      return {
        task: elem,
        values
      };
    });

    // tasks
    const dataCellsRef = select(divRefTaskContainer).selectAll<HTMLDivElement, {task: Task, value: Array<INumRange[] | IEqualsList>}>('div.ref-task-option').data(taskAndAttribute, (d) => d.task.id);

    // create buttons for the tasks
    const enterSelectionRef = dataCellsRef.enter();
    enterSelectionRef
      .append('div')
      .classed('ref-task-option', true)
      .classed('task-option', true)
      .each((d, index, nodes) => {
        this.createClickableTasks(d, chtIndex, index, nodes);
      });

    // ### 3. row: cohort
    // row container
    const divChtCreation = document.createElement('div');
    divChtCreation.classList.add('prev-cht-creation', 'prev-row', 'legend-task-row');

    // legend container
    const divChtlabel = document.createElement('div');
    divChtlabel.classList.add('prev-cht-label', 'prev-lable-cntr');
    divChtCreation.appendChild(divChtlabel);

    // legend cohort (input cohort)
    const currCht = chtConfig.cht;
    const divLegendCht = this.createLegendItem(['prev-legend-cht'], currCht.label, currCht.colorTaskView);
    divLegendCht.title = `${currCht.label} (All filters are used to create this cohort.)`;
    divChtlabel.appendChild(divLegendCht);
    // enter mouse hover
    divLegendCht.addEventListener('mouseenter', (event) => {
      event.stopImmediatePropagation();
      currCht.representation.getRepresentation().dispatchEvent(new Event('mouseenter'));
    });
    // leave mouse hover
    divLegendCht.addEventListener('mouseleave', (event) => {
      event.stopImmediatePropagation();
      currCht.representation.getRepresentation().dispatchEvent(new Event('mouseleave'));
    });


    // tasks container
    // clickable taks
    // task container (containes all tasks)
    const divChtTaskContainer = document.createElement('div');
    divChtTaskContainer.classList.add('cht-task-container');
    divChtCreation.appendChild(divChtTaskContainer);

    //add different task options (tasks with their attributes)
    // const taskAndAttribute: {task: Task, values: Array<INumRange[] | IEqualsList>}[] = tasks.map((elem) => {
    //   const values = chtConfig.attributeValue.filter((conf) => conf.taskId === elem.id)[0].values;
    //   return {
    //     task: elem,
    //     values
    //   };
    // });

    // tasks
    const dataCellsCht = select(divChtTaskContainer).selectAll<HTMLDivElement, {task: Task, value: Array<INumRange[] | IEqualsList>}>('div.cht-task-option').data(taskAndAttribute, (d) => d.task.id);

    // create buttons for the tasks
    const enterSelectionCht = dataCellsCht.enter();
    enterSelectionCht
      .append('div')
      .classed('cht-task-option', true)
      .classed('task-option', true)
      // .classed('active', true)
      .each((d, index, nodes) => {
        this.createNonClickableTasks(d, chtIndex, index, nodes);
      });

    // add all row containers
    divLegend.appendChild(divAllCreation);
    divLegend.appendChild(divRefCreation);
    divLegend.appendChild(divChtCreation);




    // // 1. row: label + clickable tasks
    // const divRefCreation = document.createElement('div');
    // divRefCreation.classList.add('prev-ref-creation', 'prev-row');
    // ctrPrevPack.appendChild(divRefCreation);

    // // label
    // const divRefLabel = document.createElement('div');
    // divRefLabel.classList.add('prev-ref-label');
    // // legend reference
    // const divLegendRef = this.createLegendItem(['prev-legend-ref'], 'Reference, defined by');
    // divRefLabel.appendChild(divLegendRef);
    // divRefCreation.appendChild(divRefLabel);

    // // task container (containes all tasks)
    // const divTaskContainer = document.createElement('div');
    // divTaskContainer.classList.add('ref-task-container');
    // divRefCreation.appendChild(divTaskContainer);

    // //add different task options (tasks with their attributes)
    // const taskAndAttribute: {task: Task, values: Array<INumRange[] | IEqualsList>}[] = tasks.map((elem) => {
    //   const values = chtConfig.attributeValue.filter((conf) => conf.taskId === elem.id)[0].values;
    //   return {
    //     task: elem,
    //     values
    //   };
    // });

    // // tasks
    // const dataCells = select(divTaskContainer).selectAll<HTMLDivElement, {task: Task, value: Array<INumRange[] | IEqualsList>}>('div.ref-task-option').data(taskAndAttribute, (d) => d.task.id);

    // // create buttons for the tasks
    // const enterSelection = dataCells.enter();
    // enterSelection
    //   .append('div')
    //   .classed('ref-task-option', true)
    //   .each((d, index, nodes) => {
    //     this.createClickableTasks(d, chtIndex, index, nodes);
    //   });

    // 2. Area _______________________________________________
    // bars container
    const divResult = document.createElement('div');
    divResult.classList.add('prev-result', 'prev-row');
    ctrPrevPack.appendChild(divResult);

    // // label (legend)
    // const divResultLabel = document.createElement('div');
    // divResultLabel.classList.add('prev-result-label', 'prev-label');
    // divResult.appendChild(divResultLabel);

    // // legend all (base cohort)
    // const divLegendAll = this.createLegendItem(['prev-legend-all'], this.baseCohort.label);
    // divLegendAll.title = `${this.baseCohort.label}`;
    // // enter mouse hover
    // divLegendAll.addEventListener('mouseenter', (event) => {
    //   event.stopImmediatePropagation();
    //   this.baseCohort.representation.getRepresentation().dispatchEvent(new Event('mouseenter'));
    // });
    // // leave mouse hover
    // divLegendAll.addEventListener('mouseleave', (event) => {
    //   event.stopImmediatePropagation();
    //   this.baseCohort.representation.getRepresentation().dispatchEvent(new Event('mouseleave'));
    // });

    // // legend cohort (input cohort)
    // const currCht = chtConfig.cht;
    // const divLegendCht = this.createLegendItem(['prev-legend-cht'], currCht.label, currCht.colorTaskView);
    // divLegendCht.title = `${currCht.label} (All filters are used to create this cohort.)`;
    // // enter mouse hover
    // divLegendCht.addEventListener('mouseenter', (event) => {
    //   event.stopImmediatePropagation();
    //   currCht.representation.getRepresentation().dispatchEvent(new Event('mouseenter'));
    // });
    // // leave mouse hover
    // divLegendCht.addEventListener('mouseleave', (event) => {
    //   event.stopImmediatePropagation();
    //   currCht.representation.getRepresentation().dispatchEvent(new Event('mouseleave'));
    // });

    // // add legend items
    // divResultLabel.appendChild(divLegendAll);
    // // divResultLabel.appendChild(divLegendRef);
    // divResultLabel.appendChild(divLegendCht);

    // bars
    const divResultBar = document.createElement('div');
    divResultBar.classList.add('prev-result-bar');
    divResult.appendChild(divResultBar);
    this.createBarStructure(divResultBar, chtConfig.cht.colorTaskView);

    // scale label space at the end
    const divBarSpace = document.createElement('div');
    divBarSpace.classList.add('prev-label-space');
    divResult.appendChild(divBarSpace);
    // add max label for the scale
    const maxScaleLable = createHTMLElementWithClasses('div', ['prev-max-scale-label']);
    maxScaleLable.innerHTML = `${this.baseCohortSize}`;
    divBarSpace.appendChild(maxScaleLable);

    // 3. Area _______________________________________________
    // label (= space for size label) + scale (+ size indicators) + label space
    const divScale = document.createElement('div');
    divScale.classList.add('prev-result-scale', 'prev-row');
    ctrPrevPack.appendChild(divScale);

    // label
    // const divScaleLabel = document.createElement('div');
    // divScaleLabel.classList.add('prev-scale-label', 'prev-label');
    // divScale.appendChild(divScaleLabel);

    // scale
    const divScaleSizes = document.createElement('div');
    divScaleSizes.classList.add('prev-scale-sizes');
    divScale.appendChild(divScaleSizes);

    // container for the lower scale elements
    const lowerScales = createHTMLElementWithClasses('div', ['prev-lower-scales']);
    divScaleSizes.appendChild(lowerScales);


    // dataset scale
    const divScaleDataset = document.createElement('div');
    divScaleDataset.classList.add('prev-scale-dataset', 'prev-scale-elem');
    // divScaleSizes.appendChild(divScaleDataset);
    lowerScales.appendChild(divScaleDataset);
    // -> fist tick
    const divScaleFistTick = document.createElement('div');
    divScaleFistTick.classList.add('prev-scale-first-tick');
    divScaleDataset.appendChild(divScaleFistTick);


    // reference scale
    const divScaleRef = document.createElement('div');
    divScaleRef.classList.add('prev-scale-reference', 'prev-scale-elem', 'prev-value-reference');
    // divScaleSizes.appendChild(divScaleRef);
    lowerScales.appendChild(divScaleRef);

    // -> tick
    const divScaleRefTick = document.createElement('div');
    divScaleRefTick.classList.add('scale-reference-tick');
    divScaleRef.appendChild(divScaleRefTick);

    // -> label container
    const divScaleRefLabelContainer = document.createElement('div');
    divScaleRefLabelContainer.classList.add('scale-reference-container');
    divScaleRef.appendChild(divScaleRefLabelContainer);

    // -> label prevalence (percentage)
    const divScaleRefPercentage = document.createElement('div');
    divScaleRefPercentage.classList.add('scale-ref-percentage');
    divScaleRefPercentage.innerHTML = '100%';
    divScaleRefLabelContainer.appendChild(divScaleRefPercentage);
    // -> label size
    const ctrRefSize = createHTMLElementWithClasses('div', ['scale-ctr-ref-size']);
    divScaleRefLabelContainer.appendChild(ctrRefSize);
    const divScaleRefSize = document.createElement('div');
    divScaleRefSize.classList.add('scale-ref-size');
    ctrRefSize.appendChild(divScaleRefSize);
    // add info icon for exluded missing values
    const infoLable = createHTMLElementWithClasses('div', ['prev-info-bar-label']);
    infoLable.toggleAttribute('hidden', true); // hide at the beginning
    ctrRefSize.appendChild(infoLable);
    const infoIcon = createHTMLElementWithClasses('i', ['fas', 'fa-info-circle']);
    tippy(infoIcon, {
      content: `Reference doesn't equal dataset,</br>
        because samples with missing values are filtered out.`
    });
    infoLable.appendChild(infoIcon);



    // cohort scale
    const divScaleCohort = document.createElement('div');
    divScaleCohort.classList.add('prev-scale-cohort', 'prev-scale-elem', 'prev-value-cohort');
    // divScaleSizes.appendChild(divScaleCohort);
    lowerScales.appendChild(divScaleCohort);

    // -> tick
    const divScaleChtTick = document.createElement('div');
    divScaleChtTick.classList.add('scale-cohort-tick');
    divScaleCohort.appendChild(divScaleChtTick);

    // -> label size container
    const divScaleCohortContainer = document.createElement('div');
    divScaleCohortContainer.classList.add('scale-cohort-container');
    divScaleCohort.appendChild(divScaleCohortContainer);

    // -> label prevalence (percentage)
    const divScaleCohortPercentage = document.createElement('div');
    divScaleCohortPercentage.classList.add('scale-cohort-percentage');
    const cohortColor = chtConfig.cht.colorTaskView === null ? 'white' : chtConfig.cht.colorTaskView;
    divScaleCohortPercentage.style.background = `linear-gradient(to right, ${cohortColor} 0%, white 100%)`;
    // divScaleCohortPercentage.style.background = `linear-gradient(to right, ${cohortColor} 0%, white 25%, white 100%)`;
    divScaleCohortContainer.appendChild(divScaleCohortPercentage);
    // -> label size
    const divScaleCohortSize = document.createElement('div');
    divScaleCohortSize.classList.add('scale-cohort-size');
    divScaleCohortContainer.appendChild(divScaleCohortSize);


    // scale label space at the end
    const divScaleSpace = document.createElement('div');
    divScaleSpace.classList.add('prev-label-space');
    divScale.appendChild(divScaleSpace);

  }

  /*
  // add all the elements that are needed for an input cohort
  private addPackElements(ctrPrevPack: HTMLDivElement, chtIndex: number, chtConfig: ICohortAndTasksConfig, tasks: Task[]) {
    // 1. row: label + clickable tasks
    const divRefCreation = document.createElement('div');
    divRefCreation.classList.add('prev-ref-creation', 'prev-row');
    ctrPrevPack.appendChild(divRefCreation);

    // label
    const divRefLabel = document.createElement('div');
    divRefLabel.classList.add('prev-ref-label');
    // legend reference
    const divLegendRef = this.createLegendItem(['prev-legend-ref'], 'Reference, defined by');
    divRefLabel.appendChild(divLegendRef);
    divRefCreation.appendChild(divRefLabel);

    // clickable taks
    // task container (containes all tasks)
    const divTaskContainer = document.createElement('div');
    divTaskContainer.classList.add('ref-task-container');
    divRefCreation.appendChild(divTaskContainer);

    //add different task options (tasks with their attributes)
    const taskAndAttribute: {task: Task, values: Array<INumRange[] | IEqualsList>}[] = tasks.map((elem) => {
      const values = chtConfig.attributeValue.filter((conf) => conf.taskId === elem.id)[0].values;
      return {
        task: elem,
        values
      };
    });

    // tasks
    const dataCells = select(divTaskContainer).selectAll<HTMLDivElement, {task: Task, value: Array<INumRange[] | IEqualsList>}>('div.ref-task-option').data(taskAndAttribute, (d) => d.task.id);

    // create buttons for the tasks
    const enterSelection = dataCells.enter();
    enterSelection
      .append('div')
      .classed('ref-task-option', true)
      .each((d, index, nodes) => {
        this.createClickableTasks(d, chtIndex, index, nodes);
      });

    // -------
    // 2. row: label (legend) + bars  + label space
    const divResult = document.createElement('div');
    divResult.classList.add('prev-result', 'prev-row');
    ctrPrevPack.appendChild(divResult);

    // label (legend)
    const divResultLabel = document.createElement('div');
    divResultLabel.classList.add('prev-result-label', 'prev-label');
    divResult.appendChild(divResultLabel);

    // legend all (base cohort)
    const divLegendAll = this.createLegendItem(['prev-legend-all'], this.baseCohort.label);
    divLegendAll.title = `${this.baseCohort.label}`;
    // enter mouse hover
    divLegendAll.addEventListener('mouseenter', (event) => {
      event.stopImmediatePropagation();
      this.baseCohort.representation.getRepresentation().dispatchEvent(new Event('mouseenter'));
    });
    // leave mouse hover
    divLegendAll.addEventListener('mouseleave', (event) => {
      event.stopImmediatePropagation();
      this.baseCohort.representation.getRepresentation().dispatchEvent(new Event('mouseleave'));
    });

    // legend cohort (input cohort)
    const currCht = chtConfig.cht;
    const divLegendCht = this.createLegendItem(['prev-legend-cht'], currCht.label, currCht.colorTaskView);
    divLegendCht.title = `${currCht.label} (All filters are used to create this cohort.)`;
    // enter mouse hover
    divLegendCht.addEventListener('mouseenter', (event) => {
      event.stopImmediatePropagation();
      currCht.representation.getRepresentation().dispatchEvent(new Event('mouseenter'));
    });
    // leave mouse hover
    divLegendCht.addEventListener('mouseleave', (event) => {
      event.stopImmediatePropagation();
      currCht.representation.getRepresentation().dispatchEvent(new Event('mouseleave'));
    });

    // add legend items
    divResultLabel.appendChild(divLegendAll);
    // divResultLabel.appendChild(divLegendRef);
    divResultLabel.appendChild(divLegendCht);

    // bars
    const divResultBar = document.createElement('div');
    divResultBar.classList.add('prev-result-bar');
    divResult.appendChild(divResultBar);
    this.createBarStructure(divResultBar, chtConfig.cht.colorTaskView);

    // scale label space
    const divBarSpace = document.createElement('div');
    divBarSpace.classList.add('prev-label-space');
    divResult.appendChild(divBarSpace);
    // add max label for the scale
    const maxScaleLable = createHTMLElementWithClasses('div', ['prev-max-scale-label']);
    maxScaleLable.innerHTML = `${this.baseCohortSize}`;
    divBarSpace.appendChild(maxScaleLable);

    // -------
    // 3. row: label (= space for size label) + scale (+ size indicators) + label space
    const divScale = document.createElement('div');
    divScale.classList.add('prev-result-scale', 'prev-row');
    ctrPrevPack.appendChild(divScale);

    // label
    const divScaleLabel = document.createElement('div');
    divScaleLabel.classList.add('prev-scale-label', 'prev-label');
    divScale.appendChild(divScaleLabel);

    // scale
    const divScaleSizes = document.createElement('div');
    divScaleSizes.classList.add('prev-scale-sizes');
    divScale.appendChild(divScaleSizes);

    // container for the lower scale elements
    const lowerScales = createHTMLElementWithClasses('div', ['prev-lower-scales']);
    divScaleSizes.appendChild(lowerScales);


    // dataset scale
    const divScaleDataset = document.createElement('div');
    divScaleDataset.classList.add('prev-scale-dataset', 'prev-scale-elem');
    // divScaleSizes.appendChild(divScaleDataset);
    lowerScales.appendChild(divScaleDataset);
    // -> fist tick
    const divScaleFistTick = document.createElement('div');
    divScaleFistTick.classList.add('prev-scale-first-tick');
    divScaleDataset.appendChild(divScaleFistTick);


    // reference scale
    const divScaleRef = document.createElement('div');
    divScaleRef.classList.add('prev-scale-reference', 'prev-scale-elem', 'prev-value-reference');
    // divScaleSizes.appendChild(divScaleRef);
    lowerScales.appendChild(divScaleRef);

    const divScaleRefTick = document.createElement('div');
    divScaleRefTick.classList.add('scale-reference-tick');
    divScaleRef.appendChild(divScaleRefTick);
    // -> label container
    const divScaleRefLabelContainer = document.createElement('div');
    divScaleRefLabelContainer.classList.add('scale-reference-container');
    divScaleRef.appendChild(divScaleRefLabelContainer);
    // -> label size
    const ctrRefSize = createHTMLElementWithClasses('div', ['scale-ctr-ref-size']);
    divScaleRefLabelContainer.appendChild(ctrRefSize);
    const divScaleRefSize = document.createElement('div');
    divScaleRefSize.classList.add('scale-ref-size');
    ctrRefSize.appendChild(divScaleRefSize);
    // add info icon for exluded missing values
    const infoLable = createHTMLElementWithClasses('div', ['prev-info-bar-label']);
    infoLable.toggleAttribute('hidden', true); // hide at the beginning
    ctrRefSize.appendChild(infoLable);
    const infoIcon = createHTMLElementWithClasses('i', ['fas', 'fa-info-circle']);
    tippy(infoIcon, {
      content: `Reference doesn't equal dataset,</br>
        because samples with missing values are filtered out.`
    });
    infoLable.appendChild(infoIcon);
    // -> label prevalence (percentage)
    const divScaleRefPercentage = document.createElement('div');
    divScaleRefPercentage.classList.add('scale-ref-percentage');
    divScaleRefPercentage.innerHTML = '100%';
    divScaleRefLabelContainer.appendChild(divScaleRefPercentage);


    // cohort scale
    const divScaleCohort = document.createElement('div');
    divScaleCohort.classList.add('prev-scale-cohort', 'prev-scale-elem', 'prev-value-cohort');
    // divScaleSizes.appendChild(divScaleCohort);
    lowerScales.appendChild(divScaleCohort);

    // -> label size container
    const divScaleCohortContainer = document.createElement('div');
    divScaleCohortContainer.classList.add('scale-cohort-container');
    divScaleCohort.appendChild(divScaleCohortContainer);

    // -> label size
    const divScaleCohortSize = document.createElement('div');
    divScaleCohortSize.classList.add('scale-cohort-size');
    divScaleCohortContainer.appendChild(divScaleCohortSize);
    // -> label prevalence (percentage)
    const divScaleCohortPercentage = document.createElement('div');
    divScaleCohortPercentage.classList.add('scale-cohort-percentage');
    const cohortColor = chtConfig.cht.colorTaskView === null ? 'white' : chtConfig.cht.colorTaskView;
    divScaleCohortPercentage.style.background = `linear-gradient(to right, white 0%, white 25%, ${cohortColor} 100%)`;
    divScaleCohortContainer.appendChild(divScaleCohortPercentage);


    // scale label space at the end
    const divScaleSpace = document.createElement('div');
    divScaleSpace.classList.add('prev-label-space');
    divScale.appendChild(divScaleSpace);

  }
  */

  private createLegendItem(cssClasses: string[], label: string, color: string = null): HTMLDivElement {
    // legend item
    const divLegend = document.createElement('div');
    divLegend.classList.add('prev-legend-item', ...cssClasses);
    // mark
    const divLegMark = document.createElement('div');
    divLegMark.classList.add('prev-legend-mark');
    if (color !== null) {
      divLegMark.style.background = color;
    }
    divLegend.appendChild(divLegMark);
    // text
    const divLegText = document.createElement('div');
    divLegText.classList.add('prev-legend-text');
    divLegText.innerHTML = label;
    divLegend.appendChild(divLegText);

    return divLegend;
  }

  // create the bar structure for a cohort
  private createBarStructure(ctrBars: HTMLDivElement, colorCht: string) {
    // dataset bar (referenve + filterted out)
    const divDataset = document.createElement('div');
    divDataset.classList.add('bar-dataset');
    ctrBars.appendChild(divDataset);

    // zero line bar -> needed so that the scale is aligned correctly
    const divZero = createHTMLElementWithClasses('div', ['bar', 'prev-value-zero']);
    divDataset.appendChild(divZero);

    // reference bar
    const divReference = document.createElement('div');
    divReference.classList.add('bar-reference', 'bar', 'prev-value-reference');
    divDataset.appendChild(divReference);

    // cohort bar
    const divCohort = document.createElement('div');
    divCohort.classList.add('bar-cohort', 'bar', 'prev-value-cohort');
    divCohort.style.background = colorCht;
    divDataset.appendChild(divCohort);

    // error bars for confidence interval
    const ctrErrorBars = createHTMLElementWithClasses('div', ['bar', 'prev-container-ci-bar']);
    divCohort.appendChild(ctrErrorBars);

    const barError = createHTMLElementWithClasses('div', ['prev-ci-bar-error']);
    ctrErrorBars.appendChild(barError);
    const barErrorLeft = createHTMLElementWithClasses('div', ['prev-ci-bar-error-line', 'side']);
    const barErrorMiddle = createHTMLElementWithClasses('div', ['prev-ci-bar-error-line', 'middle']);
    const barErrorRight = createHTMLElementWithClasses('div', ['prev-ci-bar-error-line', 'side']);
    barError.appendChild(barErrorLeft);
    barError.appendChild(barErrorMiddle);
    barError.appendChild(barErrorRight);
  }


  // create all task options for an input cohort
  private createNonClickableTasks(d: {task: Task; values: Array<INumRange[] | IEqualsList>;}, chtIndex: number, index: number, nodes: HTMLDivElement[] | ArrayLike<HTMLDivElement>) {
    const currNode = nodes[index];
    const currTask = d.task;
    const taskRep = currTask.representation.getRepresentation();

    // add the task id as class
    currNode.classList.add(currTask.id);

    // checkbox
    const checkbox = document.createElement('div');
    // checkbox.classList.add('task-checkbox');
    checkbox.classList.add('prev-checkbox');
    // checkbox indicator
    const cbIndicator = document.createElement('div');
    // cbIndicator.classList.add('task-checkbox-indicator');
    cbIndicator.classList.add('checkbox-indicator');
    checkbox.appendChild(cbIndicator);
    // // add loading effect icon container
    // const cbCtrLoading = createHTMLElementWithClasses('div', ['icon-container', 'loading-effect']);
    // cbCtrLoading.toggleAttribute('hidden', true);
    // checkbox.appendChild(cbCtrLoading);



    // label
    const label = document.createElement('div');
    label.classList.add('task-label');

    // add checkbox and label
    currNode.appendChild(checkbox);
    currNode.appendChild(label);

    // get attribute label
    const attrLabel = currTask.label;
    // get all values for the task
    const values = d.values;
    // get all attribtues for the task
    const attributes = d.task.attributes;
    // get all value labels for all attributes
    const valueLabel = attributes.map((attr, i) => {
      let attributeRangeLabel;
      if (Array.isArray(values[i])) {
        // TODO labels
        // attributeRangeLabel = (values[i] as INumRange[]).map((val) => labelFromFilter(val, attr)).join('/');
        attributeRangeLabel = (values[i] as INumRange[]).map((val) => easyLabelFromFilter(val, attr.label)).join('/');
      } else {
        // TODO labels
        // attributeRangeLabel = labelFromFilter((values[i] as IEqualsList), attr);
        attributeRangeLabel = easyLabelFromFilter((values[i] as IEqualsList), attr.label);
      }
      return attributeRangeLabel;
    }).join(', ');

    // set text for the task html element
    label.innerHTML = `${attrLabel}: ${valueLabel}`;

    // set tootip
    tippy(label, {
      content: `${attrLabel}: ${valueLabel}`
    });


    // add mouse enter and leave events (highlighting for the task in overview)
    // this.addMouseEventListernersToElements(currNode, taskRep);

    // // add click event (toggle task)
    // currNode.addEventListener('click', async (event) => {
    //   event.stopPropagation();
    //   await this.handleOptionSelectionChange(chtIndex, currNode);
    // });
  }

  // create all task options for an referce cohort
  private createClickableTasks(d: {task: Task; values: Array<INumRange[] | IEqualsList>;}, chtIndex: number, index: number, nodes: HTMLDivElement[] | ArrayLike<HTMLDivElement>) {
    const currNode = nodes[index];
    const currTask = d.task;
    const taskRep = currTask.representation.getRepresentation();

    // add the task id as class
    currNode.classList.add(currTask.id);

    // checkbox
    const checkbox = document.createElement('div');
    // checkbox.classList.add('task-checkbox');
    checkbox.classList.add('prev-checkbox');
    // checkbox indicator
    const cbIndicator = document.createElement('div');
    // cbIndicator.classList.add('task-checkbox-indicator');
    cbIndicator.classList.add('checkbox-indicator');
    checkbox.appendChild(cbIndicator);
    // add loading effect icon container
    const cbCtrLoading = createHTMLElementWithClasses('div', ['icon-container']);
    cbCtrLoading.toggleAttribute('hidden', true);
    checkbox.appendChild(cbCtrLoading);


    // label
    const label = document.createElement('div');
    label.classList.add('task-label');

    // add checkbox and label
    currNode.appendChild(checkbox);
    currNode.appendChild(label);

    // get attribute label
    const attrLabel = currTask.label;
    // get all values for the task
    const values = d.values;
    // get all attribtues for the task
    const attributes = d.task.attributes;
    // get all value labels for all attributes
    const valueLabel = attributes.map((attr, i) => {
      let attributeRangeLabel;
      if (Array.isArray(values[i])) {
        // TODO labels
        // attributeRangeLabel = (values[i] as INumRange[]).map((val) => labelFromFilter(val, attr)).join('/');
        attributeRangeLabel = (values[i] as INumRange[]).map((val) => easyLabelFromFilter(val, attr.label)).join('/');
      } else {
        // TODO labels
        // attributeRangeLabel = labelFromFilter((values[i] as IEqualsList), attr);
        attributeRangeLabel = easyLabelFromFilter((values[i] as IEqualsList), attr.label);
      }
      return attributeRangeLabel;
    }).join(', ');

    // set text for the task html element
    label.innerHTML = `${attrLabel}: ${valueLabel}`;

    // set tootip
    tippy(label, {
      content: `${attrLabel}: ${valueLabel}`
    });

    // add mouse enter and leave events (highlighting for the task in overview)
    this.addMouseEventListernersToElements(currNode, taskRep);

    // add click event (toggle task)
    currNode.addEventListener('click', async (event) => {
      event.stopPropagation();
      await this.handleOptionSelectionChange(chtIndex, currNode);
    });
  }

  // handle highlighting for the task options an their orinals in the overview
  private addMouseEventListernersToElements(prevElem: HTMLDivElement, overviewElem: HTMLDivElement) {
    if (prevElem) {
      // event: mouseenter
      prevElem.addEventListener('mouseenter', (event) => {
        event.stopPropagation();
        prevElem.classList.add('prev-element-highlight');
        if (overviewElem) {
          overviewElem.classList.add('overview-element-highlight');
        }
      });

      // event: mouseleave
      prevElem.addEventListener('mouseleave', (event) => {
        event.stopPropagation();
        prevElem.classList.remove('prev-element-highlight');
        if (overviewElem) {
          overviewElem.classList.remove('overview-element-highlight');
        }
      });
    }
  }

  // handler function for button action
  async handleOptionSelectionChange(chtIndex: number, clickedTask: HTMLDivElement) {
    clickedTask.classList.toggle('active');
    this.startTaskLoadingAnimation(clickedTask);

    const prevPack = this.prevalencePacks.filter((elem) => elem.chtIndex === chtIndex)[0];
    if (prevPack) {
      await this.updatePrevalencePack(prevPack);
    }
  }

  // update prevalence for an input cohort
  private async updatePrevalencePack(currPack: IPrevalencePack) {
    // start loading animation
    this.startBarLoadingAnimation(currPack);

    const activeTasks = select(currPack.container).selectAll('.ref-task-option.active').data().map((elem: {task: Task, value: INumRange[] | IEqualsList}) => elem.task) as Task[];
    const notActiveTasks = select(currPack.container).selectAll('.ref-task-option:not(.active)').data().map((elem: {task: Task, value: INumRange[] | IEqualsList}) => elem.task) as Task[];
    // get all task ids
    const taskIds = activeTasks.map((elem) => elem.id);

    // current state config
    const stateConfig = {
      chtId: currPack.chtConfig.cht.dbId,
      activeTaskIds: taskIds
    };

    // set current state config
    const currStateIdx = this.currentState.map((conf) => conf.chtId).indexOf(stateConfig.chtId);
    if (currStateIdx !== -1) {
      this.currentState[currStateIdx].activeTaskIds = stateConfig.activeTaskIds;
    } else {
      this.currentState.push(stateConfig);
    }

    // get dataset size
    const datasetSize = await this.baseCohort.size;
    // define the cohorts used to calculate the prevalence
    let newBaseCohort = this.baseCohort;
    let oldBaseCohort = this.baseCohort;
    const taskpair = currPack.chtConfig.attributeValue;

    const strTaskIds = taskIds.length === 0 ? '' : '::' + taskIds.join('::'); // string of the active tasks for the storagekey
    // get checkbox for excluding missing values from the tasks
    const exclState = this.excludeMissingValues;
    const cc = currPack.chtConfig;

    const storageKey = `cht-prev-${cc.cht.id}-exclMV:${exclState}-root-${strTaskIds}`;
    let cohortRefSize = getSessionStorageItem(storageKey);
    // log.debug('SessionStorage found : ', cohortRefSize !== null, ' | key: ', storageKey, ' | value: ', cohortRefSize);
    // log.debug('SessionStorage with : ', {taskIds}, ' | for: ', {chtIndex: currPack.chtIndex, cohort: cc.cht.label});
    // check if the reference cohort size was already calculated -> if not create the cohort
    if (cohortRefSize === null) {
      // go though all tasks to create a new cohort base on the tasks
      for (const at of activeTasks) {
        const attValue = taskpair.filter((elem) => elem.taskId === at.id)[0].values;
        // create new cohort in db with the attribute and value
        newBaseCohort = await multiFilter(oldBaseCohort, at.attributes, attValue);
        oldBaseCohort = newBaseCohort;
      }

      // go through all not active task if the exclude missing value option is active
      if (exclState) {
        const valExclMVForTask = {values: ['!null']}; // filter parameter for not equals null (missing value)
        for (const nat of notActiveTasks) {
          // log.debug('not active Task pair: ', {attribute: nat.attribute, value: valExclMVForTask});
          // create new cohort in db with the attribute and value
          newBaseCohort = await multiFilter(oldBaseCohort, nat.attributes, new Array(nat.attributes.length).fill(valExclMVForTask));
          oldBaseCohort = newBaseCohort;
        }
      }

      const currRefSize = await newBaseCohort.size;
      cohortRefSize = currRefSize;
      // save the size of the current reference cohort
      setSessionStorageItem(storageKey, cohortRefSize);
      // log.debug('Set SessionStorage -> key: ', storageKey, ' | value: ', cohortRefSize);

    }
    cc.refSize = cohortRefSize;

    // change reference bar size and the prevalence value
    this.updateBars(currPack, datasetSize, currPack.chtConfig.size, cohortRefSize);


  }

  private startBarLoadingAnimation(prevPack: IPrevalencePack) {
    // add loading animation for the reference bar
    const divReference = prevPack.container.querySelector('.bar-reference.prev-value-reference') as HTMLDivElement;
    divReference.classList.add('loading-effect');
  }

  private startTaskLoadingAnimation(clickedTask: HTMLDivElement) {
    // add loading animation for the clicked task
    const cbIndicator = clickedTask.querySelector('.checkbox-indicator') as HTMLDivElement;
    cbIndicator.toggleAttribute('hidden', true);

    clickedTask.classList.add('color-loading');
    const cbCtrLoading = clickedTask.querySelector('.icon-container') as HTMLDivElement;
    cbCtrLoading.removeAttribute('hidden');
  }

  private stopBarLoadingAnimation(prevPack: IPrevalencePack) {
    // remove loading animation for the reference bar
    const divReference = prevPack.container.querySelector('.bar-reference.prev-value-reference') as HTMLDivElement;
    divReference.classList.remove('loading-effect');
  }

  private stopTaskLoadingAnimation(prevPack: IPrevalencePack, clickedTask: HTMLDivElement = null) {
    if (clickedTask === null) {
      // remove loading animation for all tasks
      const tasks = prevPack.container.querySelectorAll('.ref-task-option') as NodeListOf<HTMLDivElement>;
      tasks.forEach((task) => {
        // remove loading animation of one task
        const cbCtrLoading = task.querySelector('.icon-container') as HTMLDivElement;
        cbCtrLoading.toggleAttribute('hidden', true);

        task.classList.remove('color-loading');
        const cbIndicator = task.querySelector('.checkbox-indicator') as HTMLDivElement;
        cbIndicator.removeAttribute('hidden');
      });
    } else {
      // remove loading animation of one task
      const cbCtrLoading = clickedTask.querySelector('.icon-container') as HTMLDivElement;
      cbCtrLoading.toggleAttribute('hidden', true);

      const cbIndicator = clickedTask.querySelector('.checkbox-indicator') as HTMLDivElement;
      cbIndicator.removeAttribute('hidden');
    }
  }

  // set the prevalence result (value and bar)
  private updateBars(prevPack: IPrevalencePack, sizeDataset: number, sizeCht: number, sizeRef: number) {
    // log.debug('updateBars: ', {prevPack, sizeDataset, sizeCht, sizeRef});
    const formatter = format('.3~f');
    const prevValue = (sizeCht / sizeRef);
    const prevValuePercentage = prevValue * 100;
    const prevValueFormat = prevValuePercentage < 1 ? '< 1' : '' + Math.round(prevValuePercentage);
    const prevValueMore = formatter(prevValuePercentage);

    // prevalence = 100% -> confidence interval = 0%
    let ciValue = 0;
    let ciValuePercentage = 0;
    let ciValueFormat = '0';
    let ciValueMore = '0';
    if (prevValue !== 1) {
      // calculate confidence interval with binom. distribution and 95% (1.96)
      ciValue = 1.96 * Math.sqrt((prevValue * (1 - prevValue)) / sizeRef);
      ciValuePercentage = ciValue * 100;
      ciValueFormat = ciValuePercentage < 1 ? '< 1' : '' + Math.round(ciValuePercentage);
      ciValueMore = formatter(ciValuePercentage);
    }

    // log.debug('CI values: ', {sizeCht, sizeRef, prevValue, ciValue});

    this.stopBarLoadingAnimation(prevPack);
    this.stopTaskLoadingAnimation(prevPack);

    // define transition
    const tBar = transition().duration(1000);

    // check if the dataset bar should be shown
    const iconEye = prevPack.container.querySelector('.prev-show-dataset-eye') as HTMLElement;
    const showDatasetBar = Boolean(Number(iconEye.dataset.showDatasetBar));

    const maxSizeRef = showDatasetBar ? sizeDataset : sizeRef;

    const datasetBar = prevPack.container.querySelector('.bar-dataset') as HTMLDivElement;
    datasetBar.classList.toggle('hide-dataset', !showDatasetBar);
    const datasetBarMaxLabel = prevPack.container.querySelector('.prev-max-scale-label') as HTMLDivElement;
    datasetBarMaxLabel.classList.toggle('hide-label', !showDatasetBar);


    // reference size
    const percentageRef = (sizeRef / maxSizeRef) * 100;
    const refElems = prevPack.container.querySelectorAll('.prev-value-reference') as NodeListOf<HTMLDivElement>;
    refElems.forEach((elem) => {
      select(elem).transition(tBar).style('width', `${percentageRef}%`);
      // elem.style.width = `${percentageRef}%`;
    });

    const scaleRefS = prevPack.container.querySelector('.scale-ref-size') as HTMLDivElement;
    scaleRefS.innerHTML = `${sizeRef}`;

    // error bar for confidence intervall
    // set error bar length
    const refBar = prevPack.container.querySelector('.prev-value-reference.bar') as HTMLDivElement;
    const refBarWidth = refBar.getBoundingClientRect().width;

    const errorBar = prevPack.container.querySelector('.prev-ci-bar-error') as HTMLDivElement;
    const ciHalfBarWidth = ciValue * refBarWidth;
    const ciBarWidth = 2 * ciHalfBarWidth;
    errorBar.style.width = `${ciBarWidth}px`;
    errorBar.style.marginRight = `-${ciHalfBarWidth}px`;

    // cohort size
    const percentageCht = (sizeCht / maxSizeRef) * 100;
    const chtElems = prevPack.container.querySelectorAll('.prev-value-cohort') as NodeListOf<HTMLDivElement>;
    chtElems.forEach((elem) => {
      select(elem).transition(tBar).style('width', `${percentageCht}%`);
      // elem.style.width = `${percentageCht}%`;
    });

    const scaleChtS = prevPack.container.querySelector('.scale-cohort-size') as HTMLDivElement;
    scaleChtS.innerHTML = `${sizeCht}`;
    const scaleChtP = prevPack.container.querySelector('.scale-cohort-percentage') as HTMLDivElement;
    scaleChtP.innerHTML = `${prevValueFormat}% &pm; ${ciValueFormat}%`;  // &pm; -> plus-minus sign: https://www.compart.com/de/unicode/U+00B1
    // add tooltip for the prevalence and its CI
    const prevTooltip = `
    <span style="font-weight: bold;">Prevalence:</span> ${prevValueMore}%</br>
    <span style="font-weight: bold;">Confidence Interval:</span> &pm; ${ciValueMore}%</br>`;
    const prevInstance = (scaleChtP as any)._tippy;
    if (prevInstance) {
      prevInstance.setContent(prevTooltip);
    } else {
      tippy(scaleChtP, {
        content: prevTooltip
      });
    }

    // add info label for no filter active and excluding missing values
    // and if reference size != dataset size
    const exclState = this.excludeMissingValues;
    const activeTasks = select(prevPack.container).selectAll('.ref-task-option.active').data().map((elem: {task: Task, value: INumRange[] | IEqualsList}) => elem.task) as Task[];
    const infoLabel = prevPack.container.querySelector('.prev-info-bar-label') as HTMLDivElement;
    if (!showDatasetBar) {
      if (exclState && activeTasks.length === 0 && sizeDataset !== sizeRef) {
        infoLabel.removeAttribute('hidden');
      } else {
        infoLabel.toggleAttribute('hidden', true);
      }
    } else {
      infoLabel.toggleAttribute('hidden', true);
    }

    // add tooltip to bar
    const barContainer = prevPack.container.querySelector('.prev-result-bar') as HTMLDivElement;
    // update toottip text
    const tooltip = `
    ${this.baseCohort.label} (${sizeDataset} items)</br>
    Reference: defined with checkboxes (${sizeRef} items)</br>
    Cohort: ${prevPack.chtConfig.cht.label} (${sizeCht} items)</br>
    <span style="font-weight: bold;">Prevalence:</span> ${prevValueMore}%</br>
    <span style="font-weight: bold;">Confidence Interval:</span> &pm; ${ciValueMore}%</br>`;
    // get tippy instance, to overwrite existing tippy tooltip
    const instance = (barContainer as any)._tippy;
    if (instance) {
      instance.setContent(tooltip);
    } else {
      tippy(barContainer, {
        content: tooltip
      });
    }
  }

  // sets the base cohort on which all task operations will be applied
  private setBaseCohort() {
    this.baseCohort = getRootCohort();
    this.baseCohortSize = this.baseCohort.getRetrievedSize();
  }


  close() {
    // remove node and back title button
    super.close();
    this.currentState = [];
  }
}
