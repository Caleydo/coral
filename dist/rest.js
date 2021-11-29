import { Ajax, AppContext } from 'tdp_core';
import { deepCopy, log } from './util';
export const valueListDelimiter = '&#x2e31;';
/**
 *  Type Guard 💂‍♂️ helper because interfaces can't be checked if instanceof
 * @param filter
 */
export function isEqualsList(filter) {
    return filter.values && Array.isArray(filter.values); // checking the type of the array requires to check every item but this should be sufficently safe
}
export var NumRangeOperators;
(function (NumRangeOperators) {
    NumRangeOperators["lt"] = "lt";
    NumRangeOperators["lte"] = "lte";
    NumRangeOperators["gt"] = "gt";
    NumRangeOperators["gte"] = "gte";
})(NumRangeOperators || (NumRangeOperators = {}));
/**
 *  Type Guard 💂‍♂️ helper because interfaces can't be checked if instanceof
 * @param filter
 */
export function isNumRangeFilter(filter) {
    return filter.operatorOne !== undefined && filter.valueOne !== undefined; // check the non-optional properties
}
var CohortRoutes;
(function (CohortRoutes) {
    CohortRoutes["create"] = "create";
    CohortRoutes["createUseEqulasFilter"] = "createUseEqulasFilter";
    CohortRoutes["dataUseEqulasFilter"] = "dataUseEqulasFilter";
    CohortRoutes["sizeUseEqulasFilter"] = "sizeUseEqulasFilter";
    CohortRoutes["createUseNumFilter"] = "createUseNumFilter";
    CohortRoutes["dataUseNumFilter"] = "dataUseNumFilter";
    CohortRoutes["sizeUseNumFilter"] = "sizeUseNumFilter";
    CohortRoutes["createUseGeneNumFilter"] = "createUseGeneNumFilter";
    CohortRoutes["dataUseGeneNumFilter"] = "dataUseGeneNumFilter";
    CohortRoutes["sizeUseGeneNumFilter"] = "sizeUseGeneNumFilter";
    CohortRoutes["createUseGeneEqualsFilter"] = "createUseGeneEqualsFilter";
    CohortRoutes["sizeUseGeneEqualsFilter"] = "sizeUseGeneEqualsFilter";
    CohortRoutes["dataUseGeneEqualsFilter"] = "dataUseGeneEqualsFilter";
    CohortRoutes["cohortData"] = "cohortData";
    CohortRoutes["size"] = "size";
    CohortRoutes["getDBCohorts"] = "getDBCohorts";
    CohortRoutes["updateCohortName"] = "updateCohortName";
    CohortRoutes["geneScore"] = "geneScore";
    CohortRoutes["celllineDepletionScore"] = "celllineDepletionScore";
    CohortRoutes["createUseDepletionScoreFilter"] = "createUseDepletionScoreFilter";
    CohortRoutes["dataUseDepletionScoreFilter"] = "dataUseDepletionScoreFilter";
    CohortRoutes["sizeUseDepletionScoreFilter"] = "sizeUseDepletionScoreFilter";
    CohortRoutes["panelAnnotation"] = "panelAnnotation";
    CohortRoutes["createUsePanelAnnotationFilter"] = "createUsePanelAnnotationFilter";
    CohortRoutes["dataUsePanelAnnotationFilter"] = "dataUsePanelAnnotationFilter";
    CohortRoutes["sizeUsePanelAnnotationFilter"] = "sizeUsePanelAnnotationFilter";
    CohortRoutes["hist"] = "hist";
    CohortRoutes["createUseTreatmentFilter"] = "createUseTreatmentFilter";
})(CohortRoutes || (CohortRoutes = {}));
// copy from tdp_gene/src/constants.ts
// for 'Copy Number Class'
// table: copynumber, attribtue: copynumberclass
const mapCopyNumberCat = [
    { value: 2, name: 'Amplification' },
    { value: -2, name: 'Deep Deletion' },
    //{value: -1, name: 'Heterozygous deletion'},
    { value: 0, name: 'NORMAL' },
    //{value: 1, name: 'Low level amplification'},
    //{value: 2, name: 'High level amplification'},
    { value: 'null', name: 'Unknown' },
    { value: '!null', name: '!null' }
];
// for 'AA Mutated' and 'DNA Mutated'
// table: mutation, attribute: aa_mutated / dna_mutated
const mapMutationCat = [
    { value: 'true', name: 'Mutated' },
    { value: 'false', name: 'Non Mutated' },
    { value: 'null', name: 'Unknown' },
    { value: '!null', name: '!null' }
];
var DataMappingDirection;
(function (DataMappingDirection) {
    DataMappingDirection[DataMappingDirection["DB2Display"] = 0] = "DB2Display";
    DataMappingDirection[DataMappingDirection["Display2DB"] = 1] = "Display2DB";
})(DataMappingDirection || (DataMappingDirection = {}));
// maps the database value to a display name
function mapDataBaseValueToDisplayName(mapObject, valueLabel, values) {
    for (const v of values) {
        const vStr = v['' + valueLabel] === null ? 'null' : v['' + valueLabel].toString(); // convert values into string
        const currVauleMap = mapObject.filter((a) => vStr === a.value.toString()); // get map object
        const currDisplay = currVauleMap[0].name; // get display name of map object
        v['' + valueLabel] = currDisplay; // set the score value to the display name
    }
    return values;
}
// maps the display name to the database value
function mapDisplayNameToDataBaseValue(mapObject, values) {
    const newValues = [];
    for (const v of values) {
        const currVauleMap = mapObject.filter((a) => v === a.name); // get map object
        const currValue = currVauleMap[0].value; // get name of the map onject
        newValues.push(currValue);
    }
    return newValues;
}
// add the data mapping to the different attributes
function addDataValueMapping(table, attribute, values, direction, databaseValueLabel = 'score') {
    if (table === 'mutation' || table === 'copynumber') {
        if (attribute === 'aa_mutated' || attribute === 'dna_mutated') {
            log.debug('map either "AA_Mutated" or "DNA_Muatated" values: ', attribute);
            // For 'AA Mutated' and 'DNA Mutated'
            if (direction === DataMappingDirection.DB2Display) {
                // DB -> Display
                values = mapDataBaseValueToDisplayName(mapMutationCat, databaseValueLabel, values);
            }
            else {
                // Display -> DB
                values = mapDisplayNameToDataBaseValue(mapMutationCat, values);
            }
        }
        else if (attribute === 'copynumberclass') {
            log.debug('map "Copy Number Class" values: ', attribute);
            // For 'Copy Number Class'
            if (direction === DataMappingDirection.DB2Display) {
                // DB -> Display
                values = mapDataBaseValueToDisplayName(mapCopyNumberCat, databaseValueLabel, values);
            }
            else {
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
function getCohortDataImpl(route, params = {}, assignIds = false) {
    if (assignIds) {
        params._assignids = true; // assign globally ids on the server side
    }
    const url = `/cohortdb/db/${route}`;
    const encoded = Ajax.encodeParams(params);
    if (encoded && (url.length + encoded.length > Ajax.MAX_URL_LENGTH)) {
        // use post instead
        return AppContext.getInstance().sendAPI(url, params, 'POST');
    }
    return AppContext.getInstance().getAPIJSON(url, params);
}
// const CREATION_ROUTES = 'create' | 'createUseEqulasFilter' | 'createUseNumFilter' | 'createUseGeneNumFilter' | 'createUseDepletionScoreFilter' | 'createUsePanelAnnotationFilter';
export function createDBCohort(params, assignIds = false) {
    return getCohortDataImpl(CohortRoutes.create, params, assignIds);
}
function convertEqualValues(values) {
    return values.join(valueListDelimiter);
}
export function createDBCohortWithEqualsFilter(params, assignIds = false) {
    const newParams = deepCopy(params);
    newParams.values = convertEqualValues(params.values);
    return getCohortDataImpl(CohortRoutes.createUseEqulasFilter, newParams, assignIds);
}
function convertNumRanges(ranges) {
    let rangeString = '';
    for (const r of ranges) {
        let limits = `${r.operatorOne}_${r.valueOne}`;
        if (r.operatorTwo && r.valueTwo) {
            limits = limits + `%${r.operatorTwo}_${r.valueTwo}`;
        }
        rangeString = rangeString + limits + ';';
    }
    rangeString = rangeString.slice(0, -1); // remove the last ;
    return rangeString;
}
export function createDBCohortWithNumFilter(params, assignIds = false) {
    const newParams = {
        cohortId: params.cohortId,
        name: params.name,
        attribute: params.attribute,
        ranges: convertNumRanges(params.ranges)
    };
    return getCohortDataImpl(CohortRoutes.createUseNumFilter, newParams, assignIds);
}
export function createDBCohortWithGeneNumFilter(params, assignIds = false) {
    const newParams = {
        cohortId: params.cohortId,
        name: params.name,
        table: params.table,
        attribute: params.attribute,
        ensg: params.ensg,
        ranges: convertNumRanges(params.ranges)
    };
    return getCohortDataImpl(CohortRoutes.createUseGeneNumFilter, newParams, assignIds);
}
export function createDBCohortWithGeneEqualsFilter(params, assignIds = false) {
    const newParams = deepCopy(params);
    let newValues = [].concat(newParams.values);
    // add data value mapping
    newValues = addDataValueMapping(params.table, params.attribute, newValues, DataMappingDirection.Display2DB);
    newParams.values = convertEqualValues(newValues);
    return getCohortDataImpl(CohortRoutes.createUseGeneEqualsFilter, newParams, assignIds);
}
export function createDBCohortWithDepletionScoreFilter(params, assignIds = false) {
    const newParams = {
        cohortId: params.cohortId,
        name: params.name,
        table: params.table,
        attribute: params.attribute,
        ensg: params.ensg,
        depletionscreen: params.depletionscreen,
        ranges: convertNumRanges(params.ranges)
    };
    return getCohortDataImpl(CohortRoutes.createUseDepletionScoreFilter, newParams, assignIds);
}
export function createDBCohortWithPanelAnnotationFilter(params, assignIds = false) {
    const newParams = deepCopy(params);
    newParams.values = convertEqualValues(params.values);
    return getCohortDataImpl(CohortRoutes.createUsePanelAnnotationFilter, newParams, assignIds);
}
export function createDBCohortWithTreatmentFilter(params, assignIds = false) {
    const newParams = deepCopy(params);
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
export function getCohortData(params, assignIds = false) {
    return getCohortDataImpl(CohortRoutes.cohortData, params, assignIds);
}
export async function getCohortSize(params, assignIds = false) {
    const sizeResp = await getCohortDataImpl(CohortRoutes.size, params, assignIds);
    return Promise.resolve(Number(sizeResp[0].size));
}
/**
 * returns the saved cohort tuples in the DB
 */
export function getDBCohortData(params, assignIds = false) {
    const cohortIdsString = params.cohortIds.join(valueListDelimiter);
    delete params.cohortIds;
    const newParams = deepCopy(params);
    newParams.cohortIds = cohortIdsString;
    return getCohortDataImpl(CohortRoutes.getDBCohorts, newParams, assignIds);
}
/**
 * updates the name of the cohort in the DB
 * @returns the updated cohort data from the DB
 */
export function updateCohortName(params, assignIds = false) {
    return getCohortDataImpl(CohortRoutes.updateCohortName, params, assignIds);
}
// const CLONE_FILTER_ENTITY_ROUTES = 'sizeUseEqulasFilter' | 'dataUseEqulasFilter' | 'sizeUseNumFilter' | 'dataUseNumFilter';
export async function sizeDBCohortWithEqualsFilter(params, assignIds = false) {
    const valueString = convertEqualValues(params.values);
    delete params.values;
    const newParams = deepCopy(params);
    newParams.values = valueString;
    const sizeResp = await getCohortDataImpl(CohortRoutes.sizeUseEqulasFilter, newParams, assignIds);
    return Promise.resolve(Number(sizeResp[0].size));
}
export function dataDBCohortWithEqualsFilter(params, assignIds = false) {
    const valueString = convertEqualValues(params.values);
    delete params.values;
    const newParams = deepCopy(params);
    newParams.values = valueString;
    return getCohortDataImpl(CohortRoutes.dataUseEqulasFilter, newParams, assignIds);
}
export async function sizeDBCohortWithNumFilter(params, assignIds = false) {
    const newParams = {
        cohortId: params.cohortId,
        attribute: params.attribute,
        ranges: convertNumRanges(params.ranges)
    };
    const sizeResp = await getCohortDataImpl(CohortRoutes.sizeUseNumFilter, newParams, assignIds);
    return Promise.resolve(Number(sizeResp[0].size));
}
export function dataDBCohortWithNumFilter(params, assignIds = false) {
    const newParams = {
        cohortId: params.cohortId,
        attribute: params.attribute,
        ranges: convertNumRanges(params.ranges)
    };
    return getCohortDataImpl(CohortRoutes.dataUseNumFilter, newParams, assignIds);
}
// const CLONE_FILTER_SCORE_ROUTES = 'sizeUseGeneNumFilter' | 'dataUseGeneNumFilter' | 'sizeUseGeneEqualsFilter' | 'dataUseGeneEqualsFilter' | 'sizeUseDepletionScoreFilter' | 'dataUseDepletionScoreFilter' | 'sizeUsePanelAnnotationFilter' | 'dataUsePanelAnnotationFilter';
export async function sizeDBCohortGeneWithNumFilter(params, assignIds = false) {
    const newParams = {
        cohortId: params.cohortId,
        table: params.table,
        attribute: params.attribute,
        ensg: params.ensg,
        ranges: convertNumRanges(params.ranges)
    };
    const sizeResp = await getCohortDataImpl(CohortRoutes.sizeUseGeneNumFilter, newParams, assignIds);
    return Promise.resolve(Number(sizeResp[0].size));
}
export function dataDBCohortGeneWithNumFilter(params, assignIds = false) {
    const newParams = {
        cohortId: params.cohortId,
        table: params.table,
        attribute: params.attribute,
        ensg: params.ensg,
        ranges: convertNumRanges(params.ranges)
    };
    return getCohortDataImpl(CohortRoutes.dataUseGeneNumFilter, newParams, assignIds);
}
export async function sizeDBCohortGeneWithEqualsFilter(params, assignIds = false) {
    const newParams = deepCopy(params);
    newParams.values = convertEqualValues(params.values);
    const sizeResp = await getCohortDataImpl(CohortRoutes.sizeUseGeneEqualsFilter, newParams, assignIds);
    return Promise.resolve(Number(sizeResp[0].size));
}
export function dataDBCohortGeneWithEqualsFilter(params, assignIds = false) {
    const newParams = deepCopy(params);
    newParams.values = convertEqualValues(params.values);
    return getCohortDataImpl(CohortRoutes.dataUseGeneEqualsFilter, newParams, assignIds);
}
export async function sizeDBCohortDepletionScoreFilter(params, assignIds = false) {
    const newParams = {
        cohortId: params.cohortId,
        table: params.table,
        attribute: params.attribute,
        ensg: params.ensg,
        depletionscreen: params.depletionscreen,
        ranges: convertNumRanges(params.ranges)
    };
    const sizeResp = await getCohortDataImpl(CohortRoutes.sizeUseDepletionScoreFilter, newParams, assignIds);
    return Promise.resolve(Number(sizeResp[0].size));
}
export function dataDBCohortDepletionScoreFilter(params, assignIds = false) {
    const newParams = {
        cohortId: params.cohortId,
        table: params.table,
        attribute: params.attribute,
        ensg: params.ensg,
        depletionscreen: params.depletionscreen,
        ranges: convertNumRanges(params.ranges)
    };
    return getCohortDataImpl(CohortRoutes.dataUseDepletionScoreFilter, newParams, assignIds);
}
export async function sizeDBCohortPanelAnnotationFilter(params, assignIds = false) {
    const newParams = deepCopy(params);
    newParams.values = convertEqualValues(params.values);
    const sizeResp = await getCohortDataImpl(CohortRoutes.sizeUsePanelAnnotationFilter, newParams, assignIds);
    return Promise.resolve(Number(sizeResp[0].size));
}
export function dataDBCohortPanelAnnotationFilter(params, assignIds = false) {
    const newParams = deepCopy(params);
    newParams.values = convertEqualValues(params.values);
    return getCohortDataImpl(CohortRoutes.dataUsePanelAnnotationFilter, newParams, assignIds);
}
// const SCORE_ROUTES = 'geneScore' | 'celllineDepletionScore' | 'panelAnnotation';
export async function getCohortGeneScore(idType, params, assignIds = false) {
    if (idType === 'tissue' || idType === 'cellline') {
        let values = await getCohortDataImpl(CohortRoutes.geneScore, params, assignIds);
        // add data value mapping
        values = addDataValueMapping(params.table, params.attribute, values, DataMappingDirection.DB2Display);
        return values;
    }
    else {
        return null;
    }
}
export function getCohortDepletionScore(params, assignIds = false) {
    return getCohortDataImpl(CohortRoutes.celllineDepletionScore, params, assignIds);
}
export function getCohortPanelAnnotation(idType, params, assignIds = false) {
    if (idType === 'tissue' || idType === 'cellline' || idType === 'gene') {
        return getCohortDataImpl(CohortRoutes.panelAnnotation, params, assignIds);
    }
    else {
        return null;
    }
}
export var HistRouteType;
(function (HistRouteType) {
    HistRouteType["dataCat"] = "dataCat";
    HistRouteType["dataNum"] = "dataNum";
    HistRouteType["geneScoreCat"] = "geneScoreCat";
    HistRouteType["geneScoreNum"] = "geneScoreNum";
    HistRouteType["depletionScore"] = "depletionScore";
    HistRouteType["panelAnnotation"] = "panelAnnotation";
})(HistRouteType || (HistRouteType = {}));
// const HIST = 'hist'
export async function getCohortHist(histType, params, assignIds = false) {
    params.type = histType;
    let bins = await getCohortDataImpl(CohortRoutes.hist, params, assignIds);
    if (params.type === HistRouteType.geneScoreCat || params.type === HistRouteType.geneScoreNum) {
        // add data value mapping
        bins = addDataValueMapping(params.table, params.attribute, bins, DataMappingDirection.DB2Display, 'bin');
    }
    return bins;
}
//# sourceMappingURL=rest.js.map