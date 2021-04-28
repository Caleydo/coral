import { IAllFilters, IServerColumn } from 'tdp_core';
import { IDataSubtypeConfig, IDataTypeConfig } from 'tdp_publicdb';
import { Cohort } from '../Cohort';
import { ICohort } from '../CohortInterfaces';
import { HistRouteType, ICohortDBHistDataParms, ICohortDBHistPanelParms, ICohortDBHistScoreDepletionParms, ICohortDBHistScoreParms, IEqualsList, INumRange } from '../rest';
import { IOption } from '../Taskview/SearchBar';
import { IAttributeFilter } from '../util';
import { ISpecialAttribute } from './SpecialAttribute';
export declare type AttributeType = 'categorical' | 'number' | 'string';
export declare type ScoreType = 'depletion' | 'expression' | 'copy_number' | 'mutation';
export declare type IdValuePair = {
    id: string;
    [key: string]: any;
};
/**
 * base type for ServerColumns and ScoreColumn
 * id, view, and database are needed for the methods in rest.ts
 */
export interface IAttribute {
    /**
     * id database access the data
     */
    id: string;
    /**
     * datakey with which the attributes data can be accessed frontend
     * necessary as GeneScoreAttributes have the same id for TPM, Copy Number, etc of the same gene
     */
    dataKey: string;
    /**
     * view to access the data
     */
    view: string;
    /**
     * database to access the data
     */
    database: string;
    /**
     * label of this column for display to the user by default the column name
     */
    label: string;
    /**
     * column type
     */
    type: AttributeType;
    /**
     * the categories in case of type=categorical
     */
    categories?: string[];
    /**
     * the minimal value in case of type=number
     */
    min?: number;
    /**
     * the maxmial value in case of type=number
     */
    max?: number;
    /**
     * wether the attribute is best shown on a log scale
     */
    preferLog: boolean;
    getData(cohortDbId: number, filters?: IAllFilters): Promise<IdValuePair[]>;
    getHist(dbId: number, filters?: IAllFilters, bins?: number): Promise<{
        bin: string;
        count: number;
    }[]>;
    getHistWithStorage(histType: HistRouteType, params: ICohortDBHistDataParms | ICohortDBHistScoreParms | ICohortDBHistScoreDepletionParms | ICohortDBHistPanelParms): Promise<{
        bin: string;
        count: number;
    }[]>;
    getCount(cohortDbId: number, filters?: IAllFilters): Promise<number>;
    filter(cht: ICohort, filter: INumRange[] | IEqualsList): Promise<Cohort>;
}
export declare abstract class Attribute implements IAttribute {
    readonly id: string;
    readonly view: string;
    readonly database: string;
    readonly type: AttributeType;
    preferLog: boolean;
    min?: number;
    max?: number;
    categories?: string[];
    label: string;
    dataKey: string;
    constructor(id: string, view: string, database: string, type: AttributeType);
    getData(cohortDbId: number, filters?: IAllFilters): Promise<IdValuePair[]>;
    getHist(dbId: number, filters?: IAllFilters, bins?: number): Promise<{
        bin: string;
        count: number;
    }[]>;
    getHistWithStorage(histType: HistRouteType, params: ICohortDBHistDataParms | ICohortDBHistScoreParms | ICohortDBHistScoreDepletionParms | ICohortDBHistPanelParms): Promise<{
        bin: string;
        count: number;
    }[]>;
    getCount(cohortDbId: number, filters?: IAllFilters): Promise<number>;
    abstract filter(cht: ICohort, filter: INumRange[] | IEqualsList, rangeLabel?: string): Promise<Cohort>;
}
export declare class ServerColumnAttribute extends Attribute {
    readonly id: string;
    readonly view: string;
    readonly database: string;
    readonly serverColumn: IServerColumn;
    resolvedDataType: {
        dataType: IDataTypeConfig;
        dataSubType: IDataSubtypeConfig;
    };
    constructor(id: string, view: string, database: string, serverColumn: IServerColumn);
    filter(cht: Cohort, filter: INumRange[] | IEqualsList, rangeLabel?: string): Promise<Cohort>;
}
export declare class SpecialAttribute extends Attribute {
    readonly id: string;
    readonly view: string;
    readonly database: string;
    readonly spAttribute: ISpecialAttribute;
    readonly attrOption: string;
    constructor(id: string, view: string, database: string, spAttribute: ISpecialAttribute, attrOption: string);
    getData(cohortDbId: number, filters?: IAllFilters): Promise<IdValuePair[]>;
    getHist(dbId: number, filters?: IAllFilters, bins?: number): Promise<{
        bin: string;
        count: number;
    }[]>;
    filter(cht: Cohort, filter: INumRange[] | IEqualsList, rangeLabel?: string): Promise<Cohort>;
}
export declare abstract class AScoreAttribute extends Attribute {
    readonly id: string;
    readonly view: string;
    readonly database: string;
    readonly type: AttributeType;
    constructor(id: string, view: string, database: string, type: AttributeType);
    getCount(): Promise<number>;
}
/**
 * TODO: Compare with  SingleDepletionScore in tdp_publicdb/src/scores/SingleScore.ts
 */
export declare class GeneScoreAttribute extends AScoreAttribute {
    readonly id: string;
    readonly gene: string;
    readonly view: string;
    readonly database: string;
    readonly scoreType: ScoreType;
    readonly scoreSubType: IDataSubtypeConfig;
    resolvedDataType: {
        dataType: IDataTypeConfig;
        dataSubType: IDataSubtypeConfig;
    };
    constructor(id: string, gene: string, view: string, database: string, scoreType: ScoreType, scoreSubType: IDataSubtypeConfig);
    getData(cohortDbId: number, filters?: IAllFilters): Promise<IdValuePair[]>;
    filter(cht: Cohort, filter: INumRange[] | IEqualsList, rangeLabel?: string): Promise<Cohort>;
    /**
     * little helper to avoid duplicate code
     */
    getParam(): {
        table: string;
        attribute: string;
        name: string;
        species: string;
        target: string;
    };
    /**
     * depletion views are a bit special
     */
    getView(): string;
    /**
     * depletion needs an extra filter
     */
    updateFilters(filters: IAllFilters): IAllFilters;
    getHist(dbId: number, filters?: IAllFilters, bins?: number): Promise<{
        bin: string;
        count: number;
    }[]>;
}
export declare class PanelScoreAttribute extends AScoreAttribute {
    getData(cohortDbId: number, filters?: IAllFilters): Promise<IdValuePair[]>;
    getHist(dbId: number, filters?: IAllFilters, bins?: number): Promise<{
        bin: string;
        count: number;
    }[]>;
    filter(cht: Cohort, filter: INumRange[] | IEqualsList, rangeLabel?: string): Promise<Cohort>;
}
export declare function toAttribute(option: IOption, currentDB: any, currentView: any): IAttribute;
export declare function multiFilter(baseCohort: Cohort, attributes: IAttribute[], filters: Array<IEqualsList | INumRange[]>): Promise<Cohort>;
export declare function multiAttributeFilter(baseCohort: Cohort, filters: IAttributeFilter[]): Promise<Cohort>;
