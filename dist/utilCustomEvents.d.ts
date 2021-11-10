import { Cohort } from './Cohort';
import { ITaskParams } from './CohortInterfaces';
import { IAttribute } from './data/Attribute';
import { Task } from './Tasks';
import { AColumn } from './Taskview/columns/AColumn';
import { IFilterDesc, SortType } from './util';
export declare const COHORT_REMOVE_EVENT_TYPE = "cht:remove";
export declare class CohortRemoveEvent extends CustomEvent<{
    cohort: Cohort;
}> {
    constructor(cohort: Cohort);
}
export declare const TASK_REMOVE_EVENT_TYPE = "task:remove";
export declare class TaskRemoveEvent extends CustomEvent<{
    task: Task;
}> {
    constructor(task: Task);
}
export declare const COHORT_SELECTION_EVENT_TYPE = "cht:select";
export declare class CohortSelectionEvent extends CustomEvent<{
    cohort: Cohort;
    replaceSelection: boolean;
}> {
    constructor(cohort: Cohort, replaceSelection?: boolean);
}
export declare const COLUMN_CLOSE_EVENT_TYPE = "cht:column:close";
export declare class ColumnCloseEvent extends CustomEvent<{
    column: AColumn;
}> {
    constructor(column: AColumn);
}
export declare const COLUMN_SORT_EVENT_TYPE = "cht:column:sort";
export declare class ColumnSortEvent extends CustomEvent<{
    type: SortType;
    sortInputChts: boolean;
}> {
    constructor(type: SortType, sortInputChts: boolean);
}
export declare const CREATE_OUTPUT_COHORT_EVENT_TYPE = "cht:create:output";
export declare class CreateOutputCohortEvent extends CustomEvent<{
    cohort: Cohort;
    origin?: Cohort;
}> {
    constructor(cohort: Cohort, originCohort?: Cohort);
}
export declare const FILTER_EVENT_TYPE = "cht:filter";
export declare class FilterEvent extends CustomEvent<{
    desc: IFilterDesc[];
}> {
    constructor(desc: IFilterDesc[]);
}
export declare const SPLIT_EVENT_TYPE = "cht:split";
export declare class SplitEvent extends CustomEvent<{
    desc: IFilterDesc[];
}> {
    constructor(desc: IFilterDesc[]);
}
export declare const CONFIRM_OUTPUT_EVENT_TYPE = "cht:output:confirm";
export declare class ConfirmOutputEvent extends CustomEvent<{
    cohorts: Cohort[];
}> {
    constructor(cohorts: Cohort[]);
}
export declare const CONFIRM_TASK_EVENT_TYPE = "cht:task:confirm";
export declare class ConfirmTaskEvent extends CustomEvent<{
    params: ITaskParams[];
    attributes: IAttribute[];
}> {
    constructor(params: ITaskParams[], attributes: IAttribute[]);
}
export declare const OVERVIEW_PREVIEW_CHANGE_EVENT_TYPE = "cht:ov:preview:change";
export declare class PreviewChangeEvent extends CustomEvent<{
    params: ITaskParams[];
    attributes: IAttribute[];
}> {
    constructor(params: ITaskParams[], attributes: IAttribute[]);
}
export declare const OVERVIEW_PREVIEW_CONFIRM_EVENT_TYPE = "cht:ov:preview:confirm";
export declare class PreviewConfirmEvent extends CustomEvent<{
    params: ITaskParams[];
    attributes: IAttribute[];
}> {
    constructor(params: ITaskParams[], attributes: IAttribute[]);
}
