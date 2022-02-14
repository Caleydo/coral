import {select, Selection} from 'd3-selection';
import {CLUEGraphManager} from 'tdp_core';
import {AppContext, IObjectRef, ObjectRefUtils, ProvenanceGraph} from 'tdp_core';
import {AppMetaDataUtils} from 'tdp_core';
import SplitGrid from 'split-grid';
import {ATDPApplication, IDatabaseViewDesc, IServerColumn, NotificationHandler, RestBaseUtils} from 'tdp_core';
import {cellline, tissue} from 'tdp_publicdb';
import {Instance as TippyInstance} from 'tippy.js';
import {Cohort, createCohort, createCohortFromDB} from './Cohort';
import {IElementProvJSON, IElementProvJSONCohort} from './CohortInterfaces';
import {cohortOverview, createCohortOverview, destroyOld, loadViewDescription, taskview} from './cohortview';
import {PanelScoreAttribute} from './data/Attribute';
import {OnboardingManager} from './OnboardingManager';
import {CohortOverview} from './Overview';
import {setDatasetAction} from './Provenance/General';
import {getDBCohortData} from './rest';
import {Task} from './Tasks';
import Taskview, {InputCohort} from './Taskview/Taskview';
import deleteModal from './templates/DeleteModal.html';
import welcomeHtml from './templates/Welcome.html'; // webpack imports html to variable
import * as aboutDisclaimer from './templates/_aboutDisclaimer.html';
import {getAnimatedLoadingText, handleDataLoadError, log, removeFromArray} from './util';
import {CohortSelectionEvent, COHORT_SELECTION_EVENT_TYPE, ConfirmTaskEvent, CONFIRM_TASK_EVENT_TYPE, PreviewConfirmEvent} from './utilCustomEvents';
import {idCellline, idCovid19, idStudent, idTissue, IEntitySourceConfig} from './utilIdTypes';
import {niceName} from './utilLabels';


/**
 * The Cohort app that does the acutal stuff.
 */
export class CohortApp {

  public readonly graph: ProvenanceGraph;
  public readonly graphManager: CLUEGraphManager;
  private readonly $node: Selection<HTMLDivElement, any, null, undefined>;
  private $overview: HTMLDivElement;
  private $detail: HTMLDivElement;
  public readonly name: string;
  private dataset: IDatasetDesc = null;
  private _cohortOverview: CohortOverview = null;
  private _taskview: Taskview = null;
  private rootCohort: Cohort = null;

  private datasetEventID: number = 0;

  private datasetTip: TippyInstance;

  /**
   * IObjectRef to this CohortApp instance
   * @type {IObjectRef<CohortApp>}
   */
  readonly ref: IObjectRef<CohortApp>;

  constructor(graph: ProvenanceGraph, manager: CLUEGraphManager, parent: HTMLElement, name: string = 'Cohort') {
    this.graph = graph;
    this.graphManager = manager;
    this.$node = select(parent).append('div').classed('cohort_app', true);
    this.name = name;

    this.ref = graph.findOrAddObject(this, this.name, ObjectRefUtils.category.visual); // cat.visual = it is a visual operation
  }

  /**
   * Initialize the view and return a promise
   * that is resolved as soon the view is completely initializqed.
   * @returns {Promise<App>}
   */
  async init() {
    log.debug('Initialize application');
    this.$node.html('<p>Loading, please wait...</p>');
    OnboardingManager.init();
    CohortSelectionListener.init(this.$node.node(), this);
    this.$node.node().addEventListener(CONFIRM_TASK_EVENT_TYPE, (ev) => this.handleConfirmTask(ev as ConfirmTaskEvent));
    return this.build();
  }

  firstOutput = true;

  async handleConfirmTask(ev: ConfirmTaskEvent): Promise<void> {
    const taskParams = ev.detail.params; // task parameters (e.g. column/category to filter)
    const taskAttributes = ev.detail.attributes;
    // confirm the current preview as the result of the task
    this.$node.node().dispatchEvent(new PreviewConfirmEvent(taskParams, taskAttributes));
    // get the new added task (the ones confirmed from the preview)
    const tasks: Task[] = cohortOverview.getLastAddedTasks();
    taskview.clearOutput(); //clear taskview output

    //set output as new input
    let replace = true;
    for (const task of tasks) {
      for (const cht of task.children) {
        this.$node.node().dispatchEvent(new CohortSelectionEvent(cht as Cohort, replace));
        replace = false; //replace old selection with first cohort, then add the others

        if (this.firstOutput) {
          this.firstOutput = false;
          OnboardingManager.addTip('firstOutputCohort', cht.representation.getRepresentation());
        }
      }
    }
  }


