import { ICmdResult, IObjectRef } from 'tdp_core';
import { CohortApp } from '../app';
import { IElementProvJSON, IElementProvJSONCohort } from '../CohortInterfaces';
import { IEntitySourceConfig } from '../utilIdTypes';
/******************************
 ---------- GENERAL ----------
*******************************/
export declare function setDatasetAction(provider: IObjectRef<CohortApp>, newDataset: IDatasetDesc, oldDataset: IDatasetDesc): import("tdp_core").IAction;
export declare function setDatasetImpl(inputs: IObjectRef<CohortApp>[], parameter: any): Promise<ICmdResult>;
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
