import { IAllFilters } from 'tdp_core';
import { IElement, IElementProvJSON, IElementProvJSONTask, ITask, ITaskRep, TaskType } from './CohortInterfaces';
import { IAttribute } from './data/Attribute';
export declare abstract class Task implements ITask {
    id: string;
    label: string;
    type: TaskType;
    parents: Array<IElement>;
    children: Array<IElement>;
    representation: ITaskRep;
    attributes: IAttribute[];
    creationDate: number;
    constructor(id: string, label: string, attributes: IAttribute[]);
    abstract toProvenanceJSON(): IElementProvJSONTask;
}
export declare class TaskFilter extends Task {
    constructor(id: string, label: string, attributes: IAttribute[]);
    toProvenanceJSON(): IElementProvJSONTask;
}
export declare class TaskSplit extends Task {
    constructor(id: string, label: string, attributes: IAttribute[]);
    toProvenanceJSON(): IElementProvJSONTask;
}
export declare function createTaskFromProvJSON(config: IElementProvJSON): Task;
export declare function mergeTwoAllFilters(existingFilter: IAllFilters, newFilter: IAllFilters): IAllFilters;
