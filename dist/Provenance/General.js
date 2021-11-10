import { ActionMetaData, ActionUtils, ObjectRefUtils } from 'phovea_core';
import { log } from '../util';
/******************************
 ---------- GENERAL ----------
*******************************/
// ----------------------------
// ---- DATASET ---------------
// ----------------------------
export function setDatasetAction(provider, newDataset, oldDataset) {
    log.debug('Create setDataset Action');
    return ActionUtils.action(ActionMetaData.actionMeta('Change Dataset', ObjectRefUtils.category.data, ObjectRefUtils.operation.update), 'chtSetDataset', setDatasetImpl, [provider], {
        newDataset,
        oldDataset
    });
}
export async function setDatasetImpl(inputs, parameter) {
    log.debug('setDataset impl', parameter.oldDataset, parameter.newDataset);
    const app = await inputs[0].v;
    await app.setDataset(parameter.newDataset);
    return {
        inverse: setDatasetAction(inputs[0], parameter.oldDataset, parameter.newDataset)
    };
}
//# sourceMappingURL=General.js.map