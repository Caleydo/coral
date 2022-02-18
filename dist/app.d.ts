import { CLUEGraphManager } from 'tdp_core';
import { IObjectRef, ProvenanceGraph } from 'tdp_core';
import { ATDPApplication } from 'tdp_core';
import { Cohort } from './Cohort';
import { IElementProvJSON, IElementProvJSONCohort } from './CohortInterfaces';
import { CohortOverview } from './Overview';
import Taskview from './Taskview/Taskview';
import { CohortSelectionEvent, ConfirmTaskEvent } from './utilCustomEvents';
import { IEntitySourceConfig } from './utilIdTypes';
/**
 * The Cohort app that does the acutal stuff.
 */
export declare class CohortApp {
    readonly graph: ProvenanceGraph;
    readonly graphManager: CLUEGraphManager;
    private readonly $node;
    private $overview;
    private $detail;
    readonly name: string;
    private dataset;
    private _cohortOverview;
    private _taskview;
    private rootCohort;
    private datasetEventID;
    private datasetTip;
    /**
     * IObjectRef to this CohortApp instance
     * @type {IObjectRef<CohortApp>}
     */
    readonly ref: IObjectRef<CohortApp>;
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
    private builDataSelector;
    handleDatasetClick(newDataset: any): Promise<void>;
    getDatabases(): Promise<Array<any>>;
    defineIdTypes(databases: Array<any>): Array<IEntitySourceConfig>;
    private _getOldCohortOverviewElements;
    getAppOverview(): CohortOverview;
    private _createRootCohort;
    /**
     * loads the needed data and creates the graph
     * @param database name of the database
     * @param view name of the view
     */
    setDataset(dataset: IDatasetDesc): Promise<void>;
    private _showChangeLayoutOptions;
    private _addSplitScreenDraggerFunctionality;
    private _createScreenControlBtn;
    setAppGridLayout(type: 'top' | 'split' | 'bot'): void;
}
/**
 * The app for this website, embeds our Cohort App
 */
export declare class App extends ATDPApplication<CohortApp> {
    constructor(name: string, loginDialog: string, showCookieDisclaimer?: boolean);
    protected createApp(graph: ProvenanceGraph, manager: CLUEGraphManager, main: HTMLElement): CohortApp | PromiseLike<CohortApp>;
    private replaceHelpIcon;
    protected initSessionImpl(app: CohortApp): void;
}
export declare class CohortSelectionListener {
    private eventTarget;
    private app;
    private static instance;
    taskview: Taskview;
    selection: Cohort[];
    firstCohort: boolean;
    static get(): CohortSelectionListener;
    static init(eventTarget: Node, app: CohortApp): void;
    static reset(): void;
    private constructor();
    handleSelectionEvent(ev: CohortSelectionEvent): void;
}
export interface IPanelDesc {
    id: string;
    description: string;
    species: string;
}
export interface IDatasetDesc {
    source: IEntitySourceConfig;
    panel?: IPanelDesc;
    rootCohort: IElementProvJSONCohort;
    chtOverviewElements: IElementProvJSON[];
}