  /**
   * Load and initialize all necessary views
   * @returns {Promise<App>}
   */
  private async build() {
    log.debug('Build app html structure');
    this.$node.selectAll('*').remove();

    const controlBar = this.$node.append('div').attr('class', 'control-bar');
    controlBar.append('span').classed('control-bar-label', true).text('Datasets:');
    const btnGrp = controlBar.append('div').attr('id', 'db_btnGrp').attr('style', 'display: flex;gap: 0.5em;');

    const loading = btnGrp.append('div').html(getAnimatedLoadingText('available datasets', false).outerHTML);

    // new div for the css grid overview
    this.$overview = this.$node.append('div').attr('id', 'chtOverview').node() as HTMLDivElement;
    this.$overview.insertAdjacentHTML('beforeend', welcomeHtml);

    // add delete modal to document body
    document.body.insertAdjacentHTML('beforeend', deleteModal);

    try {
      this._addSplitScreenDraggerFunctionality(this.$node); // add the dragger and the functionality to the app
      this.$detail = this.$node.append('div').node() as HTMLDivElement;
      this.setAppGridLayout('top'); // set grid layout of app

      // get all databses
      const dataBtns = await this.builDataSelector(btnGrp);
      loading.remove();
      // btnGrp.html(dataBtns.outerHTML);
      this.datasetTip = OnboardingManager.addTip('dataset', btnGrp.node(), true);
    } catch {
      NotificationHandler.pushNotification('error', 'Loading datasets failed');
      loading.html(`
      <i class="fas fa-exclamation-circle"></i>
      Loading datasets failed. Please try to reload or <a href="https://github.com/Caleydo/coral/issues/new">report the issue</a>.
      `);
    }

    return Promise.resolve(this);
  }

  private async builDataSelector(btnGrp) {
    const databases = await this.getDatabases();
    // find databases with idtypes (i.e. with data we can use in Coral)
    const dataSources = this.defineIdTypes(databases);
    // check if there are also predefined subsets of the data (panels/predefiend sets)
    const dataSourcesAndPanels = await Promise.all(dataSources.map(async (d) => ({
      source: d,
      panels: (d.idType === cellline.idType || d.idType === tissue.idType) ? await RestBaseUtils.getTDPData(d.dbConnectorName, `${d.base}_panel`) as IPanelDesc[] : []
      // check for idType, because for other data sources currently no panels exist, e.g. covid19
      // TODO: check if there are sets stored by the user (namedsets (private/public))
      //  * const namedSets = await RestStorageUtils.listNamedSets();
      //  * const namedSetOptions = await RestStorageUtils.listNamedSetsAsOptions();
    })));

    const datasetGroup = btnGrp.selectAll('div.btn-group').data(dataSourcesAndPanels) //create a btngroup for each data source
      .enter().append('div').classed('btn-group btn-group-sm', true);

    datasetGroup.append('button')
      .attr('type', 'button')
      .attr('class', 'db_btn btn btn-coral')
      .attr('data-db', (d) => d.source.dbConnectorName)
      .attr('data-dbview', (d) => d.source.viewName)
      .html((d) => {return d.source.idType.toUpperCase();})
      .on('click', async (d) => { // click on button
        const newDataset = this.dataset?.source?.idType === d.source.idType ? //same as current?
          {source: null, rootCohort: null, chtOverviewElements: null} : // deselect
          {source: d.source, rootCohort: null, chtOverviewElements: null}; // select
        this.handleDatasetClick(newDataset);
      });

    select('nav a.navbar-brand.caleydo_app').on('click', async () => { // click on logo
      this.handleDatasetClick({source: null, rootCohort: null, chtOverviewElements: null});
    });

    datasetGroup.append('button')
      .attr('type', 'button')
      .attr('class', 'db_btn btn btn-coral dropdown-toggle')
      .attr('data-bs-toggle', 'dropdown')
      .append('span').classed('caret', true);

    const dropdown = datasetGroup.append('ul').classed('dropdown-menu', true);
    dropdown.append('li').classed('dropdown-item', true).append('a').text('All')
      .on('click', async (d) => { //click all
        const newDataset = {source: d.source, rootCohort: null, chtOverviewElements: null};
        this.handleDatasetClick(newDataset);
      });

    dropdown.append('li').attr('role', 'separator').classed('dropdown-divider', true);
    dropdown.append('li').classed('dropdown-header', true).text('Predefined Sets');

    const that = this;
    dropdown
      .selectAll('li.data-panel')
      .data((d) => d.panels)
      .enter()
      .append('li') .classed('data-panel', true).classed('dropdown-item', true)
      .append('a').text((d) => d.id).attr('title', (d) => d.description)
      .on('click', async function (d) { // click subset
        // don't toggle data by checkging what is selected in dropdown
        const dataSourcesAndPanels = select(this.parentNode.parentNode).datum() as {source: IEntitySourceConfig; panels: IPanelDesc[];}; // a -> parent = li -> parent = dropdown = ul
        const newDataset = {source: dataSourcesAndPanels.source, panel: d, rootCohort: null, chtOverviewElements: null};
        that.handleDatasetClick.bind(that)(newDataset);
      });
  }

