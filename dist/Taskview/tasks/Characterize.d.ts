/// <reference types="node" />
import { ERenderMode, ICellRenderer, ICellRendererFactory } from 'lineupjs';
import { Cohort } from '../../Cohort';
import { ICohort } from '../../CohortInterfaces';
import { IAttribute } from '../../data/Attribute';
import { ATask } from './ATask';
import { LineUpDistributionColumn } from './Characterize/LineUpDistributionColumn';
export declare class Characterize extends ATask {
    static readonly TREES = 200;
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
    setProgressIndefinite(): void;
    setProgressDone(): void;
    fadeOutProgressBar(delay?: number): Promise<NodeJS.Timeout>;
    getData(attributes: IAttribute[], cohorts: Cohort[]): Promise<unknown[]>;
    postData(endpoint: string, data?: {}): Promise<Response>;
}
export declare class MyDistributionRenderer implements ICellRendererFactory {
    readonly title: string;
    static readonly WIDTH = 200;
    static readonly HEIGHT = 50;
    canRender(col: LineUpDistributionColumn, mode: ERenderMode): boolean;
    create(col: LineUpDistributionColumn): ICellRenderer;
}
