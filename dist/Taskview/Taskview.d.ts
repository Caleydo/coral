import { Cohort } from '../Cohort';
import { ITaskParams } from '../CohortInterfaces';
import { IAttribute } from '../data/Attribute';
import { ColumnSortEvent, FilterEvent, SplitEvent } from '../utilCustomEvents';
export default class Taskview {
    readonly $node: HTMLDivElement;
    private reference;
    destroy(): void;
    clearOutput(): void;
    private input;
    private search;
    private output;
    private scrollLink;
    private taskParams;
    private taskAttributes;
    private filterListener;
    private splitListener;
    private confirmListener;
    private columnSortListener;
    constructor($node: HTMLDivElement, reference: Cohort);
    handleColumnSortEvent(ev: ColumnSortEvent): Promise<void>;
    private sortCohorts;
    private sortWithDbIdArray;
    private sortLabelAlpha;
    private sortSizeNum;
    private sortCohortsBySize;
    orderCohorts(): void;
    confirmTask(): void;
    setInputCohorts(cohorts: Cohort[]): void;
    updateInput(): void;
    getInputCohorts(): Cohort[];
    getOutputCohorts(): Cohort[];
    setOutputCohorts(cohorts: Cohort[]): void;
    setReference(reference: Cohort): void;
    addMultipleAttributeColumns(dArray: IAttribute[], allowDuplicates?: boolean, pinned?: boolean): void;
    addAttributeColumn(d: IAttribute, allowDuplicates?: boolean, pinned?: boolean): void;
    addAttributeColumnForInput(d: IAttribute, allowDuplicates?: boolean, pinned?: boolean): void;
    addAttributeColumnForOutput(d: IAttribute, allowDuplicates?: boolean, pinned?: boolean): void;
    removeAttributeColumns(): void;
    getTaskParams(): ITaskParams[];
    getTaskAttributes(): IAttribute[];
    private currentEvent;
    handleFilterEvent(ev: FilterEvent | SplitEvent): Promise<void>;
    showOutput(show: boolean): void;
}
export declare class InputCohort extends Cohort {
    outputCohorts: Cohort[];
}
export declare class OutputCohort extends Cohort {
    isLastOutputCohort: boolean;
    isFirstOutputCohort: boolean;
}
