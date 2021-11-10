import { RestBaseUtils } from 'tdp_core';
import { CohortSelectionListener } from './app';
import { OnboardingManager } from './OnboardingManager';
import { CohortOverview } from './Overview/CohortOverview';
import { RectangleLayout } from './Overview/OverviewLayout';
import Taskview from './Taskview/Taskview';
import { handleDataLoadError, log } from './util';
export let cohortOverview;
export let taskview;
let referenceCohort;
export async function createCohortOverview(graph, ref, container, detailView, idTypeConfig, rootCohort) {
    const viewDescription = await loadViewDescription(idTypeConfig.dbConnectorName, idTypeConfig.viewName);
    log.debug('retrievedViewDesctiprion', viewDescription);
    destroyOld();
    // set reference/root cohort
    referenceCohort = rootCohort; // save reference cohort
    log.debug('cohortview - root: ', rootCohort);
    // create Overview
    cohortOverview = new CohortOverview(container, graph, ref, new RectangleLayout(130, 50, 50, 50), rootCohort, viewDescription);
    // create Taskview
    taskview = new Taskview(detailView, rootCohort);
    CohortSelectionListener.get().taskview = taskview;
    // draw overview in container element
    updateOverview(cohortOverview);
    OnboardingManager.addTip('rootCohort', rootCohort.representation.getRepresentation());
    return {
        cohortOV: cohortOverview,
        taskV: taskview
    };
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
export function getCohortOverview() {
    return cohortOverview;
}
export function getTaskview() {
    return taskview;
}
export function updateOverview(overview) {
    overview.generateOverview();
}
export async function loadViewDescription(database, view) {
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
//# sourceMappingURL=cohortview.js.map