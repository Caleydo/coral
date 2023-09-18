import { Ajax, AppContext, IRow } from 'visyn_core/base';
import { IParams } from 'tdp_core';
import { deepCopy, log } from '../util';
import {
  CohortRoutes,
  DataMappingDirection,
  HistRouteType,
  ICohortDBCohortDataParams,
  ICohortDBDataParams, ICohortDBDataRecommendSplitParams,
  ICohortDBDepletionScoreParams,
  ICohortDBGeneScoreParams,
  ICohortDBPanelAnnotationParams,
  ICohortDBParams,
  ICohortDBSizeParams,
  ICohortDBUpdateName, ICohortDBWithAutoSplitParams,
  ICohortDBWithDepletionScoreFilterParams,
  ICohortDBWithEqualsFilterParams,
  ICohortDBWithGeneEqualsFilterParams,
  ICohortDBWithGeneNumFilterParams,
  ICohortDBWithNumFilterParams,
  ICohortDBWithPanelAnnotationFilterParams,
  ICohortDBWithTreatmentFilterParams,
  ICohortDepletionScoreFilterParams,
  ICohortEqualsFilterParams,
  ICohortGeneEqualsFilterParams,
  ICohortGeneNumFilterParams, ICohortMultiAttrDBDataParams,
  ICohortNumFilterParams,
  ICohortPanelAnnotationFilterParams,
  ICohortRow,
  IDataBaseToDisplay,
  INumRange,
  mapCopyNumberCat,
  mapMutationCat,
  valueListDelimiter,
} from './interfaces';

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

// export function createDBCohortAutomatically(params: ICohortDBWithNumFilterParams, assignIds = false): Promise<IRow[]> {
//   const newParams: IParams = {
//     cohortId: params.cohortId,
//     name: params.name,
//     attribute: params.attribute,
//     ranges: convertNumRanges(params.ranges),
//   };
//   return getCohortDataImpl(CohortRoutes.createAutomatically, newParams, assignIds);
// }

export function recommendSplitDB(params: ICohortDBDataRecommendSplitParams, assignIds = false): Promise<IRow[]> {
  const url = `/cohortdb/db/${'recommendSplit'}`;
  const encoded = Ajax.encodeParams(params);
  if (encoded && url.length + encoded.length > Ajax.MAX_URL_LENGTH) {
    // use post instead
    return AppContext.getInstance().sendAPI(url, params, 'POST');
  }
  return AppContext.getInstance().getAPIJSON(url, params);
}

// TODO: remove this? not used?
export function createDBCohortAutomatically(params: ICohortMultiAttrDBDataParams, assignIds = false): Promise<IRow[]> {
  let newParams: IParams = {};
  // check if params is ICohortDBDataParams
  if("attributes" in params){
    newParams = {
      cohortId: params.cohortId,
      name: "TODO: create name",
      attribute0: params.attribute0,
      attribute1: params.attribute1,
      attribute0type: params.attribute0type,
      attribute1type: params.attribute1type,
      numberOfClusters: params.numberOfClusters,
      attributes: params.attributes
    };
  } else {
    newParams = {
      cohortId: params.cohortId,
      name: "TODO: create name",
      attribute0: params.attribute0,
      attribute1: params.attribute1,
      attribute0type: params.attribute0type,
      attribute1type: params.attribute1type,
      numberOfClusters: params.numberOfClusters,
    };
  }

  return getCohortDataImpl(CohortRoutes.createAutomatically, newParams, assignIds);
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
