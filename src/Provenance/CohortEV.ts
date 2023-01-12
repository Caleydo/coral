import { ActionMetaData, ActionUtils, ICmdResult, IObjectRef, ObjectRefUtils } from 'tdp_core';
import { CohortApp } from '../app';
import { IElementProvJSON } from '../CohortInterfaces';
import { CohortOverview } from '../Overview/CohortOverview';
import { log } from '../util';

/** *********************************************
 ----- Cohort Evolution View (CohortEV) --------
*********************************************** */

// ----------------------------
// ---- Add Cohort(s) ---------
// ----------------------------
export function addOverviewCohortAction(
  provider: IObjectRef<CohortOverview>,
  providerApp: IObjectRef<CohortApp>,
  newDataset: IElementProvJSON[],
  oldDataset: IElementProvJSON[],
) {
  log.debug('Add Cohort Action');
  return ActionUtils.action(
    ActionMetaData.actionMeta('Add Cohort(s)', ObjectRefUtils.category.data, ObjectRefUtils.operation.create),
    'addCohorts',
    addOverviewCohortImpl,
    [provider, providerApp],
    {
      newDataset,
      oldDataset,
    },
  );
}

export async function addOverviewCohortImpl(inputs: IObjectRef<any>[], parameter: any): Promise<ICmdResult> {
  log.debug('addOverviewCohortImpl', { inputs, parameter });
  // get app CohortApp
  const app: CohortApp = await inputs[1].v;
  // get the overview of CohortApp
  const ovApp = app.getAppOverview();
  if (ovApp) {
    await ovApp.generateOverviewProv(parameter.newDataset);
    ovApp.updateJSONElements();

    setChtCounter(parameter, app);
  }

  return {
    inverse: addOverviewCohortAction(inputs[0], inputs[1], parameter.oldDataset, parameter.newDataset),
  };
}

function setChtCounter(parameter: any, app: CohortApp) {
  const numbers = parameter.newDataset
    .filter((e) => e.type === 'Cohort')
    .map((e) =>
      parseInt(
        e.label
          .split(' ')[0] // extraxt #XY part
          .split('#')[1], // remove hash
        10,
      ),
    )
    .filter(Number.isFinite); // remove cohorts without number (i.e., root)
  const chts = Math.max(...numbers, 0) + 1; // continue with next number
  log.debug('set counter to ', chts, '; was', app.chtCounter);
  app.chtCounter = chts;
}

// ----------------------------
// ---- Remove Cohort(s) ------
// ----------------------------
export function removeOverviewCohortAction(
  provider: IObjectRef<CohortOverview>,
  providerApp: IObjectRef<CohortApp>,
  newDataset: IElementProvJSON[],
  oldDataset: IElementProvJSON[],
) {
  log.debug('Remove Cohort Action');
  return ActionUtils.action(
    ActionMetaData.actionMeta('Remove Cohort(s)/Operation(s)', ObjectRefUtils.category.data, ObjectRefUtils.operation.remove),
    'removeCohorts',
    removeOverviewCohortImpl,
    [provider, providerApp],
    {
      newDataset,
      oldDataset,
    },
  );
}

export async function removeOverviewCohortImpl(inputs: IObjectRef<any>[], parameter: any): Promise<ICmdResult> {
  log.debug('removeOverviewCohortImpl', { inputs, parameter });
  // get app CohortApp
  const app: CohortApp = await inputs[1].v;
  // get the overview of CohortApp
  const ovApp = app.getAppOverview();
  if (ovApp) {
    await ovApp.generateOverviewProv(parameter.newDataset);
    ovApp.updateJSONElements();

    setChtCounter(parameter, app);
  }

  return {
    inverse: removeOverviewCohortAction(inputs[0], inputs[1], parameter.oldDataset, parameter.newDataset),
  };
}
