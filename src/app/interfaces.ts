import type { IAllFilters, IDType, IDTypeLike, IRow, IServerColumn } from 'tdp_core';
import type { IAttribute, IAttributeJSON } from '../data/Attribute';
import type {
  ICohortDepletionScoreFilterParams,
  ICohortEqualsFilterParams,
  ICohortGeneEqualsFilterParams,
  ICohortGeneNumFilterParams,
  ICohortNumFilterParams,
  ICohortPanelAnnotationFilterParams,
  IEqualsList,
  INumRange,
} from '../base/rest';
import type { IEntitySourceConfig } from '../config/entities';

export enum ECloneFilterTypes {
  none,
  equals,
  range,
  geneScoreRange,
  geneScoreEquals,
  depletionScoreRange,
  panelAnnotation,
}

export interface ICohortClassBasicValues {
  id: string;
  dbId: number;
  labelOne: string;
  labelTwo: string;
}

export interface ICohortClassDatabaseValues {
  database: string;
  schema: string;
  table: string;
  view: string;
  idType: IDTypeLike;
  idColumn: IServerColumn;
}

export interface IPanelDesc {
  id: string;
  description: string;
  species: string;
}

export interface IDatasetDesc {
  source: IEntitySourceConfig;
  panel?: IPanelDesc;
  rootCohort: IElementProvJSONCohort;
  chtOverviewElements: IElementProvJSON[];
}

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

export enum EElementProvType {
  Cohort = 'Cohort',
  TaskSplit = 'Task-Split',
  TaskFilter = 'Task-Filter',
}

export interface IProvAttrAndValuesCohort {
  values: (INumRange[] | IEqualsList)[];
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
  type: EElementProvType;
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

export interface IBloodlineElement {
  obj: IElement;
  elemType: string;
  label: string;
  size: number;
}

/**
 * Interface for a cohort in the overview
 */
export interface ICohort extends IElement {
  readonly idType: IDType;
  readonly idColumn: IServerColumn;

  table: string;
  selected: boolean;
  representation: ICohortRep;
  id: string;
  dbId: number;
  database: string;
  values: (INumRange[] | IEqualsList)[];
  isInitial: boolean;
  sizeReference: number;
  get size(): Promise<number>;
  getRetrievedSize(): number;
  schema: string;
  view: string;
  colorTaskView: string;
  isClone: boolean;

  label: string;
  setLabels(labelOne: string, labelTwo: string);
  get labelOne(): string;
  get labelTwo(): string;
  getHTMLLabel(): string;

  toProvenanceJSON(): IElementProvJSONCohort;

  // getTaskChildren(): Task[]; // TODO create ITask interface and use here

  parents: IElement[];
  setCohortParents(chtParents: ICohort[]);
  getCohortParents(): ICohort[];

  children: IElement[];
  getCohortChildren(): ICohort[];

  filters: IAllFilters;
  hasfilterConflict(): boolean;
  usedFilter: ECloneFilterTypes;
  usedFilterParams:
    | ICohortEqualsFilterParams
    | ICohortNumFilterParams
    | ICohortGeneNumFilterParams
    | ICohortDepletionScoreFilterParams
    | ICohortPanelAnnotationFilterParams;

  clone(
    usedFilter: ECloneFilterTypes,
    filterParams:
      | ICohortEqualsFilterParams
      | ICohortNumFilterParams
      | ICohortGeneNumFilterParams
      | ICohortGeneEqualsFilterParams
      | ICohortDepletionScoreFilterParams
      | ICohortPanelAnnotationFilterParams,
  ): ICohort;

  get data(): Promise<IRow[]>;

  getBloodline(): IBloodlineElement[];
  updateBloodline();
}

export interface IInputCohort extends ICohort {
  outputCohorts: IOutputCohort[];
}

export interface IOutputCohort extends ICohort {
  isLastOutputCohort: boolean;
  isFirstOutputCohort: boolean;
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
  inputCohorts: IInputCohort[]; // combine can have multiple
  outputCohorts: IOutputCohort[];
  type: TaskType;
  label: string;
}
