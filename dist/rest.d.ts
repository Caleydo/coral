import { IParams, IRow } from 'tdp_core';
export interface ICohortDBParams extends IParams {
    name: string;
    isInitial: number;
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
export declare const valueListDelimiter = "&#x2e31;";
export interface IEqualsList {
    values: Array<string> | Array<number>;
}
/**
 *  Type Guard 💂‍♂️ helper because interfaces can't be checked if instanceof
 * @param filter
 */
export declare function isEqualsList(filter: INumRange | IEqualsList): filter is IEqualsList;
export declare enum NumRangeOperators {
    lt = "lt",
    lte = "lte",
    gt = "gt",
    gte = "gte"
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
export declare function isNumRangeFilter(filter: INumRange | IEqualsList): filter is INumRange;
export interface ICohortDBDataParams extends IParams {
    cohortId: number;
    attribute?: string;
}
export interface ICohortDBSizeParams extends IParams {
    cohortId: number;
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
export declare function createDBCohort(params: ICohortDBParams, assignIds?: boolean): Promise<IRow[]>;
export declare function createDBCohortWithEqualsFilter(params: ICohortDBWithEqualsFilterParams, assignIds?: boolean): Promise<IRow[]>;
export declare function createDBCohortWithNumFilter(params: ICohortDBWithNumFilterParams, assignIds?: boolean): Promise<IRow[]>;
export declare function createDBCohortWithGeneNumFilter(params: ICohortDBWithGeneNumFilterParams, assignIds?: boolean): Promise<IRow[]>;
export declare function createDBCohortWithGeneEqualsFilter(params: ICohortDBWithGeneEqualsFilterParams, assignIds?: boolean): Promise<IRow[]>;
export declare function createDBCohortWithDepletionScoreFilter(params: ICohortDBWithDepletionScoreFilterParams, assignIds?: boolean): Promise<IRow[]>;
export declare function createDBCohortWithPanelAnnotationFilter(params: ICohortDBWithPanelAnnotationFilterParams, assignIds?: boolean): Promise<IRow[]>;
export declare function createDBCohortWithTreatmentFilter(params: ICohortDBWithTreatmentFilterParams, assignIds?: boolean): Promise<IRow[]>;
export declare function getCohortData(params: ICohortDBDataParams, assignIds?: boolean): Promise<IRow[]>;
export declare function getCohortSize(params: ICohortDBSizeParams, assignIds?: boolean): Promise<number>;
export declare function sizeDBCohortWithEqualsFilter(params: ICohortEqualsFilterParams, assignIds?: boolean): Promise<number>;
export declare function dataDBCohortWithEqualsFilter(params: ICohortEqualsFilterParams, assignIds?: boolean): Promise<IRow[]>;
export declare function sizeDBCohortWithNumFilter(params: ICohortNumFilterParams, assignIds?: boolean): Promise<number>;
export declare function dataDBCohortWithNumFilter(params: ICohortNumFilterParams, assignIds?: boolean): Promise<IRow[]>;
export declare function sizeDBCohortGeneWithNumFilter(params: ICohortGeneNumFilterParams, assignIds?: boolean): Promise<number>;
export declare function dataDBCohortGeneWithNumFilter(params: ICohortGeneNumFilterParams, assignIds?: boolean): Promise<IRow[]>;
export declare function sizeDBCohortGeneWithEqualsFilter(params: ICohortGeneEqualsFilterParams, assignIds?: boolean): Promise<number>;
export declare function dataDBCohortGeneWithEqualsFilter(params: ICohortGeneEqualsFilterParams, assignIds?: boolean): Promise<IRow[]>;
export declare function sizeDBCohortDepletionScoreFilter(params: ICohortDepletionScoreFilterParams, assignIds?: boolean): Promise<number>;
export declare function dataDBCohortDepletionScoreFilter(params: ICohortDepletionScoreFilterParams, assignIds?: boolean): Promise<IRow[]>;
export declare function sizeDBCohortPanelAnnotationFilter(params: ICohortPanelAnnotationFilterParams, assignIds?: boolean): Promise<number>;
export declare function dataDBCohortPanelAnnotationFilter(params: ICohortPanelAnnotationFilterParams, assignIds?: boolean): Promise<IRow[]>;
export declare function getCohortGeneScore(idType: 'tissue' | 'cellline' | 'more', params: ICohortDBGeneScoreParams, assignIds?: boolean): Promise<IRow[]>;
export declare function getCohortDepletionScore(params: ICohortDBDepletionScoreParams, assignIds?: boolean): Promise<IRow[]>;
export declare function getCohortPanelAnnotation(idType: 'tissue' | 'cellline' | 'gene' | 'more', params: ICohortDBPanelAnnotationParams, assignIds?: boolean): Promise<IRow[]>;
export declare enum HistRouteType {
    dataCat = "dataCat",
    dataNum = "dataNum",
    geneScoreCat = "geneScoreCat",
    geneScoreNum = "geneScoreNum",
    depletionScore = "depletionScore",
    panelAnnotation = "panelAnnotation"
}
export interface ICohortDBHistDataParms extends IParams {
    cohortId: number;
    attribute: string;
}
export interface ICohortDBHistScoreParms extends ICohortDBHistDataParms {
    table: string;
    ensg: string;
}
export interface ICohortDBHistScoreDepletionParms extends ICohortDBHistScoreParms {
    depletionscreen: string;
}
export interface ICohortDBHistPanelParms extends IParams {
    cohortId: number;
    panel: string;
}
export declare function getCohortHist(histType: HistRouteType, params: ICohortDBHistDataParms | ICohortDBHistScoreParms | ICohortDBHistScoreDepletionParms | ICohortDBHistPanelParms, assignIds?: boolean): Promise<{
    bin: string;
    count: number;
}[]>;
