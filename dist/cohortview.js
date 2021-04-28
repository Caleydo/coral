import { CohortSelectionListener } from './app';
import { createCohort } from './Cohort';
import { PanelScoreAttribute } from './data/Attribute';
import { OnboardingManager } from './OnboardingManager';
import { CohortOverview } from './Overview/CohortOverview';
import { RectangleLayout } from './Overview/OverviewLayout';
import Taskview from './Taskview/Taskview';
import { log } from './util';
import { niceName } from './utilLabels';
export let cohortOverview;
export let taskview;
let referenceCohort;
export async function createCohortOverview(container, viewDescr, detailView, idTypeConfig, panel) {
    const viewDescription = viewDescr;
    // set idColumn for task view
    // export interface IEntitySourceConfig {
    //   idType: string;
    //   name: string;
    //   dbConnectorName: string;
    //   dbConnector: string;
    //   schema: string;
    //   viewName: string;
    //   tableName: string;
    //   entityName: string;
    //   base: string;
    //   baseStatement: string;
    // }
    const idColumn = viewDescription.columns.find((col) => col.label === 'id') || { column: 'id', label: 'id', type: 'string' };
    // create overview class
    /*createCohort(
      name: string,
      isInitial: boolean,
      previousCohortId: number,
      database: string,
      schema: string,
      table: string,
      statement: string,
      idType: IDTypeLike,
      idColumn: string,
      filters: IAllFilters {normal: {}, lt: {}, lte: {}, gt: {}, gte: {}} ) {*/
    let reference = await createCohort(niceName(idTypeConfig.idType), 'All', true, -1, idTypeConfig.dbConnector, idTypeConfig.dbConnectorName, idTypeConfig.schema, idTypeConfig.tableName, idTypeConfig.viewName, idTypeConfig.idType, idColumn, { normal: {}, lt: {}, lte: {}, gt: {}, gte: {} });
    if (panel) {
        const panelAttr = new PanelScoreAttribute(panel.id, idTypeConfig.viewName, idTypeConfig.dbConnectorName, 'categorical');
        reference = await panelAttr.filter(reference, { values: ['true'] });
        reference.labelOne = idTypeConfig.idType;
        reference.labelTwo = panel.id;
    }
    reference.isInitial = true; // set cohort as root
    log.debug('root: ', reference);
    // clean up/destory the old parts of the application
    destroyOld();
    // save reference cohort
    referenceCohort = reference;
    // create Overview
    cohortOverview = new CohortOverview(container, new RectangleLayout(130, 50, 50, 50), reference, viewDescription);
    // create Taskview
    taskview = new Taskview(detailView, reference);
    CohortSelectionListener.get().taskview = taskview;
    // draw overview in container element
    updateOverview(cohortOverview);
    OnboardingManager.addTip('rootCohort', reference.representation.getRepresentation());
}
export function getRootCohort() {
    return referenceCohort;
}
export function destroyOld() {
    if (taskview) {
        taskview.destroy();
        taskview = null;
    }
    if (cohortOverview) {
        cohortOverview.destroy();
        cohortOverview = null;
    }
    referenceCohort = null;
}
export function updateOverview(overview) {
    overview.generateOverview();
}
//# sourceMappingURL=cohortview.js.map