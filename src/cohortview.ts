import {IObjectRef, ProvenanceGraph} from 'tdp_core';
import {IDatabaseViewDesc, RestBaseUtils} from 'tdp_core';
import {CohortApp, CohortSelectionListener} from './app';
import {Cohort} from './Cohort';
import {OnboardingManager} from './OnboardingManager';
import {CohortOverview} from './Overview/CohortOverview';
import {RectangleLayout} from './Overview/OverviewLayout';
import Taskview from './Taskview/Taskview';
import {handleDataLoadError, log} from './util';
import {IEntitySourceConfig} from './utilIdTypes';


export let cohortOverview: CohortOverview;
export let taskview: Taskview;

let referenceCohort: Cohort;

export async function createCohortOverview(graph: ProvenanceGraph, ref: IObjectRef<CohortApp>, container: HTMLDivElement, detailView: HTMLDivElement, idTypeConfig: IEntitySourceConfig, rootCohort: Cohort): Promise<{cohortOV: CohortOverview; taskV: Taskview;}> {
  const viewDescription: IDatabaseViewDesc = await loadViewDescription(idTypeConfig.dbConnectorName, idTypeConfig.viewName);
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


export function getRootCohort(): Cohort {
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

export function getCohortOverview(): CohortOverview {
  return cohortOverview;
}

export function getTaskview(): Taskview {
  return taskview;
}


export function updateOverview(overview: CohortOverview) {
  overview.generateOverview();
}

export async function loadViewDescription(database: string, view: string) {
  log.debug('getTDPDesc for: db:', database, ' |view: ', view);
  try {
    const descr: IDatabaseViewDesc = await RestBaseUtils.getTDPDesc(database, view);
    log.debug('descr= ', descr);
    return descr;
  } catch (e) {
    handleDataLoadError(e);
  }
}
