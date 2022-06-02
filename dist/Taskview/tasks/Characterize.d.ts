/// <reference types="node" />
import { Cohort } from '../../Cohort';
import { ICohort } from '../../CohortInterfaces';
import { IAttribute } from '../../data/Attribute';
import { ATask } from './ATask';
export declare class Characterize extends ATask {
    static readonly TREES = 500;
    label: string;
    id: string;
    hasOutput: boolean;
    private eventID;
    private ids;
    private reader;
    private progressBar;
    private lineup;
    private dataProv;
    private cohorts;
    private definingAttributes;
    supports(attributes: IAttribute[], cohorts: ICohort[]): boolean;
    showSearchBar(): boolean;
    show(columnHeader: HTMLDivElement, container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]): Promise<void>;
    private createView;
    private showOverlap;
    setDefiningAttributeTooltip(hintText: HTMLElement): void;
    private compare;
    createLineUp(data: any): Promise<void>;
    updateLineUp(importances: any): void;
    addProgressBar(): void;
    setProgress(iteration: number, done?: boolean): void;
    setProgressDone(): void;
    fadeOutProgressBar(delay?: number): Promise<NodeJS.Timeout>;
    getData(attributes: IAttribute[], cohorts: Cohort[]): Promise<unknown[]>;
    postData(url?: string, data?: {}): Promise<Response>;
}