  public async handleDatasetClick(newDataset) {
    // clean up/destory the old parts of the application
    destroyOld(); // remove old overview -> otherwise loading information will be added next to the overview

    if (newDataset.source) { // only add loading animation if new dataset is not null
      const loading = select(this.$overview).append('div').html(getAnimatedLoadingText('initial cohort').outerHTML).attr('class', 'loading-inital-animation');
    } else {
      this.datasetTip.show();
    }
    const rootJSON = await this._createRootCohort(newDataset);
    newDataset.rootCohort = rootJSON;
    // perpare oldDataset for proveance
    if (this.dataset) {
      this.dataset.chtOverviewElements = this._getOldCohortOverviewElements();
    }
    this.graph.push(setDatasetAction(this.ref, newDataset, this.dataset));
  }

  public async getDatabases(): Promise<Array<any>> {
    let databases: Array<any>;
    // get all databases
    try {
      databases = await AppContext.getInstance().getAPIJSON('/tdp/db/');
      log.debug('Available databases: ', databases);
    } catch (e) {
      handleDataLoadError(e);
    }
    return [].concat(databases);
  }

  public defineIdTypes(databases: Array<any>): Array<IEntitySourceConfig> {
    const idTypes: Array<IEntitySourceConfig> = [];

    for (const db of databases) {
      if (db.name === 'publicdb') {
        idTypes.push(idTissue);
        idTypes.push(idCellline);
      }
      if (db.name === 'studentdb') {
        idTypes.push(idStudent);
      }
      if (db.name === 'covid19db') {
        idTypes.push(idCovid19);
      }
    }

    return idTypes;
  }


  private _getOldCohortOverviewElements(): IElementProvJSON[] {
    if (this._cohortOverview === null) {
      return null;
    } else {
      return this._cohortOverview.getElementsAsJSON();
    }
  }

  public getAppOverview(): CohortOverview {
    return this._cohortOverview;
  }

  private async _createRootCohort(dataset: IDatasetDesc): Promise<IElementProvJSONCohort> {
    if (dataset.source === null) {
      this.rootCohort = null;
      return null;
    } else {
      const idTypeConfig = dataset.source;
      const panel = dataset.panel;

      const viewDescription: IDatabaseViewDesc = await loadViewDescription(idTypeConfig.dbConnectorName, idTypeConfig.viewName);
      log.debug('retrievedViewDesctiprion', viewDescription);
      const idColumn: IServerColumn = viewDescription.columns.find((col) => col.label === 'id') || {column: 'id', label: 'id', type: 'string'};
      // create root cohort
      let root: Cohort = await createCohort(
        niceName(idTypeConfig.idType), 'All', true, -1,
        idTypeConfig.dbConnector, idTypeConfig.dbConnectorName, idTypeConfig.schema, idTypeConfig.tableName, idTypeConfig.viewName, idTypeConfig.idType, idColumn,
        {normal: {}, lt: {}, lte: {}, gt: {}, gte: {}}
      );
      if (panel) {
        const panelAttr = new PanelScoreAttribute(
          panel.id,
          idTypeConfig.viewName,
          idTypeConfig.dbConnectorName,
          'categorical'
        );

        root = await panelAttr.filter(root, {values: ['true']});
        root.setLabels(idTypeConfig.idType, panel.id);
      }
      root.isInitial = true; // set cohort as root
      // referenceCohort = reference; // save reference cohort
      this.rootCohort = root;
      const rootAsJSON = root.toProvenanceJSON();
      rootAsJSON.attrAndValues.isRoot = true;
      return rootAsJSON;
    }
  }

