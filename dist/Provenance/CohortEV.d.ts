import { ICmdResult, IObjectRef } from 'tdp_core';
import { CohortApp } from '../app';
import { IElementProvJSON } from '../CohortInterfaces';
import { CohortOverview } from '../Overview/CohortOverview';
/***********************************************
 ----- Cohort Evolution View (CohortEV) --------
************************************************/
export declare function addOverviewCohortAction(provider: IObjectRef<CohortOverview>, providerApp: IObjectRef<CohortApp>, newDataset: IElementProvJSON[], oldDataset: IElementProvJSON[]): any;
export declare function addOverviewCohortImpl(inputs: IObjectRef<any>[], parameter: any): Promise<ICmdResult>;
export declare function removeOverviewCohortAction(provider: IObjectRef<CohortOverview>, providerApp: IObjectRef<CohortApp>, newDataset: IElementProvJSON[], oldDataset: IElementProvJSON[]): any;
export declare function removeOverviewCohortImpl(inputs: IObjectRef<any>[], parameter: any): Promise<ICmdResult>;
