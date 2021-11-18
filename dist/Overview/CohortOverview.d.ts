import { IObjectRef, ProvenanceGraph } from 'tdp_core';
import { IDatabaseViewDesc } from 'tdp_core';
import { CohortApp } from '../app';
import { Cohort } from '../Cohort';
import { IElement, IElementProvJSON, IOverviewLayout, ITaskParams } from '../CohortInterfaces';
import { IAttribute } from '../data/Attribute';
import { Task } from '../Tasks';
export declare class CohortOverview {
    private parent;
    private root;
    private rootDBid;
    private elements;
    sizeReference: number;
    layout: IOverviewLayout;
    container: HTMLDivElement;
    viewDescr: IDatabaseViewDesc;
    taskHistory: Array<Task>;
    private _arrangements;
    private _zoomFactor;
    private _showTaskHistoryDetails;
    private _currentPreviewTasks;
    private _lastAddedTasks;
    private eventListenerChange;
    private eventListenerConfirm;
    private cohortAppNode;
    private _elementsAsJSON;
    graph: ProvenanceGraph;
    readonly ref: IObjectRef<CohortOverview>;
    readonly appRef: IObjectRef<CohortApp>;
    private refName;
    private _reference;
    constructor(parent: HTMLDivElement, graph: ProvenanceGraph, ref: IObjectRef<CohortApp>, layout: IOverviewLayout, root: Cohort, viewDescr: IDatabaseViewDesc);
    private static generate_hash;
    private setReferenceSize;
    private retrieveReferenceSize;
    destroy(): void;
    getElementsAsJSON(): IElementProvJSON[];
    /**
     * Updates the '_elementsAsJSON' array.
     * Converts the current state of the 'elements' array into array of JSON objects
     * and saves it in the '_elementsAsJSON' array
     */
    updateJSONElements(): void;
    /**
     * Converts the current 'elements' array into JSON objects
     * @returns array of JSON objects based on the 'elements' array
     */
    convertElementsToJSON(): IElementProvJSON[];
    addElements(elems: Array<IElement>): void;
    addElement(elem: IElement): void;
    removeElement(elem: IElement): void;
    removeElementWithID(eleId: string): void;
    removeElements(elems: IElement[]): void;
    getElement(elem: IElement): IElement;
    getElementWithId(eleId: string): IElement;
    getLastAddedTasks(): Task[];
    clearLastAddedTasks(): void;
    executeTask(taskParam: ITaskParams, attributes: IAttribute[], addToTaskHistory?: boolean): Task;
    private handlePreviewChange;
    private previewChange;
    private clearPreview;
    private handlePreviewConfirm;
    generateOverviewProv(jsonElements?: IElementProvJSON[]): Promise<void>;
    generateOverview(): void;
    private getAllChildren;
    private handleRemoveTask;
    private handleRemoveCohort;
    private _generatePlacement;
    private _generatePaths;
    private setupTaskHistory;
    private handleHighlightingOnHover;
    private addHighligthingToPaths;
    private removeHighligthingFromPaths;
    private addHighlightingToElements;
    private removeHighlightingFromElements;
    private _createDetailForTaskInHistory;
    zoomIn(): void;
    zoomOut(): void;
    private _zoom;
}
