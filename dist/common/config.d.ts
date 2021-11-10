/**
 * Created by sam on 06.03.2017.
 */
import { IServerColumn } from 'tdp_core';
import { IAdditionalColumnDesc } from 'tdp_core';
/**
 * maximal number of rows in which just the subset if fetched instead of all
 * @type {number}
 */
export declare const MAX_FILTER_SCORE_ROWS_BEFORE_ALL = 1000;
/**
 * Detailed information about the column type
 */
interface IDataSourceColumnInfo {
    /**
     * List of all string column names
     */
    string?: string[];
    /**
     * List of all number column names
     */
    number?: string[];
    /**
     * List of all categorical column names
     */
    categorical?: string[];
}
export interface IDataSourceConfig {
    idType: string;
    name: string;
    db: string;
    schema: string;
    tableName: string;
    entityName: string;
    base: string;
    columns(find: (column: string) => IServerColumn): IAdditionalColumnDesc[];
    /**
     * Detailed information about the column type.
     */
    columnInfo?: IDataSourceColumnInfo;
    [key: string]: any;
}
export declare const cellline: IDataSourceConfig;
export declare const tissue: IDataSourceConfig;
export declare const gene: IDataSourceConfig;
export declare const dataSources: IDataSourceConfig[];
export declare function chooseDataSource(desc: any): IDataSourceConfig;
export interface IDataTypeConfig {
    id: string;
    name: string;
    tableName: string;
    query: string;
    dataSubtypes: IDataSubtypeConfig[];
}
/**
 * list of possible types
 */
export declare const dataSubtypes: {
    number: string;
    string: string;
    cat: string;
    boxplot: string;
};
export interface IDataSubtypeConfig {
    id: string;
    name: string;
    type: string;
    useForAggregation: string;
    categories?: {
        label: string;
        name: string;
        color: string;
    }[];
    domain?: number[];
    missingValue?: number;
    constantDomain?: boolean;
}
export declare const expression: IDataTypeConfig;
export declare const copyNumber: IDataTypeConfig;
export declare const mutation: IDataTypeConfig;
export declare const depletion: IDataTypeConfig;
export declare const drugScreen: IDataTypeConfig;
export declare const drug: IDataSourceConfig;
export declare const dataTypes: IDataTypeConfig[];
/**
 * splits strings in the form of "DATA_TYPE-DATA_SUBTYPE" and returns the corresponding DATA_TYPE and DATA_SUBTYPE objects
 */
export declare function splitTypes(toSplit: string): {
    dataType: IDataTypeConfig;
    dataSubType: IDataSubtypeConfig;
};
export declare function resolveDataTypes(dataTypeId: string, dataSubTypeId: string): {
    dataType: IDataTypeConfig;
    dataSubType: IDataSubtypeConfig;
};
export {};