  /**
   * loads the needed data and creates the graph
   * @param database name of the database
   * @param view name of the view
   */
  async setDataset(dataset: IDatasetDesc) {
    select('#db_btnGrp').selectAll('button').classed('selected', false); //remove selected class from all buttons
    const currEventID = ++this.datasetEventID; // save current EventId that and incerease the gloabl one
    log.debug('setDataset parameters: ', dataset);
    CohortSelectionListener.reset();

    if (dataset !== null && dataset.source) {
      const source = dataset.source;
      if (source.dbConnectorName && source.viewName) {
        // check if current event is the last called event
        if (currEventID === this.datasetEventID) {
          this.dataset = dataset;

          // get current rootCohorts, doesn't have to be created again
          let rootCohort = this.rootCohort;
          const datasetRootCohortId = dataset.rootCohort.id;

          // create new rootCohort if none is defined or is not matching the current configuration
          if (rootCohort === null || rootCohort.id !== datasetRootCohortId) {
            const dbCohortInfo = await getDBCohortData({cohortIds: [Number(datasetRootCohortId)]});
            const jsonCht = dataset.rootCohort;
            const provJSON = {
              idColumn: jsonCht.attrAndValues.idColumn,
              idType: jsonCht.attrAndValues.idType,
              values: jsonCht.attrAndValues.values,
              view: jsonCht.attrAndValues.view,
              database: jsonCht.attrAndValues.database,
              selected: jsonCht.attrAndValues.selected,
              isRoot: true
            };
            rootCohort = createCohortFromDB(dbCohortInfo[0], provJSON);
            this.rootCohort = rootCohort;
          }

          this._showChangeLayoutOptions(true);
          select('#db_btnGrp').select(`button[data-db="${source.dbConnectorName}"][data-dbview="${source.viewName}"]`).classed('selected', true); //add selected class to current button
          const views = await createCohortOverview(this.graph, this.ref, this.$overview, this.$detail, this.dataset.source, rootCohort);

          // get loading animation
          const loading = select(this.$overview).select('.loading-inital-animation');
          if (loading) {
            loading.remove(); // remove loading animation
          }
          this._cohortOverview = views.cohortOV;
          this._taskview = views.taskV;

          // get Old elements
          if (dataset.chtOverviewElements !== null) {
            await this._cohortOverview.generateOverviewProv(dataset.chtOverviewElements);
          }
        }
      }
    } else if (currEventID === this.datasetEventID) {
      destroyOld();
      this.dataset = dataset;
      this._taskview = null;
      this._cohortOverview = null;
      this.setAppGridLayout('top');
      this._showChangeLayoutOptions(false);
    }
  }

  // /**
  //  * get all idTypes from all the databases
  //  */
  // private async getGenericViews() {
  //   const genericViews: Array<any> = [];
  //   // get all databases
  //   try {
  //     const databases: Array<any> = await AppContext.getInstance().getAPIJSON('/tdp/db/');
  //     log.debug('Available databases: ', databases);

  //     // get all idtypes via the views
  //     if (databases.length > 0) {
  //       for (const db of databases) {
  //         // get all views for the DB
  //         const views: Array<any> = await AppContext.getInstance().getAPIJSON('/tdp/db/' + db.name + '/');
  //         for (const v of views) {
  //           // only save the generic views which have an idType
  //           if (v.type === 'generic' && v.idType) {
  //             // if (v.idType === 'Tissue' || v.idType === 'Cellline' || v.idType === 'student') {
  //               v.dbName = db.name; // add databse name to the view
  //               log.info(`Generic view of db=${db.name}: `, v);
  //               // the name property is the view id
  //               genericViews.push(v);
  //             // }
  //           }
  //         }
  //       }
  //     }
  //     log.info('idTypes found: ', genericViews.map((view) => view.idType));
  //   } catch (e) {
  //     handleDataLoadError(e);
  //   }
  //   return genericViews;
  // }

  private _showChangeLayoutOptions(show: boolean) {
    const screenControls = this.$node.select('.control-bar').select('.screen-controls').node() as HTMLDivElement;
    screenControls.toggleAttribute('hidden', !show);
  }

