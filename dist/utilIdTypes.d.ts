import { Cohort } from './Cohort';
export interface IEntitySourceConfig {
    idType: string;
    name: string;
    dbConnectorName: string;
    dbConnector: string;
    schema: string;
    viewName: string;
    tableName: string;
    entityName: string;
    base: string;
}
export declare const idTissue: IEntitySourceConfig;
export declare const idCellline: IEntitySourceConfig;
export declare const idStudent: IEntitySourceConfig;
export declare const idCovid19: IEntitySourceConfig;
export declare function getIdTypeFromCohort(cht: Cohort): IEntitySourceConfig;
