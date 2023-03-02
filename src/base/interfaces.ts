import { IParams } from 'tdp_core';

export interface ICohortDBParams extends IParams {
  name: string;
  isInitial: number; // 0 = false, 1 = true
  previous: number;
  database: string;
  schema: string;
  table: string;
}

export interface ICohortEqualsFilterParams extends IParams, IEqualsList {
  cohortId: number;
  attribute: string;
  numeric: 'true' | 'false';
}

export interface ICohortDBWithEqualsFilterParams extends ICohortEqualsFilterParams {
  name: string;
}

export interface ICohortNumFilterParams {
  cohortId: number;
  attribute: string;
  ranges: Array<INumRange>;
}

export interface ICohortGeneNumFilterParams extends ICohortNumFilterParams {
  table: string;
  ensg: string;
}

export interface ICohortGeneEqualsFilterParams extends ICohortEqualsFilterParams {
  table: string;
  ensg: string;
}

export interface ICohortDBWithNumFilterParams extends ICohortNumFilterParams {
  name: string;
}

export const valueListDelimiter = '&#x2e31;';

export interface IEqualsList {
  values: Array<string> | Array<number>;
}

/**
 *  Type Guard 💂‍♂️ helper because interfaces can't be checked if instanceof
 * @param filter
 */
export function isEqualsList(filter: INumRange | IEqualsList): filter is IEqualsList {
  return (filter as IEqualsList).values && Array.isArray((filter as IEqualsList).values); // checking the type of the array requires to check every item but this should be sufficently safe
}

export enum NumRangeOperators {
  lt = 'lt',
  lte = 'lte',
  gt = 'gt',
  gte = 'gte',
}
export interface INumRange {
  operatorOne: NumRangeOperators;
  valueOne: number | 'null';
  operatorTwo?: NumRangeOperators;
  valueTwo?: number | 'null';
}

/**
 *  Type Guard 💂‍♂️ helper because interfaces can't be checked if instanceof
 * @param filter
 */
export function isNumRangeFilter(filter: INumRange | IEqualsList): filter is INumRange {
  return (filter as INumRange).operatorOne !== undefined && (filter as INumRange).valueOne !== undefined; // check the non-optional properties
}
export interface ICohortDBDataParams extends IParams {
  cohortId: number;
  attribute?: string;
}

export interface ICohortDBSizeParams extends IParams {
  cohortId: number;
}

export interface ICohortDBCohortDataParams extends IParams {
  cohortIds: number[];
}

export interface ICohortDBUpdateName extends IParams {
  cohortId: number;
  name: string;
}
export interface ICohortDBGeneScoreParams extends IParams {
  cohortId: number;
  table: string;
  attribute: string;
  ensg: string;
}

export interface ICohortDBDepletionScoreParams extends ICohortDBGeneScoreParams {
  depletionscreen: string;
}

export interface ICohortDBPanelAnnotationParams extends IParams {
  cohortId: number;
  panel: string;
}

export interface ICohortDepletionScoreFilterParams {
  cohortId: number;
  table: string;
  attribute: string;
  ensg: string;
  depletionscreen: string;
  ranges: Array<INumRange>;
}

export interface ICohortDBWithGeneNumFilterParams extends ICohortDBWithNumFilterParams {
  table: string;
  ensg: string;
}

export interface ICohortDBWithGeneEqualsFilterParams extends ICohortDBWithEqualsFilterParams {
  table: string;
  ensg: string;
}

export interface ICohortDBWithDepletionScoreFilterParams extends ICohortDBWithGeneNumFilterParams {
  depletionscreen: string;
}

export interface ICohortDBWithPanelAnnotationFilterParams extends IParams {
  cohortId: number;
  name: string;
  panel: string;
  values: Array<string>;
}

export interface ICohortPanelAnnotationFilterParams extends IParams {
  cohortId: number;
  panel: string;
  values: Array<string>;
}

export interface ICohortDBWithTreatmentFilterParams extends IParams {
  cohortId: number;
  name: string;
  baseAgent: boolean;
  agent?: Array<string>;
  regimen?: number;
}

export enum CohortRoutes {
  create = 'create',
  createUseEqulasFilter = 'createUseEqulasFilter',
  dataUseEqulasFilter = 'dataUseEqulasFilter',
  sizeUseEqulasFilter = 'sizeUseEqulasFilter',
  createUseNumFilter = 'createUseNumFilter',
  dataUseNumFilter = 'dataUseNumFilter',
  sizeUseNumFilter = 'sizeUseNumFilter',
  createUseGeneNumFilter = 'createUseGeneNumFilter',
  dataUseGeneNumFilter = 'dataUseGeneNumFilter',
  sizeUseGeneNumFilter = 'sizeUseGeneNumFilter',
  createUseGeneEqualsFilter = 'createUseGeneEqualsFilter',
  sizeUseGeneEqualsFilter = 'sizeUseGeneEqualsFilter',
  dataUseGeneEqualsFilter = 'dataUseGeneEqualsFilter',
  cohortData = 'cohortData',
  size = 'size',
  getDBCohorts = 'getDBCohorts',
  updateCohortName = 'updateCohortName',
  geneScore = 'geneScore',
  celllineDepletionScore = 'celllineDepletionScore',
  createUseDepletionScoreFilter = 'createUseDepletionScoreFilter',
  dataUseDepletionScoreFilter = 'dataUseDepletionScoreFilter',
  sizeUseDepletionScoreFilter = 'sizeUseDepletionScoreFilter',
  panelAnnotation = 'panelAnnotation',
  createUsePanelAnnotationFilter = 'createUsePanelAnnotationFilter',
  dataUsePanelAnnotationFilter = 'dataUsePanelAnnotationFilter',
  sizeUsePanelAnnotationFilter = 'sizeUsePanelAnnotationFilter',
  hist = 'hist',
  createUseTreatmentFilter = 'createUseTreatmentFilter',
}

export interface IDataBaseToDisplay {
  value: string | number;
  name: string;
}

// copy from tdp_publicdb/src/constants.ts
// for 'Copy Number Class'
// table: copynumber, attribtue: copynumberclass
export const mapCopyNumberCat: IDataBaseToDisplay[] = [
  { value: 2, name: 'Amplification' },
  { value: -2, name: 'Deep Deletion' },
  // {value: -1, name: 'Heterozygous deletion'},
  { value: 0, name: 'NORMAL' },
  // {value: 1, name: 'Low level amplification'},
  // {value: 2, name: 'High level amplification'},
  { value: 'null', name: 'Unknown' },
  { value: '!null', name: '!null' },
];

// for 'AA Mutated' and 'DNA Mutated'
// table: mutation, attribute: aa_mutated / dna_mutated
export const mapMutationCat: IDataBaseToDisplay[] = [
  { value: 'true', name: 'Mutated' },
  { value: 'false', name: 'Non Mutated' },
  { value: 'null', name: 'Unknown' },
  { value: '!null', name: '!null' },
];

/**
 * Interface for the cohort tuple (row) in the DB
 */
export interface ICohortRow {
  id: number;
  name: string;
  entity_database: string;
  entity_schema: string;
  entity_table: string;
  is_initial: number;
}

export enum DataMappingDirection {
  DB2Display,
  Display2DB,
}

export enum HistRouteType {
  dataCat = 'dataCat',
  dataNum = 'dataNum',
  geneScoreCat = 'geneScoreCat',
  geneScoreNum = 'geneScoreNum',
  depletionScore = 'depletionScore',
  panelAnnotation = 'panelAnnotation',
}
