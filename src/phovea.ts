/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */
import {IRegistry} from 'phovea_core';
import {EXTENSION_POINT_CUSTOMIZED_LOGIN_FORM} from 'phovea_security_flask';

export default function (registry: IRegistry) {
  // Coral's custom login form
  registry.push(EXTENSION_POINT_CUSTOMIZED_LOGIN_FORM, 'tdpBioinfoLoginForm', () => import('./LoginDialog'), {});

  // helper functions copied from tdp_core:
  // -------------------------------------------------------------------------------------------------------
  function actionFunction(id: string, factory: string, loader: () => any, options?: {}) {
    registry.push('actionFunction', id, loader, {factory, ...options});
  }

  // id: id string for comporessor action
  // factory: name of the compressor functtion
  // matches: string that defines the actions that should be compressed '([function1_id]|[function2_id])'
  function actionCompressor(id: string, factory: string, matches: string, loader: () => any) {
    registry.push('actionCompressor', id, loader, {factory, matches});
  }

  // Cohort action functions:
  // -------------------------------------------------------------------------------------------------------

  /**
   * Set the base data-set
   */
  actionFunction('chtSetDataset', 'setDatasetImpl', () => import('./app').then((a) => a.App), { //setDatasetImpl = function that acutally sets the dataset
    analytics: {
      category: 'data', // this one is a data operation (other options are visual, selections, layout, and analysis)
      action: 'setDataset' // --> function to create an action in the prov tree
    }
  });

  actionCompressor('tdpCompressChtSetDataset', 'compressChtSetDataset', '(chtSetDataset)', () => import('./app').then((a) => a.App));
}