  private _addSplitScreenDraggerFunctionality(container: Selection<HTMLDivElement, any, null, undefined>) {
    // add slider between the two containers
    const dragger = container.append('div').attr('id', 'dragger');
    const draggerDots = dragger.append('svg').attr('class', 'dragger-dots');
    draggerDots.append('rect').attr('x', '0').attr('y', '1').attr('height', '3').attr('width', '3');
    draggerDots.append('rect').attr('x', '6').attr('y', '1').attr('height', '3').attr('width', '3');
    draggerDots.append('rect').attr('x', '12').attr('y', '1').attr('height', '3').attr('width', '3');

    // add functionality
    SplitGrid(
      {
        rowGutters: [{
          track: 2,
          element: document.querySelector('#dragger')
        }],
        snapOffset: 30,
        onDragEnd: () => window.dispatchEvent(new Event('resize')) //update responsive vega charts
      });

    // add buttons to switch
    const screenControls = container.select('.control-bar').append('div').attr('class', 'screen-controls hidden');
    screenControls.append('span').classed('control-bar-label', true).html('Change Layout:');
    // add overview fullscreen control
    const ovBtn = this._createScreenControlBtn('Overview', 'top');
    ovBtn.addEventListener('click', (event) => {
      this.setAppGridLayout('top');
    });
    screenControls.node().appendChild(ovBtn);

    // add split screen control
    const spBtn = this._createScreenControlBtn('Split Screen', 'split');
    screenControls.node().appendChild(spBtn);
    spBtn.addEventListener('click', (event) => {
      this.setAppGridLayout('split');
    });

    // add action view fullscreen control
    const avBtn = this._createScreenControlBtn('Action View', 'bot');
    screenControls.node().appendChild(avBtn);
    avBtn.addEventListener('click', (event) => {
      this.setAppGridLayout('bot');
    });
  }

  private _createScreenControlBtn(label: string, type: 'top' | 'split' | 'bot'): HTMLDivElement {
    const divBtn = document.createElement('div');
    divBtn.classList.add('sc-button', 'btn-coral');
    divBtn.title = label;

    // icon
    const divIcon = document.createElement('div');
    divIcon.classList.add('icon');
    if (type === 'top') {
      divIcon.style.borderBottomWidth = '3px';
    } else if (type === 'bot') {
      divIcon.style.borderTopWidth = '3px';
    } else {
      // separator that has 50% of the height
      const divIconSeparator = document.createElement('div');
      divIconSeparator.style.height = '50%';
      divIcon.appendChild(divIconSeparator);
    }

    divBtn.appendChild(divIcon);

    return divBtn;
  }

  public setAppGridLayout(type: 'top' | 'split' | 'bot') {
    const entityBtnHeight = 'auto';
    const draggerHeight = '7px';
    let gridRowTemplate = `${entityBtnHeight} 1fr ${draggerHeight} 1fr`;

    if (type === 'top') {
      gridRowTemplate = `${entityBtnHeight} 1fr ${draggerHeight} 0px`;
    } else if (type === 'bot') {
      gridRowTemplate = `${entityBtnHeight} 0px ${draggerHeight} 1fr`;
    } else {
      const size = document.body.getBoundingClientRect();
      let tvHeightPropertyValue = this.$node.style('--tv-height-vh');
      tvHeightPropertyValue = tvHeightPropertyValue.substring(0, tvHeightPropertyValue.length - 2);
      const tvHeight = size.height * Number(tvHeightPropertyValue) / 100;
      gridRowTemplate = `${entityBtnHeight} 1fr ${draggerHeight} ${tvHeight}px`;
    }

    this.$node.style('grid-template-rows', gridRowTemplate);
  }

}


/**
 * The app for this website, embeds our Cohort App
 */
export class App extends ATDPApplication<CohortApp> {

  constructor(name: string, loginDialog: string, showCookieDisclaimer: boolean = true) {
    super({
      prefix: 'coral',
      name,
      loginForm: loginDialog,
      /**
       * Link to help and show help in `Ordino at a Glance` page instead
       */
      showHelpLink: `${(window.location.href).split('app/')[0]+'#/help'}`,
      showCookieDisclaimer,
      /**
       * Show content in the `Ordino at a Glance` page instead
       */
      // showAboutLink,
      showAboutLink: false,
      /**
       * Show content in the `Ordino at a Glance` page instead
       */
      showReportBugLink: false,
    });
  }

