import { Cohort } from './Cohort';
import { IAttribute } from './data/Attribute';
import { IEqualsList, INumRange } from './rest';
import { InputCohort } from './Taskview/Taskview';
/**
 * Enumeration for the different types of task
 */
export declare enum TaskType {
    Filter = 0,
    Split = 1,
    Combine = 2,
    Overview = 3,
    Characterization = 4
}
/**
 * Interface for every element in the overview (except the paths between the elements)
 */
export interface IElement {
    id: string;
    label: string;
    parents: Array<IElement>;
    children: Array<IElement>;
    representation: ICohortRep | ITaskRep;
}
/**
 * Interface for a cohort in the overview
 */
export interface ICohort extends IElement {
    representation: ICohortRep;
    dbId: number;
    values: Array<INumRange[] | IEqualsList>;
    isInitial: boolean;
    sizeReference: number;
}
/**
 * Interface for an tasks (filter, split, combine, ....)
 */
export interface ITask extends IElement {
    type: TaskType;
    attributes: IAttribute[];
    representation: ITaskRep;
    readonly creationDate: number;
}
export interface IOverviewLayout {
    cohortWidth: number;
    pathWidth: number;
    taskWidth: number;
    rowHeight: number;
    createLayout(root: ICohort): Array<any>;
    setContainerGrid(container: HTMLDivElement, columns: number, rows: number): void;
    setPositionInGrid(element: HTMLDivElement, level: number, pos: number): void;
}
export interface IRectLayout {
    elemID: string;
    parentID: string;
    column: number;
    row: number;
}
/**
 * Interface for a representation of a cohort
 */
export interface ICohortRep {
    id: string;
    labelOne: string;
    labelTwo: string;
    getRepresentation(): HTMLDivElement;
    setInformation: (...info: any[]) => void;
    setSize: (size: number, refSize: number) => void;
    setLabel: ISetTwoLabelFunc;
    getClone(): HTMLDivElement;
    setSelection: (state: boolean) => void;
    getSelection(): boolean;
}
export interface IRectCohortRep extends ICohortRep {
    setInformation: (labelOne: string, labelTwo: string, size: number, sizeReference: number) => void;
}
/**
 * Interface for a representation of a task
 */
export interface ITaskRep {
    id: string;
    label: string;
    getRepresentation(): HTMLDivElement;
    setInformation: (...info: any[]) => void;
    getClone(): HTMLDivElement;
    setLabel: ISetLabelFunc;
}
export interface IRectTaskRep extends ITaskRep {
    setImage: (image: string) => void;
    setInformation: (label: string, image: string) => void;
}
export interface ISetTwoLabelFunc {
    (labelOne: string, labelTwo: any): void;
}
export interface ISetLabelFunc {
    (label: string): void;
}
export interface ITaskParams {
    inputCohorts: InputCohort[];
    outputCohorts: Cohort[];
    type: TaskType;
    label: string;
}
