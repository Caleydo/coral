import { Ajax, AppContext, IParams, IRow } from 'tdp_core';
import { deepCopy, log } from './util';

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

enum CohortRoutes {
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

interface IDataBaseToDisplay {
  value: string | number;
  name: string;
}

// copy from tdp_gene/src/constants.ts
// for 'Copy Number Class'
// table: copynumber, attribtue: copynumberclass
const mapCopyNumberCat: IDataBaseToDisplay[] = [
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
const mapMutationCat: IDataBaseToDisplay[] = [
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

enum DataMappingDirection {
  DB2Display,
  Display2DB,
}

// maps the database value to a display name
function mapDataBaseValueToDisplayName(
  mapObject: IDataBaseToDisplay[],
  valueLabel: string,
  values: { id: string | number; score: string | number }[],
): { id: string | number; score: string | number }[] {
  for (const v of values) {
    const vStr = v[`${valueLabel}`] === null ? 'null' : v[`${valueLabel}`].toString(); // convert values into string
    const currVauleMap = mapObject.filter((a) => vStr === a.value.toString()); // get map object
    const currDisplay = currVauleMap[0].name; // get display name of map object
    v[`${valueLabel}`] = currDisplay; // set the score value to the display name
  }
  return values;
}

// maps the display name to the database value
function mapDisplayNameToDataBaseValue(mapObject: IDataBaseToDisplay[], values: string[] | number[] | boolean[]): string[] | number[] {
  const newValues = [];
  for (const v of values) {
    const currVauleMap = mapObject.filter((a) => v === a.name); // get map object
    const currValue = currVauleMap[0].value; // get name of the map onject
    newValues.push(currValue);
  }
  return newValues;
}

// add the data mapping to the different attributes
function addDataValueMapping(table: string, attribute: string, values: any[], direction: DataMappingDirection, databaseValueLabel = 'score') {
  if (table === 'mutation' || table === 'copynumber') {
    if (attribute === 'aa_mutated' || attribute === 'dna_mutated') {
      log.debug('map either "AA_Mutated" or "DNA_Muatated" values: ', attribute);
      // For 'AA Mutated' and 'DNA Mutated'
      if (direction === DataMappingDirection.DB2Display) {
        // DB -> Display
        values = mapDataBaseValueToDisplayName(mapMutationCat, databaseValueLabel, values);
      } else {
        // Display -> DB
        values = mapDisplayNameToDataBaseValue(mapMutationCat, values);
      }
    } else if (attribute === 'copynumberclass') {
      log.debug('map "Copy Number Class" values: ', attribute);
      // For 'Copy Number Class'
      if (direction === DataMappingDirection.DB2Display) {
        // DB -> Display
        values = mapDataBaseValueToDisplayName(mapCopyNumberCat, databaseValueLabel, values);
      } else {
        // Display -> DB
        values = mapDisplayNameToDataBaseValue(mapCopyNumberCat, values);
      }
    }
  }

  return values;
}

// const CREATION_ROUTES = 'create' | 'createUseEqulasFilter' | 'createUseNumFilter' | 'createUseGeneNumFilter' | 'createUseGeneEqualsFilter' | 'createUseDepletionScoreFilter' | 'createUsePanelAnnotationFilter';
// const ENTITY_ROUTES = 'size' | 'cohortData';
// const CLONE_FILTER_ENTITY_ROUTES = 'sizeUseEqulasFilter' | 'dataUseEqulasFilter' | 'sizeUseNumFilter' | 'dataUseNumFilter';
// const CLONE_FILTER_SCORE_ROUTES = 'sizeUseGeneNumFilter' | 'dataUseGeneNumFilter' | 'sizeUseGeneEqualsFilter' | 'dataUseGeneEqualsFilter' | 'sizeUseDepletionScoreFilter' | 'dataUseDepletionScoreFilter' | 'sizeUsePanelAnnotationFilter' | 'dataUsePanelAnnotationFilter';
// const SCORE_ROUTES = 'geneScore' | 'celllineDepletionScore' | 'panelAnnotation';
// const HIST = 'hist'

function getCohortDataImpl(route: CohortRoutes, params: IParams = {}, assignIds = false) {
  if (assignIds) {
    params._assignids = true; // assign globally ids on the server side
  }

  const url = `/cohortdb/db/${route}`;
  const encoded = Ajax.encodeParams(params);
  if (encoded && url.length + encoded.length > Ajax.MAX_URL_LENGTH) {
    // use post instead
    return AppContext.getInstance().sendAPI(url, params, 'POST');
  }
  return AppContext.getInstance().getAPIJSON(url, params);
}

// const CREATION_ROUTES = 'create' | 'createUseEqulasFilter' | 'createUseNumFilter' | 'createUseGeneNumFilter' | 'createUseDepletionScoreFilter' | 'createUsePanelAnnotationFilter';
export function createDBCohort(params: ICohortDBParams, assignIds = false): Promise<IRow[]> {
  return getCohortDataImpl(CohortRoutes.create, params, assignIds);
}

function convertEqualValues(values: Array<string> | Array<number>): string {
  return values.join(valueListDelimiter);
}

export function createDBCohortWithEqualsFilter(params: ICohortDBWithEqualsFilterParams, assignIds = false): Promise<IRow[]> {
  const newParams = deepCopy(params) as IParams;
  newParams.values = convertEqualValues(params.values);
  return getCohortDataImpl(CohortRoutes.createUseEqulasFilter, newParams, assignIds);
}

function convertNumRanges(ranges: INumRange[]): string {
  let rangeString = '';
  for (const r of ranges) {
    let limits = `${r.operatorOne}_${r.valueOne}`;
    if (r.operatorTwo && r.valueTwo) {
      limits += `%${r.operatorTwo}_${r.valueTwo}`;
    }
    rangeString = `${rangeString + limits};`;
  }

  rangeString = rangeString.slice(0, -1); // remove the last ;
  return rangeString;
}

export function createDBCohortWithNumFilter(params: ICohortDBWithNumFilterParams, assignIds = false): Promise<IRow[]> {
  const newParams: IParams = {
    cohortId: params.cohortId,
    name: params.name,
    attribute: params.attribute,
    ranges: convertNumRanges(params.ranges),
  };
  return getCohortDataImpl(CohortRoutes.createUseNumFilter, newParams, assignIds);
}

export function createDBCohortWithGeneNumFilter(params: ICohortDBWithGeneNumFilterParams, assignIds = false): Promise<IRow[]> {
  const newParams: IParams = {
    cohortId: params.cohortId,
    name: params.name,
    table: params.table,
    attribute: params.attribute,
    ensg: params.ensg,
    ranges: convertNumRanges(params.ranges),
  };
  return getCohortDataImpl(CohortRoutes.createUseGeneNumFilter, newParams, assignIds);
}

export function createDBCohortWithGeneEqualsFilter(params: ICohortDBWithGeneEqualsFilterParams, assignIds = false): Promise<IRow[]> {
  const newParams = deepCopy(params) as IParams;
  let newValues = [].concat(newParams.values);
  // add data value mapping
  newValues = addDataValueMapping(params.table, params.attribute, newValues, DataMappingDirection.Display2DB);
  newParams.values = convertEqualValues(newValues);
  return getCohortDataImpl(CohortRoutes.createUseGeneEqualsFilter, newParams, assignIds);
}

export function createDBCohortWithDepletionScoreFilter(params: ICohortDBWithDepletionScoreFilterParams, assignIds = false): Promise<IRow[]> {
  const newParams: IParams = {
    cohortId: params.cohortId,
    name: params.name,
    table: params.table,
    attribute: params.attribute,
    ensg: params.ensg,
    depletionscreen: params.depletionscreen,
    ranges: convertNumRanges(params.ranges),
  };
  return getCohortDataImpl(CohortRoutes.createUseDepletionScoreFilter, newParams, assignIds);
}

export function createDBCohortWithPanelAnnotationFilter(params: ICohortDBWithPanelAnnotationFilterParams, assignIds = false): Promise<IRow[]> {
  const newParams = deepCopy(params) as IParams;
  newParams.values = convertEqualValues(params.values);
  return getCohortDataImpl(CohortRoutes.createUsePanelAnnotationFilter, newParams, assignIds);
}

export function createDBCohortWithTreatmentFilter(params: ICohortDBWithTreatmentFilterParams, assignIds = false): Promise<IRow[]> {
  const newParams = deepCopy(params) as IParams;
  if (newParams.agent === null) {
    delete newParams.agent;
  }
  if (newParams.agent) {
    newParams.agent = convertEqualValues(params.agent);
  }
  if (newParams.regimen === null) {
    delete newParams.regimen;
  }
  return getCohortDataImpl(CohortRoutes.createUseTreatmentFilter, newParams, assignIds);
}

// const ENTITY_ROUTES = 'size' | 'cohortData';
/**
 * returns the data a cohort represents
 */
export function getCohortData(params: ICohortDBDataParams, assignIds = false): Promise<IRow[]> {
  return getCohortDataImpl(CohortRoutes.cohortData, params, assignIds);
}

export async function getCohortSize(params: ICohortDBSizeParams, assignIds = false): Promise<number> {
  const sizeResp = await getCohortDataImpl(CohortRoutes.size, params, assignIds);
  return Promise.resolve(Number(sizeResp[0].size));
}

/**
 * returns the saved cohort tuples in the DB
 */
export function getDBCohortData(params: ICohortDBCohortDataParams, assignIds = false): Promise<ICohortRow[]> {
  const cohortIdsString = params.cohortIds.join(valueListDelimiter);
  delete params.cohortIds;
  const newParams = deepCopy(params) as IParams;
  newParams.cohortIds = cohortIdsString;
  return getCohortDataImpl(CohortRoutes.getDBCohorts, newParams, assignIds);
}

/**
 * updates the name of the cohort in the DB
 * @returns the updated cohort data from the DB
 */
export function updateCohortName(params: ICohortDBUpdateName, assignIds = false): Promise<ICohortRow[]> {
  return getCohortDataImpl(CohortRoutes.updateCohortName, params, assignIds);
}

// const CLONE_FILTER_ENTITY_ROUTES = 'sizeUseEqulasFilter' | 'dataUseEqulasFilter' | 'sizeUseNumFilter' | 'dataUseNumFilter';
export async function sizeDBCohortWithEqualsFilter(params: ICohortEqualsFilterParams, assignIds = false): Promise<number> {
  const valueString = convertEqualValues(params.values);
  delete params.values;
  const newParams = deepCopy(params) as IParams;
  newParams.values = valueString;
  const sizeResp = await getCohortDataImpl(CohortRoutes.sizeUseEqulasFilter, newParams, assignIds);
  return Promise.resolve(Number(sizeResp[0].size));
}

export function dataDBCohortWithEqualsFilter(params: ICohortEqualsFilterParams, assignIds = false): Promise<IRow[]> {
  const valueString = convertEqualValues(params.values);
  delete params.values;
  const newParams = deepCopy(params) as IParams;
  newParams.values = valueString;
  return getCohortDataImpl(CohortRoutes.dataUseEqulasFilter, newParams, assignIds);
}

export async function sizeDBCohortWithNumFilter(params: ICohortNumFilterParams, assignIds = false): Promise<number> {
  const newParams: IParams = {
    cohortId: params.cohortId,
    attribute: params.attribute,
    ranges: convertNumRanges(params.ranges),
  };
  const sizeResp = await getCohortDataImpl(CohortRoutes.sizeUseNumFilter, newParams, assignIds);
  return Promise.resolve(Number(sizeResp[0].size));
}

export function dataDBCohortWithNumFilter(params: ICohortNumFilterParams, assignIds = false): Promise<IRow[]> {
  const newParams: IParams = {
    cohortId: params.cohortId,
    attribute: params.attribute,
    ranges: convertNumRanges(params.ranges),
  };
  return getCohortDataImpl(CohortRoutes.dataUseNumFilter, newParams, assignIds);
}

// const CLONE_FILTER_SCORE_ROUTES = 'sizeUseGeneNumFilter' | 'dataUseGeneNumFilter' | 'sizeUseGeneEqualsFilter' | 'dataUseGeneEqualsFilter' | 'sizeUseDepletionScoreFilter' | 'dataUseDepletionScoreFilter' | 'sizeUsePanelAnnotationFilter' | 'dataUsePanelAnnotationFilter';
export async function sizeDBCohortGeneWithNumFilter(params: ICohortGeneNumFilterParams, assignIds = false): Promise<number> {
  const newParams: IParams = {
    cohortId: params.cohortId,
    table: params.table,
    attribute: params.attribute,
    ensg: params.ensg,
    ranges: convertNumRanges(params.ranges),
  };
  const sizeResp = await getCohortDataImpl(CohortRoutes.sizeUseGeneNumFilter, newParams, assignIds);
  return Promise.resolve(Number(sizeResp[0].size));
}

export function dataDBCohortGeneWithNumFilter(params: ICohortGeneNumFilterParams, assignIds = false): Promise<IRow[]> {
  const newParams: IParams = {
    cohortId: params.cohortId,
    table: params.table,
    attribute: params.attribute,
    ensg: params.ensg,
    ranges: convertNumRanges(params.ranges),
  };
  return getCohortDataImpl(CohortRoutes.dataUseGeneNumFilter, newParams, assignIds);
}

export async function sizeDBCohortGeneWithEqualsFilter(params: ICohortGeneEqualsFilterParams, assignIds = false): Promise<number> {
  const newParams = deepCopy(params) as IParams;
  newParams.values = convertEqualValues(params.values);

  const sizeResp = await getCohortDataImpl(CohortRoutes.sizeUseGeneEqualsFilter, newParams, assignIds);
  return Promise.resolve(Number(sizeResp[0].size));
}

export function dataDBCohortGeneWithEqualsFilter(params: ICohortGeneEqualsFilterParams, assignIds = false): Promise<IRow[]> {
  const newParams = deepCopy(params) as IParams;
  newParams.values = convertEqualValues(params.values);
  return getCohortDataImpl(CohortRoutes.dataUseGeneEqualsFilter, newParams, assignIds);
}

export async function sizeDBCohortDepletionScoreFilter(params: ICohortDepletionScoreFilterParams, assignIds = false): Promise<number> {
  const newParams: IParams = {
    cohortId: params.cohortId,
    table: params.table,
    attribute: params.attribute,
    ensg: params.ensg,
    depletionscreen: params.depletionscreen,
    ranges: convertNumRanges(params.ranges),
  };
  const sizeResp = await getCohortDataImpl(CohortRoutes.sizeUseDepletionScoreFilter, newParams, assignIds);
  return Promise.resolve(Number(sizeResp[0].size));
}

export function dataDBCohortDepletionScoreFilter(params: ICohortDepletionScoreFilterParams, assignIds = false): Promise<IRow[]> {
  const newParams: IParams = {
    cohortId: params.cohortId,
    table: params.table,
    attribute: params.attribute,
    ensg: params.ensg,
    depletionscreen: params.depletionscreen,
    ranges: convertNumRanges(params.ranges),
  };
  return getCohortDataImpl(CohortRoutes.dataUseDepletionScoreFilter, newParams, assignIds);
}

export async function sizeDBCohortPanelAnnotationFilter(params: ICohortPanelAnnotationFilterParams, assignIds = false): Promise<number> {
  const newParams = deepCopy(params) as IParams;
  newParams.values = convertEqualValues(params.values);
  const sizeResp = await getCohortDataImpl(CohortRoutes.sizeUsePanelAnnotationFilter, newParams, assignIds);
  return Promise.resolve(Number(sizeResp[0].size));
}

export function dataDBCohortPanelAnnotationFilter(params: ICohortPanelAnnotationFilterParams, assignIds = false): Promise<IRow[]> {
  const newParams = deepCopy(params) as IParams;
  newParams.values = convertEqualValues(params.values);
  return getCohortDataImpl(CohortRoutes.dataUsePanelAnnotationFilter, newParams, assignIds);
}

// const SCORE_ROUTES = 'geneScore' | 'celllineDepletionScore' | 'panelAnnotation';
export async function getCohortGeneScore(idType: 'tissue' | 'cellline' | 'more', params: ICohortDBGeneScoreParams, assignIds = false): Promise<IRow[]> {
  if (idType === 'tissue' || idType === 'cellline') {
    let values = await getCohortDataImpl(CohortRoutes.geneScore, params, assignIds);
    // add data value mapping
    values = addDataValueMapping(params.table, params.attribute, values, DataMappingDirection.DB2Display);
    return values;
  }
  return null;
}

export function getCohortDepletionScore(params: ICohortDBDepletionScoreParams, assignIds = false): Promise<IRow[]> {
  return getCohortDataImpl(CohortRoutes.celllineDepletionScore, params, assignIds);
}

export function getCohortPanelAnnotation(
  idType: 'tissue' | 'cellline' | 'gene' | 'more',
  params: ICohortDBPanelAnnotationParams,
  assignIds = false,
): Promise<IRow[]> {
  if (idType === 'tissue' || idType === 'cellline' || idType === 'gene') {
    return getCohortDataImpl(CohortRoutes.panelAnnotation, params, assignIds);
  }
  return null;
}

export enum HistRouteType {
  dataCat = 'dataCat',
  dataNum = 'dataNum',
  geneScoreCat = 'geneScoreCat',
  geneScoreNum = 'geneScoreNum',
  depletionScore = 'depletionScore',
  panelAnnotation = 'panelAnnotation',
}

export interface ICohortDBHistDataParms extends IParams {
  cohortId: number;
  attribute: string;
}

export interface ICohortDBHistScoreParms extends ICohortDBHistDataParms {
  // extends
  // cohortId: number;
  // attribute: string;
  table: string;
  ensg: string;
}

export interface ICohortDBHistScoreDepletionParms extends ICohortDBHistScoreParms {
  // extends
  // cohortId: number;
  // attribute: string;
  // table: string;
  // ensg: string;
  depletionscreen: string;
}

export interface ICohortDBHistPanelParms extends IParams {
  cohortId: number;
  panel: string;
}

// const HIST = 'hist'
export async function getCohortHist(
  histType: HistRouteType,
  params: ICohortDBHistDataParms | ICohortDBHistScoreParms | ICohortDBHistScoreDepletionParms | ICohortDBHistPanelParms,
  assignIds = false,
): Promise<{ bin: string; count: number }[]> {
  params.type = histType;
  let bins = await getCohortDataImpl(CohortRoutes.hist, params, assignIds);
  if (params.type === HistRouteType.geneScoreCat || params.type === HistRouteType.geneScoreNum) {
    // add data value mapping
    bins = addDataValueMapping(
      (params as ICohortDBHistScoreParms).table,
      (params as ICohortDBHistScoreParms).attribute,
      bins,
      DataMappingDirection.DB2Display,
      'bin',
    );
  }
  return bins;
}