  protected createApp(graph: ProvenanceGraph, manager: CLUEGraphManager, main: HTMLElement): CohortApp | PromiseLike<CohortApp> {
    log.debug('Create App');
    this.replaceHelpIcon();
    return new CohortApp(graph, manager, main, this.options.name).init();
  }

  private replaceHelpIcon() {
    const helpButton = select(this.header.rightMenu).select('li[data-header="helpLink"]');
    helpButton.select('span.fa-stack').remove();
    helpButton.select('a.nav-link').insert('i', ':first-child').attr('class', 'fa fa-question-circle');
  }

  protected initSessionImpl(app: CohortApp) {
    log.debug('initSessionImpl. Is Graph empty?', app.graph.isEmpty);
    this.jumpToStoredOrLastState();
  }

}


export class CohortSelectionListener {
  private static instance: CohortSelectionListener;
  public taskview: Taskview;
  selection: Cohort[] = [];
  firstCohort = true;

  public static get() {
    return CohortSelectionListener.instance;
  }

  static init(eventTarget: Node, app: CohortApp) {
    if (CohortSelectionListener.instance) {
      CohortSelectionListener.instance.eventTarget.removeEventListener(COHORT_SELECTION_EVENT_TYPE, CohortSelectionListener.instance.handleSelectionEvent); // remove listener
      CohortSelectionListener.instance.selection.forEach((cht) => cht.selected = false); // deselect
      delete CohortSelectionListener.instance; // destroy
    }
    CohortSelectionListener.instance = new CohortSelectionListener(eventTarget, app);
  }

  static reset() {
    if (CohortSelectionListener.instance) {
      CohortSelectionListener.instance.selection = [];
      CohortSelectionListener.instance.firstCohort = true;
    }
  }

  private constructor(private eventTarget: Node, private app: CohortApp) {
    eventTarget.addEventListener(COHORT_SELECTION_EVENT_TYPE, (ev) => this.handleSelectionEvent(ev as CohortSelectionEvent)); //arrow function to keep "this" working in eventhandler
  }

  public handleSelectionEvent(ev: CohortSelectionEvent) {
    const clickedCht = ev.detail.cohort;
    const replaceSelection = ev.detail.replaceSelection;

    if (!clickedCht.representation.getRepresentation().classList.contains('preview')) {

      // if true deselect all current selected cohorts
      if (replaceSelection) {
        const toDeselect = this.selection.splice(0, this.selection.length); //clear array and get a copy with cohorts to deselect
        toDeselect.forEach((cht) => cht.selected = false); //deselect all
      }

      // Update selection array:
      if (this.selection.indexOf(clickedCht) > -1) {
        //already selected --> remove
        removeFromArray(this.selection, clickedCht);
        clickedCht.colorTaskView = null;
        clickedCht.selected = false;
        if ((clickedCht as InputCohort).outputCohorts !== undefined) {
          delete (clickedCht as InputCohort).outputCohorts;
        }
        log.info('De-Selected "' + clickedCht.label + '"');

      } else {
        if (this.firstCohort) { // this is the first cohort the user selected
          this.app.setAppGridLayout('split'); //show bottom
          this.firstCohort = false;
        }

        this.selection.push(clickedCht);
        clickedCht.colorTaskView = null;
        clickedCht.selected = true;
        log.info('Selected "' + clickedCht.label + '"');
      }

      //  set selection in taskview
      this.taskview.setInputCohorts(this.selection);

      this.selection.forEach((cht) => cht.selected = true);
      this.taskview.clearOutput(); // every selection change clears the output cohorts
    }
  }
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

function showAboutLink(title: HTMLElement, content: HTMLElement) {
  title.innerHTML = 'Coral';

  // insert disclaimer
  const caleydoInfo = content.querySelector(`.caleydoInfo p`);
  content.innerHTML = `<article class="about-disclaimer">${aboutDisclaimer}</article>`;

  // move the information about caleydo to the source code section and remove the rest of the info
  document.getElementById('about-source-code').insertAdjacentElement('beforeend', caleydoInfo);

  AppMetaDataUtils.getMetaData().then((metaData) => {
    document.getElementById('about-source-code').insertAdjacentHTML('beforeend', `<p class="version"><strong>Version</strong>: ${metaData.version}</p>`);
  });
}
