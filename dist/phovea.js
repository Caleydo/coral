import { EXTENSION_POINT_CUSTOMIZED_LOGIN_FORM } from 'phovea_security_flask';
export default function (registry) {
    // Coral's custom login form
    registry.push(EXTENSION_POINT_CUSTOMIZED_LOGIN_FORM, 'tdpBioinfoLoginForm', () => import('./LoginDialog'), {});
    // helper functions copied from tdp_core:
    // -------------------------------------------------------------------------------------------------------
    function actionFunction(id, factory, loader, options) {
        registry.push('actionFunction', id, loader, { factory, ...options });
    }
    // id: id string for comporessor action
    // factory: name of the compressor functtion
    // matches: string that defines the actions that should be compressed '([function1_id]|[function2_id])'
    function actionCompressor(id, factory, matches, loader) {
        registry.push('actionCompressor', id, loader, { factory, matches });
    }
    // Cohort action functions:
    // -------------------------------------------------------------------------------------------------------
    /**
     * Set the base data-set
     */
    actionFunction('chtSetDataset', 'setDatasetImpl', () => import('./app').then((a) => a.App), {
        analytics: {
            category: 'data',
            action: 'setDataset' // --> function to create an action in the prov tree
        }
    });
    actionCompressor('tdpCompressChtSetDataset', 'compressChtSetDataset', '(chtSetDataset)', () => import('./app').then((a) => a.App));
}
//# sourceMappingURL=phovea.js.map