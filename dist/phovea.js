/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */
import { EXTENSION_POINT_CUSTOMIZED_LOGIN_FORM } from 'tdp_core';
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
    actionFunction('chtSetDataset', 'setDatasetImpl', () => import('./Provenance/General'), {
        analytics: {
            category: 'data',
            action: 'setDatasetAction' // --> function to create an action in the prov tree
        }
    });
    // commented out due to errors in combination with Add/Remove Cohort actions
    // actionCompressor('tdpCompressChtSetDataset', 'compressChtSetDataset', '(chtSetDataset)', () => import('./Provenance/Genera').then();
    /**
     * Add Cohorts
     */
    actionFunction('addCohorts', 'addOverviewCohortImpl', () => import('./Provenance/CohortEV').then(), {
        analytics: {
            category: 'data',
            action: 'addOverviewCohortAction' // --> function to create an action in the prov tree
        }
    });
    /**
     * Remove Cohorts
     */
    actionFunction('removeCohorts', 'removeOverviewCohortImpl', () => import('./Provenance/CohortEV').then(), {
        analytics: {
            category: 'data',
            action: 'removeOverviewCohortAction' // --> function to create an action in the prov tree
        }
    });
}
//# sourceMappingURL=phovea.js.map