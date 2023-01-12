/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */
import { IRegistry } from 'tdp_core';

export default function (registry: IRegistry) {
  // helper functions copied from tdp_core:
  // -------------------------------------------------------------------------------------------------------
  function actionFunction(id: string, factory: string, loader: () => any, options?: {}) {
    registry.push('actionFunction', id, loader, { factory, ...options });
  }

  // id: id string for comporessor action
  // factory: name of the compressor functtion
  // matches: string that defines the actions that should be compressed '([function1_id]|[function2_id])'
  function actionCompressor(id: string, factory: string, matches: string, loader: () => any) {
    registry.push('actionCompressor', id, loader, { factory, matches });
  }

  // Cohort action functions:
  // -------------------------------------------------------------------------------------------------------

  /**
   * Set the base data-set
   */
  actionFunction('chtSetDataset', 'setDatasetImpl', () => import('./Provenance/General'), {
    // setDatasetImpl = function that acutally sets the dataset
    analytics: {
      category: 'data', // this one is a data operation (other options are visual, selections, layout, and analysis)
      action: 'setDatasetAction', // --> function to create an action in the prov tree
    },
  });

  // commented out due to errors in combination with Add/Remove Cohort actions
  // actionCompressor('tdpCompressChtSetDataset', 'compressChtSetDataset', '(chtSetDataset)', () => import('./Provenance/Genera').then();

  /**
   * Add Cohorts
   */
  actionFunction('addCohorts', 'addOverviewCohortImpl', () => import('./Provenance/CohortEV').then(), {
    //
    analytics: {
      category: 'data', // this one is a data operation (other options are visual, selections, layout, and analysis)
      action: 'addOverviewCohortAction', // --> function to create an action in the prov tree
    },
  });

  /**
   * Remove Cohorts
   */
  actionFunction('removeCohorts', 'removeOverviewCohortImpl', () => import('./Provenance/CohortEV').then(), {
    //
    analytics: {
      category: 'data', // this one is a data operation (other options are visual, selections, layout, and analysis)
      action: 'removeOverviewCohortAction', // --> function to create an action in the prov tree
    },
  });
}
