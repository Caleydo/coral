import { IObjectRef, ProvenanceGraph, IDatabaseViewDesc, RestBaseUtils } from 'tdp_core';
import { CohortSelectionListener } from './app/CoralSelectionListener';
import type { CoralApp } from './app/CoralApp';
import { OnboardingManager } from './OnboardingManager';
import { CohortOverview } from './Overview/CohortOverview';
import { RectangleLayout } from './Overview/OverviewLayout';
import Taskview from './Taskview/Taskview';
import { handleDataLoadError, log } from './util';
import { IEntitySourceConfig } from './config/entities';
import { ICohort } from './app/interfaces';
import { CohortContext } from './CohortContext';

export function destroyOld() {
  if (CohortContext.taskview) {
    CohortContext.taskview.destroy();
    CohortContext.taskview = null;
  }
  if (CohortContext.cohortOverview) {
    CohortContext.cohortOverview.destroy();
    CohortContext.cohortOverview = null;
  }
  CohortContext.referenceCohort = null;
}

export async function loadViewDescription(database: string, view: string) {
  log.debug('getTDPDesc for: db:', database, ' |view: ', view);
  try {
    const descr: IDatabaseViewDesc = await RestBaseUtils.getTDPDesc(database, view);
    log.debug('descr= ', descr);
    return descr;
  } catch (e) {
    handleDataLoadError(e);
    return null;
  }
}

export async function createCohortOverview(
  graph: ProvenanceGraph,
  ref: IObjectRef<CoralApp>,
  container: HTMLDivElement,
  detailView: HTMLDivElement,
  idTypeConfig: IEntitySourceConfig,
  rootCohort: ICohort,
): Promise<{ cohortOV: CohortOverview; taskV: Taskview }> {
  const viewDescription: IDatabaseViewDesc = await loadViewDescription(idTypeConfig.dbConnectorName, idTypeConfig.viewName);
  log.debug('retrievedViewDesctiprion', viewDescription);

  destroyOld();

  // set reference/root cohort
  CohortContext.referenceCohort = rootCohort; // save reference cohort
  log.debug('cohortview - root: ', rootCohort);

  // create Overview
  CohortContext.cohortOverview = new CohortOverview(container, graph, ref, new RectangleLayout(130, 50, 50, 50), rootCohort, viewDescription);
  // create Taskview
  CohortContext.taskview = new Taskview(detailView, rootCohort);

  CohortSelectionListener.get().taskview = CohortContext.taskview;
  // draw overview in container element
  CohortContext.cohortOverview.generateOverview();

  OnboardingManager.addTip('rootCohort', rootCohort.representation.getRepresentation());
  return {
    cohortOV: CohortContext.cohortOverview,
    taskV: CohortContext.taskview,
  };
}
