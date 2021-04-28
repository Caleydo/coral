import { IDType, IDTypeLike } from 'phovea_core';
import { IAllFilters, IRow, IServerColumn } from 'tdp_core';
import { ICohort, ICohortRep, IElement } from './CohortInterfaces';
import { ICohortDepletionScoreFilterParams, ICohortEqualsFilterParams, ICohortGeneEqualsFilterParams, ICohortGeneNumFilterParams, ICohortNumFilterParams, ICohortPanelAnnotationFilterParams, IEqualsList, INumRange } from './rest';
import { Task } from './Tasks';
export declare function createCohort(labelOne: string, labelTwo: string, isInitial: boolean, previousCohortId: number, database: string, databaseName: string, schema: string, table: string, view: string, idType: IDTypeLike, idColumn: IServerColumn, filters: IAllFilters): Promise<Cohort>;
export declare function createCohortWithEqualsFilter(parentCohort: Cohort, labelOne: string, labelTwo: string, attribute: string, numeric: 'true' | 'false', values: Array<string> | Array<number>): Promise<Cohort>;
export declare function createCohortWithTreatmentFilter(parentCohort: Cohort, labelOne: string, labelTwo: string, baseAgent: boolean, agent: Array<string>, regimen: number): Promise<Cohort>;
export declare function createCohortWithNumFilter(parentCohort: Cohort, labelOne: string, labelTwo: string, attribute: string, ranges: Array<INumRange>): Promise<Cohort>;
export declare function createCohortWithGeneNumFilter(parentCohort: Cohort, labelOne: string, labelTwo: string, table: string, attribute: string, ensg: string, ranges: Array<INumRange>): Promise<Cohort>;
export declare function createCohortWithGeneEqualsFilter(parentCohort: Cohort, labelOne: string, labelTwo: string, table: string, attribute: string, ensg: string, numeric: 'true' | 'false', values: Array<string> | Array<number>): Promise<Cohort>;
export declare function createCohortWithDepletionScoreFilter(parentCohort: Cohort, labelOne: string, labelTwo: string, table: string, attribute: string, ensg: string, depletionscreen: string, ranges: Array<INumRange>): Promise<Cohort>;
export declare function createCohortWithPanelAnnotationFilter(parentCohort: Cohort, labelOne: string, labelTwo: string, panel: string, values: Array<string>): Promise<Cohort>;
export declare enum cloneFilterTypes {
    none = 0,
    equals = 1,
    range = 2,
    geneScoreRange = 3,
    geneScoreEquals = 4,
    depletionScoreRange = 5,
    panelAnnotation = 6
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
export declare class Cohort implements ICohort {
    id: string;
    dbId: number;
    label: string;
    private _labelOne;
    private _labelTwo;
    representation: ICohortRep;
    isInitial: boolean;
    values: Array<INumRange[] | IEqualsList>;
    isClone: boolean;
    colorTaskView: string;
    private _sizeReference;
    usedFilter: cloneFilterTypes;
    usedFilterParams: ICohortEqualsFilterParams | ICohortNumFilterParams | ICohortGeneNumFilterParams | ICohortDepletionScoreFilterParams | ICohortPanelAnnotationFilterParams;
    private _database;
    private _schema;
    private _view;
    private _table;
    private _size;
    private _parents;
    private _children;
    private _parentCohorts;
    private _filters;
    private _selected;
    private _hasFilterConflict;
    private _bloodline;
    readonly idType: IDType;
    readonly idColumn: IServerColumn;
    constructor(basicValues: ICohortClassBasicValues, values: Array<INumRange[] | IEqualsList>, databaseValues: ICohortClassDatabaseValues, filters?: IAllFilters, sizeReference?: number, isInitial?: boolean);
    private _checkForFilterConflict;
    hasfilterConflict(): boolean;
    private _combineLabels;
    set labelOne(labelOne: string);
    get labelOne(): string;
    set labelTwo(labelTwo: string);
    get labelTwo(): string;
    set parents(parents: Array<IElement>);
    get parents(): Array<IElement>;
    /**
     * Returns all parent tasks, which are all the parent elements of this element.
     */
    getTaskParents(): Array<Task>;
    /**
     * Returns all parent cohorts, which are all the grand-parent elements of this element.
     */
    getCohortParents(): Array<Cohort>;
    setCohortParents(chtParents: Array<Cohort>): void;
    set children(children: Array<IElement>);
    get children(): Array<IElement>;
    /**
     * Returns all children tasks, which are all the children elements of this element.
     */
    getTaskChildren(): Array<Task>;
    /**
     * Returns all children cohorts, which are all the grand-children elements of this element.
     */
    getCohortChildren(): Array<Cohort>;
    set database(database: string);
    get database(): string;
    set schema(schema: string);
    get schema(): string;
    set view(view: string);
    get view(): string;
    get table(): string;
    set table(table: string);
    get filters(): IAllFilters;
    set filters(filters: IAllFilters);
    get sizeReference(): number;
    set sizeReference(value: number);
    get size(): Promise<number>;
    getRetrievedSize(): number;
    get data(): Promise<IRow[]>;
    get selected(): boolean;
    set selected(selected: boolean);
    private _fetchSize;
    private _fetchData;
    clone(usedFilter: cloneFilterTypes, filterParams: ICohortEqualsFilterParams | ICohortNumFilterParams | ICohortGeneNumFilterParams | ICohortGeneEqualsFilterParams | ICohortDepletionScoreFilterParams | ICohortPanelAnnotationFilterParams): Cohort;
    private _getHeritage;
    private _createHeritageElement;
    getBloodline(): IBloodlineElement[];
    private updateBloodline;
}
export interface IBloodlineElement {
    obj: IElement;
    elemType: string;
    label: string;
    size: number;
}
export declare const EMPTY_COHORT_ID = "--EMPTY--";
export declare function getEmptyCohort(parent: Cohort): Cohort;
export declare const LOADER_COHORT_ID = "--LOADING--";
export declare function getLoaderCohort(parent: Cohort): Cohort;
export declare function getCohortLabel(arrIndex: number, cht: Cohort): string;
export declare function getCohortLabels(cohorts: Cohort[]): string[];
