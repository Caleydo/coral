import { ICohort, IOverviewLayout } from '../CohortInterfaces';
export declare class RectangleLayout implements IOverviewLayout {
    private _layout;
    cohortWidth: number;
    pathWidth: number;
    taskWidth: number;
    rowHeight: number;
    constructor(cohortWidth?: number, pathWidth?: number, taskWidth?: number, rowHeight?: number);
    createLayout(root: ICohort): Array<any>;
    setContainerGrid(container: HTMLDivElement, columns: number, rows: number): void;
    setPositionInGrid(element: HTMLDivElement, column: number, row: number): void;
    private _createGridStyleColumns;
    private _createGridStyleRows;
    private _getGridColumn;
    private _assignSameRowForParentAndChild;
    private _assignRowAndColumn;
    private _createLayoutElement;
    private _sortCohortElements;
    private _sortTasks;
    private _sortCohorts;
}
