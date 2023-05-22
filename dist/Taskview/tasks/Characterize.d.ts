/// <reference types="node" />
import { ERenderMode, ICellRenderer, ICellRendererFactory } from 'lineupjs';
import { Cohort } from '../../Cohort';
import { ATask } from './ATask';
import { LineUpDistributionColumn } from './Characterize/LineUpDistributionColumn';
import { IAttribute, ICohort } from '../..';
export declare class Characterize extends ATask {
    static readonly TREES = 500;
    static readonly formatPercent: (n: number | {
        valueOf(): number;
    }) => string;
    static readonly spinner = "<div class=\"fa-3x center green\"> <i class=\"fas fa-spinner fa-pulse\"></i></div>";
    static readonly KOKIRI_COLOR = "#90C08F";
    label: string;
    id: string;
    hasOutput: boolean;
    private eventID;
    private _entityName;
    private ids;
    private ws;
    private progressBar;
    private attributeRanking;
    private attributeRankingData;
    private itemRanking;
    private itemRankingData;
    private cohorts;
    private definingAttributes;
    private chart;
    private scatterplot;
    supports(attributes: IAttribute[], cohorts: ICohort[]): boolean;
    showSearchBar(): boolean;
    show(columnHeader: HTMLDivElement, container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]): Promise<void>;
    private createView;
    private showOverlap;
    setDefiningAttributeTooltip(hintText: HTMLElement): void;
    private compare;
    updateConfusionMatrix(responseData: any): Promise<void>;
    createAttributeRanking(data: any, showCategoryColumn?: boolean): Promise<void>;
    lineUpAttributeSelection(dataIndices: number[]): void;
    createItemRanking(data: any): Promise<void>;
    lineUpItemSelection(dataIndices: number[]): void;
    addProgressBar(): void;
    setProgress(iteration: number, done?: boolean): void;
    setProgressIndefinite(): void;
    setProgressDone(): void;
    fadeOutProgressBar(delay?: number): Promise<NodeJS.Timeout>;
    getData(attributes: IAttribute[], cohorts: Cohort[]): Promise<unknown[]>;
}
export declare class MyDistributionRenderer implements ICellRendererFactory {
    private cohorts;
    readonly title: string;
    static readonly WIDTH = 200;
    static readonly HEIGHT = 40;
    constructor(cohorts: Cohort[]);
    canRender(col: LineUpDistributionColumn, mode: ERenderMode): boolean;
    create(col: LineUpDistributionColumn): ICellRenderer;
}
//# sourceMappingURL=Characterize.d.ts.map