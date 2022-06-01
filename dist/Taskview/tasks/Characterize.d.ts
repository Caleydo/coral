/// <reference types="node" />
import * as LineUpJS from 'lineupjs';
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
    progressBar: any;
    lineup: LineUpJS.Taggle;
    dataProv: LineUpJS.LocalDataProvider;
    supports(attributes: IAttribute[], cohorts: ICohort[]): boolean;
    showSearchBar(): boolean;
    show(columnHeader: HTMLDivElement, container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]): Promise<void>;
    appendTable(): void;
    appendUpset(container: HTMLDivElement): void;
    getSetData(ids: any[]): {
        name: string;
        sets: string[];
    }[];
    sendData(endpoint: any, ids: any): Promise<void>;
    visualize(response: any): Promise<void>;
    getData(attributes: IAttribute[], cohorts: Cohort[]): Promise<unknown[]>;
    postData(url?: string, data?: {}): Promise<Response>;
    addProgressBar(): void;
    setProgress(iteration: number): void;
    fadeOutProgressBar(delay?: number): Promise<NodeJS.Timeout>;
    createLineUp(data: any): Promise<void>;
    updateLineUp(importances: any): void;
}
