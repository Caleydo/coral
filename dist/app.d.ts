import { CLUEGraphManager } from 'phovea_clue';
import { ActionNode, ICmdResult, IObjectRef, ProvenanceGraph } from 'phovea_core';
import { ATDPApplication } from 'tdp_core';
import { Cohort } from './Cohort';
import Taskview from './Taskview/Taskview';
import { CohortSelectionEvent, ConfirmTaskEvent } from './utilCustomEvents';
import { IEntitySourceConfig } from './utilIdTypes';
/**
 * The Cohort app that does the acutal stuff.
 */
export declare class CoralApp {
    readonly graph: ProvenanceGraph;
    readonly graphManager: CLUEGraphManager;
    private readonly $node;
    private $overview;
    private $detail;
    readonly name: string;
    private dataset;
    private datasetEventID;
    /**
     * IObjectRef to this CohortApp instance
     * @type {IObjectRef<CoralApp>}
     */
    readonly ref: IObjectRef<CoralApp>;
    constructor(graph: ProvenanceGraph, manager: CLUEGraphManager, parent: HTMLElement, name?: string);
    /**
     * Initialize the view and return a promise
     * that is resolved as soon the view is completely initializqed.
     * @returns {Promise<App>}
     */
    init(): Promise<this>;
    firstOutput: boolean;
    handleConfirmTask(ev: ConfirmTaskEvent): Promise<void>;
    /**
     * Load and initialize all necessary views
     * @returns {Promise<App>}
     */
    private build;
    getDatabases(): Promise<Array<any>>;
    defineIdTypes(databases: Array<any>): Array<IEntitySourceConfig>;
    /**
     * loads the needed data and creates the graph
     * @param database name of the database
     * @param view name of the view
     */
    setDataset(dataset: IDatasetDesc): Promise<void>;
    /**
     * load the description of the given database and view
     * @param database database name
     * @param view view id
     */
    private loadViewDescription;
    private _addSplitScreenDraggerFunctionality;
    private _createScreenControlBtn;
    setAppGridLayout(type: 'top' | 'split' | 'bot'): void;
}
/**
 * The app for this website, embeds our Cohort App
 */
export declare class App extends ATDPApplication<CoralApp> {
    constructor(name: string);
    protected createApp(graph: ProvenanceGraph, manager: CLUEGraphManager, main: HTMLElement): CoralApp | PromiseLike<CoralApp>;
    protected initSessionImpl(app: CoralApp): void;
    static setDatasetImpl(inputs: IObjectRef<CoralApp>[], parameter: any): Promise<ICmdResult>;
    static setDataset(provider: IObjectRef<CoralApp>, newDataset: IDatasetDesc, oldDataset: IDatasetDesc): import("phovea_core").IAction;
    static compressChtSetDataset(path: ActionNode[]): ActionNode[];
}
export declare class CohortSelectionListener {
    private eventTarget;
    private app;
    private static instance;
    taskview: Taskview;
    selection: Cohort[];
    firstCohort: boolean;
    static get(): CohortSelectionListener;
    static init(eventTarget: Node, app: CoralApp): void;
    static reset(): void;
    private constructor();
    handleSelectionEvent(ev: CohortSelectionEvent): void;
}
export interface IPanelDesc {
    id: string;
    description: string;
    species: string;
}
interface IDatasetDesc {
    source: IEntitySourceConfig;
    panel?: IPanelDesc;
}
export {};
