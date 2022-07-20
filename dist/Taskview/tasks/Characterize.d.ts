/// <reference types="node" />
import { Cohort } from '../../Cohort';
import { ICohort } from '../../CohortInterfaces';
import { IAttribute } from '../../data/Attribute';
import { ATask } from './ATask';
export declare class Characterize extends ATask {
    static readonly TREES = 500;
    static readonly jaccardFormat: (n: number | {
        valueOf(): number;
    }) => string;
    label: string;
    id: string;
    hasOutput: boolean;
    private eventID;
    private ids;
    private ws;
    private progressBar;
    private lineup;
    private dataProv;
    private cohorts;
    private definingAttributes;
    private chart;
    supports(attributes: IAttribute[], cohorts: ICohort[]): boolean;
    showSearchBar(): boolean;
    show(columnHeader: HTMLDivElement, container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]): Promise<void>;
    private createView;
    private showOverlap;
    setDefiningAttributeTooltip(hintText: HTMLElement): void;
    private compare;
    createLineUp(data: any, showCategoryColumn?: boolean): Promise<void>;
    updateLineUp(importances: any): void;
    addProgressBar(): void;
    setProgress(iteration: number, done?: boolean): void;
    setProgressDone(): void;
    fadeOutProgressBar(delay?: number): Promise<NodeJS.Timeout>;
    getData(attributes: IAttribute[], cohorts: Cohort[]): Promise<unknown[]>;
    postData(endpoint: string, data?: {}): Promise<Response>;
}
