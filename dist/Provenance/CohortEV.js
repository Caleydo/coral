import { ActionMetaData, ActionUtils, ObjectRefUtils } from 'phovea_core';
import { log } from '../util';
/***********************************************
 ----- Cohort Evolution View (CohortEV) --------
************************************************/
// ----------------------------
// ---- Add Cohort(s) ---------
// ----------------------------
export function addOverviewCohortAction(provider, providerApp, newDataset, oldDataset) {
    log.debug('Add Cohort Action');
    return ActionUtils.action(ActionMetaData.actionMeta('Add Cohort(s)', ObjectRefUtils.category.data, ObjectRefUtils.operation.create), 'addCohorts', addOverviewCohortImpl, [provider, providerApp], {
        newDataset,
        oldDataset
    });
}
export async function addOverviewCohortImpl(inputs, parameter) {
    log.debug('addOverviewCohortImpl', { inputs, parameter });
    // get app CohortApp
    const app = await inputs[1].v;
    // get the overview of CohortApp
    const ovApp = app.getAppOverview();
    if (ovApp) {
        await ovApp.generateOverviewProv(parameter.newDataset);
        ovApp.updateJSONElements();
    }
    return {
        inverse: addOverviewCohortAction(inputs[0], inputs[1], parameter.oldDataset, parameter.newDataset)
    };
}
// ----------------------------
// ---- Remove Cohort(s) ------
// ----------------------------
export function removeOverviewCohortAction(provider, providerApp, newDataset, oldDataset) {
    log.debug('Remove Cohort Action');
    return ActionUtils.action(ActionMetaData.actionMeta('Remove Cohort(s)/Operation(s)', ObjectRefUtils.category.data, ObjectRefUtils.operation.remove), 'removeCohorts', removeOverviewCohortImpl, [provider, providerApp], {
        newDataset,
        oldDataset
    });
}
export async function removeOverviewCohortImpl(inputs, parameter) {
    log.debug('removeOverviewCohortImpl', { inputs, parameter });
    // get app CohortApp
    const app = await inputs[1].v;
    // get the overview of CohortApp
    const ovApp = app.getAppOverview();
    if (ovApp) {
        await ovApp.generateOverviewProv(parameter.newDataset);
        ovApp.updateJSONElements();
    }
    return {
        inverse: removeOverviewCohortAction(inputs[0], inputs[1], parameter.oldDataset, parameter.newDataset)
    };
}
//# sourceMappingURL=CohortEV.js.map