import { Selection } from 'd3-selection';
import { ICohort } from '../../CohortInterfaces';
import { IAttribute } from '../../data/Attribute';
export declare const TASK_CLOSE_EVENT_TYPE = "task:close";
export declare class TaskCloseEvent extends CustomEvent<{
    task: ATask;
}> {
    constructor(task: ATask);
}
export declare abstract class ATask {
    label: string;
    id: string;
    hasOutput: boolean;
    protected $container: HTMLDivElement;
    protected $columnHeader: HTMLDivElement;
    protected node: Selection<HTMLDivElement, any, null, undefined>;
    protected header: Selection<HTMLDivElement, any, null, undefined>;
    protected body: Selection<HTMLDivElement, any, null, undefined>;
    abstract supports(attributes: IAttribute[], cohorts: ICohort[]): any;
    abstract showSearchBar(): boolean;
    show(columnHeader: HTMLDivElement, container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]): void;
    close(): void;
}
