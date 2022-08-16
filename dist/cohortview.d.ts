import { IObjectRef, ProvenanceGraph } from 'tdp_core';
import { CohortApp } from './app';
import { Cohort } from './Cohort';
import { CohortOverview } from './Overview/CohortOverview';
import Taskview from './Taskview/Taskview';
import { IEntitySourceConfig } from './utilIdTypes';
export declare let cohortOverview: CohortOverview;
export declare let taskview: Taskview;
export declare function createCohortOverview(graph: ProvenanceGraph, ref: IObjectRef<CohortApp>, container: HTMLDivElement, detailView: HTMLDivElement, idTypeConfig: IEntitySourceConfig, rootCohort: Cohort): Promise<{
    cohortOV: CohortOverview;
    taskV: Taskview;
}>;
export declare function getRootCohort(): Cohort;
export declare function destroyOld(): void;
export declare function getCohortOverview(): CohortOverview;
export declare function getTaskview(): Taskview;
export declare function updateOverview(overview: CohortOverview): void;
export declare function loadViewDescription(database: string, view: string): Promise<IDatabaseViewDesc>;
