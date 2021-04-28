import { select } from 'd3-selection';
import { Compression } from 'phovea_clue';
import { ActionMetaData, ActionUtils, AppContext, ObjectRefUtils } from 'phovea_core';
import { AppMetaDataUtils } from 'phovea_ui';
import SplitGrid from 'split-grid';
import { ATDPApplication, RestBaseUtils } from 'tdp_core';
import { cellline, tissue } from 'tdp_publicdb';
import { cohortOverview, createCohortOverview, destroyOld, taskview } from './cohortview';
import { OnboardingManager } from './OnboardingManager';
import loginDialog from './templates/LoginDialog.html';
import welcomeHtml from './templates/Welcome.html'; // webpack imports html to variable
import * as aboutDisclaimer from './templates/_aboutDisclaimer.html';
import { handleDataLoadError, log, removeFromArray } from './util';
import { CohortSelectionEvent, COHORT_SELECTION_EVENT_TYPE, CONFIRM_TASK_EVENT_TYPE, PreviewConfirmEvent } from './utilCustomEvents';
import { idCellline, idCovid19, idStudent, idTissue } from './utilIdTypes';
/**
 * The Cohort app that does the acutal stuff.
 */
export class CoralApp {
    constructor(graph, manager, parent, name = 'Cohort') {
        this.dataset = null;
        this.datasetEventID = 0;
        this.firstOutput = true;
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
        this.$node.node().addEventListener(CONFIRM_TASK_EVENT_TYPE, (ev) => this.handleConfirmTask(ev));
        return this.build();
    }
    async handleConfirmTask(ev) {
        const taskParams = ev.detail.params; // task parameters (e.g. column/category to filter)
        const taskAttributes = ev.detail.attributes;
        // confirm the current preview as the result of the task
        this.$node.node().dispatchEvent(new PreviewConfirmEvent(taskParams, taskAttributes));
        // get the new added task (the ones confirmed from the preview)
        const tasks = cohortOverview.getLastAddedTasks();
        taskview.clearOutput(); //clear taskview output
        //set output as new input
        let replace = true;
        for (const task of tasks) {
            for (const cht of task.children) {
                this.$node.node().dispatchEvent(new CohortSelectionEvent(cht, replace));
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
    async build() {
        log.debug('Build app html structure');
        this.$node.selectAll('*').remove();
        // get all databses
        const databases = await this.getDatabases();
        // find databases with idtypes (i.e. with data we can use in Coral)
        const dataSources = this.defineIdTypes(databases);
        // check if there are also predefined subsets of the data (panels/predefiend sets)
        const dataSourcesAndPanels = await Promise.all(dataSources.map(async (d) => ({
            source: d,
            panels: (d.idType === cellline.idType || d.idType === tissue.idType) ? await RestBaseUtils.getTDPData(d.dbConnectorName, `${d.base}_panel`) : []
            // check for idType, because for other data sources currently no panels exist, e.g. covid19
            // TODO: check if there are sets stored by the user (namedsets (private/public))
            //  * const namedSets = await RestStorageUtils.listNamedSets();
            //  * const namedSetOptions = await RestStorageUtils.listNamedSetsAsOptions();
        })));
        const that = this;
        const controlBar = this.$node.append('div').attr('class', 'control-bar');
        controlBar.append('span').text('Datasets:');
        const btnGrp = controlBar.append('div').attr('id', 'db_btnGrp').attr('style', 'display: flex;gap: 0.5em;');
        const datasetGroup = btnGrp.selectAll('div.btn-group').data(dataSourcesAndPanels) //create a btngroup for each data source
            .enter().append('div').classed('btn-group btn-group-sm', true);
        datasetGroup.append('button')
            .attr('type', 'button')
            .attr('class', 'db_btn btn btn-default')
            .attr('data-db', (d) => d.source.dbConnectorName)
            .attr('data-dbview', (d) => d.source.viewName)
            .html((d) => { return d.source.idType.toUpperCase(); })
            .on('click', async function (d) {
            var _a, _b;
            if (((_b = (_a = that.dataset) === null || _a === void 0 ? void 0 : _a.source) === null || _b === void 0 ? void 0 : _b.idType) === d.source.idType) {
                //deselect
                that.graph.push(App.setDataset(that.ref, { source: null }, that.dataset));
            }
            else {
                //set data
                that.graph.push(App.setDataset(that.ref, { source: d.source }, that.dataset));
            }
        });
        datasetGroup.append('button')
            .attr('type', 'button')
            .attr('class', 'db_btn btn btn-default dropdown-toggle')
            .attr('data-toggle', 'dropdown')
            .append('span').classed('caret', true);
        const dropdown = datasetGroup
            .append('ul').classed('dropdown-menu', true);
        dropdown.append('li').append('a').text('All')
            .on('click', async (d) => that.graph.push(App.setDataset(that.ref, { source: d.source }, that.dataset))); // don't toggle data by checkging what is selected in dropdown
        dropdown.append('li').attr('role', 'separator').classed('divider', true);
        dropdown.append('li').classed('dropdown-header', true).text('Predefined Sets');
        dropdown
            .selectAll('li.panel')
            .data((d) => d.panels)
            .enter()
            .append('li') //.classed('panel', true)
            .append('a').text((d) => d.id).attr('title', (d) => d.description)
            .on('click', function (d) {
            const dataSourcesAndPanels = select(this.parentNode.parentNode).datum(); // a -> parent = li -> parent = dropdown = ul
            that.graph.push(App.setDataset(that.ref, { source: dataSourcesAndPanels.source, panel: d }, that.dataset));
        });
        OnboardingManager.addTip('dataset', btnGrp.node());
        // new div for the css grid overview
        this.$overview = this.$node.append('div').attr('id', 'chtOverview').node();
        this.$overview.insertAdjacentHTML('beforeend', welcomeHtml);
        // add the dragger and the functionality to the app
        this._addSplitScreenDraggerFunctionality(this.$node);
        this.$detail = this.$node.append('div').node();
        // set grid layout of app
        this.setAppGridLayout('top');
        return Promise.resolve(this);
    }
    async getDatabases() {
        let databases;
        // get all databases
        try {
            databases = await AppContext.getInstance().getAPIJSON('/tdp/db/');
            log.debug('Available databases: ', databases);
        }
        catch (e) {
            handleDataLoadError(e);
        }
        return [].concat(databases);
    }
    defineIdTypes(databases) {
        const idTypes = [];
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
    /**
     * loads the needed data and creates the graph
     * @param database name of the database
     * @param view name of the view
     */
    async setDataset(dataset) {
        select('#db_btnGrp').selectAll('button').classed('btnSel', false); //remove selected class from all buttons
        const currEventID = ++this.datasetEventID; // save current EventId that and incerease the gloabl one
        CohortSelectionListener.reset();
        if (dataset !== null && dataset.source) {
            const source = dataset.source;
            if (source.dbConnectorName && source.viewName) {
                const viewDescription = await this.loadViewDescription(source.dbConnectorName, source.viewName);
                log.debug('retrievedViewDesctiprion', viewDescription);
                // check if current event is the last called event
                if (currEventID === this.datasetEventID) {
                    this.dataset = dataset;
                    select('#db_btnGrp').select(`button[data-db="${source.dbConnectorName}"][data-dbview="${source.viewName}"]`).classed('btnSel', true); //add selected class to current button
                    createCohortOverview(this.$overview, viewDescription, this.$detail, this.dataset.source, this.dataset.panel);
                }
            }
        }
        else if (currEventID === this.datasetEventID) {
            destroyOld();
            this.dataset = dataset;
            this.setAppGridLayout('top');
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
    /**
     * load the description of the given database and view
     * @param database database name
     * @param view view id
     */
    async loadViewDescription(database, view) {
        log.debug('getTDPDesc for: db:', database, ' |view: ', view);
        try {
            const descr = await RestBaseUtils.getTDPDesc(database, view);
            log.debug('descr= ', descr);
            return descr;
        }
        catch (e) {
            handleDataLoadError(e);
        }
    }
    _addSplitScreenDraggerFunctionality(container) {
        // add slider between the two containers
        const dragger = container.append('div').attr('id', 'dragger');
        const draggerDots = dragger.append('svg').attr('class', 'dragger-dots');
        draggerDots.append('rect').attr('x', '0').attr('y', '1').attr('height', '3').attr('width', '3');
        draggerDots.append('rect').attr('x', '6').attr('y', '1').attr('height', '3').attr('width', '3');
        draggerDots.append('rect').attr('x', '12').attr('y', '1').attr('height', '3').attr('width', '3');
        // add functionality
        SplitGrid({
            rowGutters: [{
                    track: 2,
                    element: document.querySelector('#dragger')
                }],
            snapOffset: 30,
            onDragEnd: () => window.dispatchEvent(new Event('resize')) //update responsive vega charts
        });
        // add buttons to switch
        const screenControls = container.select('.control-bar').append('div').attr('class', 'screen-controls');
        screenControls.append('span').html('Change Layout:&ensp;');
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
    _createScreenControlBtn(label, type) {
        const divBtn = document.createElement('div');
        divBtn.classList.add('sc-button');
        divBtn.title = label;
        // icon
        const divIcon = document.createElement('div');
        divIcon.classList.add('icon');
        // separator
        const divIconSeparator = document.createElement('div');
        divIconSeparator.style.height = type === 'top' ? '85%' : (type === 'split' ? '50%' : '15%');
        divIcon.appendChild(divIconSeparator);
        divBtn.appendChild(divIcon);
        return divBtn;
    }
    setAppGridLayout(type) {
        const entityBtnHeight = 'auto';
        const draggerHeight = '7px';
        let gridRowTemplate = `${entityBtnHeight} 1fr ${draggerHeight} 1fr`;
        if (type === 'top') {
            gridRowTemplate = `${entityBtnHeight} 1fr ${draggerHeight} 0px`;
        }
        else if (type === 'bot') {
            gridRowTemplate = `${entityBtnHeight} 0px ${draggerHeight} 1fr`;
        }
        else {
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
export class App extends ATDPApplication {
    constructor(name) {
        super({
            prefix: 'cohort',
            name,
            loginForm: loginDialog,
            showAboutLink,
            showCookieDisclaimer: true,
        });
    }
    createApp(graph, manager, main) {
        log.debug('Create App');
        return new CoralApp(graph, manager, main, this.options.name).init();
    }
    initSessionImpl(app) {
        log.debug('initSessionImpl. Is Graph empty?', app.graph.isEmpty);
        this.jumpToStoredOrLastState();
    }
    static async setDatasetImpl(inputs, parameter) {
        log.debug('setDataset impl', parameter.oldDataset, parameter.newDataset);
        const app = await inputs[0].v;
        app.setDataset(parameter.newDataset);
        return {
            inverse: App.setDataset(inputs[0], parameter.oldDataset, parameter.newDataset)
        };
    }
    static setDataset(provider, newDataset, oldDataset) {
        log.debug('Create setDataset Action');
        return ActionUtils.action(ActionMetaData.actionMeta('Change Dataset', ObjectRefUtils.category.data, ObjectRefUtils.operation.update), 'chtSetDataset', App.setDatasetImpl, [provider], {
            newDataset,
            oldDataset
        });
    }
    static compressChtSetDataset(path) {
        return Compression.lastOnly(path, 'chtSetDataset', (p) => `${p.requires[0].id}_${p.parameter.newDataset}`);
    }
}
export class CohortSelectionListener {
    constructor(eventTarget, app) {
        this.eventTarget = eventTarget;
        this.app = app;
        this.selection = [];
        this.firstCohort = true;
        eventTarget.addEventListener(COHORT_SELECTION_EVENT_TYPE, (ev) => this.handleSelectionEvent(ev)); //arrow function to keep "this" working in eventhandler
    }
    static get() {
        return CohortSelectionListener.instance;
    }
    static init(eventTarget, app) {
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
    handleSelectionEvent(ev) {
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
                if (clickedCht.outputCohorts !== undefined) {
                    delete clickedCht.outputCohorts;
                }
                log.info('De-Selected "' + clickedCht.label + '"');
            }
            else {
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
function showAboutLink(title, content) {
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
//# sourceMappingURL=app.js.map