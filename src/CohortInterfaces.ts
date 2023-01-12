import { IDType, IServerColumn } from 'tdp_core';
import { Cohort } from './Cohort';
import { IAttribute, IAttributeJSON } from './data/Attribute';
import { IEqualsList, INumRange } from './rest';
import { InputCohort } from './Taskview/Taskview';

/**
 * Enumeration for the different types of task
 */
export enum TaskType {
  Filter,
  Split,
  Combine,
  Overview,
  Characterization,
}

/// ///////////////////////////////////////////////////////////
//
// Cohort Overview Elements (Cohort & Task)
//
/// ///////////////////////////////////////////////////////////

/**
 * Interface for every element in the overview (except the paths between the elements)
 */

export enum ElementProvType {
  Cohort = 'Cohort',
  TaskSplit = 'Task-Split',
  TaskFilter = 'Task-Filter',
}

export interface IProvAttrAndValuesCohort {
  values: Array<INumRange[] | IEqualsList>;
  view: string;
  database: string;
  idType: IDType;
  idColumn: IServerColumn;
  selected: boolean;
  isRoot: boolean;
}

export interface IProvAttrAndValuesTask {
  attributes: IAttributeJSON[];
}

export interface IElementProvJSON {
  id: string;
  type: ElementProvType;
  label: string;
  parent: string[];
  children: string[];
  attrAndValues: any;
}

export interface IElementProvJSONCohort extends IElementProvJSON {
  attrAndValues: IProvAttrAndValuesCohort;
}

export interface IElementProvJSONTask extends IElementProvJSON {
  attrAndValues: IProvAttrAndValuesTask;
}

export interface IElement {
  id: string;
  label: string;
  parents: Array<IElement>;
  children: Array<IElement>;
  representation: ICohortRep | ITaskRep;

  toProvenanceJSON(): IElementProvJSON;
}

/**
 * Interface for a cohort in the overview
 */
export interface ICohort extends IElement {
  representation: ICohortRep;
  dbId: number;
  values: Array<INumRange[] | IEqualsList>;
  isInitial: boolean;
  sizeReference: number;
  toProvenanceJSON(): IElementProvJSONCohort;
}

/**
 * Interface for an tasks (filter, split, combine, ....)
 */
export interface ITask extends IElement {
  type: TaskType;
  attributes: IAttribute[];
  representation: ITaskRep;
  readonly creationDate: number;
  toProvenanceJSON(): IElementProvJSONTask;
}

/// ///////////////////////////////////////////////////////////
//
// Cohort Overview Elements Representations (Cohort & Task)
//
/// ///////////////////////////////////////////////////////////

// Overview Layout              -------------
export interface IOverviewLayout {
  cohortWidth: number;
  pathWidth: number;
  taskWidth: number;
  rowHeight: number;

  createLayout(root: ICohort): Array<any>;
  setContainerGrid(container: HTMLDivElement, columns: number, rows: number): void;
  setPositionInGrid(element: HTMLDivElement, level: number, pos: number): void;
}

// Rectangle Layout              -------------
export interface IRectLayout {
  elemID: string;
  parentID: string;
  column: number;
  row: number;
}
// Cohort Representations       -------------
/**
 * Interface for a representation of a cohort
 */
export interface ICohortRep {
  id: string;
  labelOne: string;
  labelTwo: string;

  getRepresentation(): HTMLDivElement;
  setInformation: (...info: any[]) => void;
  setSize: (size: number, refSize: number) => void;
  setLabel: ISetTwoLabelFunc;
  getClone(): HTMLDivElement;
  setSelection: (state: boolean) => void;
  getSelection(): boolean;
}

export interface IRectCohortRep extends ICohortRep {
  setInformation: (labelOne: string, labelTwo: string, size: number, sizeReference: number) => void;
}

// Task Representations   -------------
/**
 * Interface for a representation of a task
 */
export interface ITaskRep {
  id: string;
  label: string;

  getRepresentation(): HTMLDivElement;
  setInformation: (...info: any[]) => void;
  getClone(): HTMLDivElement;
  setLabel: ISetLabelFunc;
}

export interface IRectTaskRep extends ITaskRep {
  setImage: (image: string) => void;
  setInformation: (label: string, image: string) => void;
}

export interface ISetTwoLabelFunc {
  (labelOne: string, labelTwo): void;
}
export interface ISetLabelFunc {
  (label: string): void;
}

export interface ITaskParams {
  inputCohorts: InputCohort[]; // combine can have multiple
  outputCohorts: Cohort[];
  type: TaskType;
  label: string;
}
