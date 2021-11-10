/* *****************************************************************************
 * Caleydo - Visualization for Molecular Biology - http://caleydo.org
 * Copyright (c) The Caleydo Team. All rights reserved.
 * Licensed under the new BSD license, available at http://caleydo.org/license
 **************************************************************************** */
import {IRegistry, PluginRegistry} from 'phovea_core';
import {EP_ORDINO_HEADER_MENU, EP_ORDINO_FOOTER_MENU, EP_ORDINO_START_MENU_TAB, EP_ORDINO_LOGO, EStartMenuSection, EP_ORDINO_START_MENU_TAB_SHORTCUT, IOrdinoFooterMenuDesc, IOrdinoLogoDesc, IOrdinoHeaderMenuDesc,IStartMenuTabShortcutDesc} from 'ordino';
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
  actionFunction('chtSetDataset', 'setDatasetImpl', () => import('./Provenance/General'), { //setDatasetImpl = function that acutally sets the dataset
    analytics: {
      category: 'data', // this one is a data operation (other options are visual, selections, layout, and analysis)
      action: 'setDatasetAction' // --> function to create an action in the prov tree
    }
  });

  // commented out due to errors in combination with Add/Remove Cohort actions
  // actionCompressor('tdpCompressChtSetDataset', 'compressChtSetDataset', '(chtSetDataset)', () => import('./Provenance/Genera').then();

  /**
   * Add Cohorts
   */
  actionFunction('addCohorts', 'addOverviewCohortImpl', () => import('./Provenance/CohortEV').then(), { //
    analytics: {
      category: 'data', // this one is a data operation (other options are visual, selections, layout, and analysis)
      action: 'addOverviewCohortAction' // --> function to create an action in the prov tree
    }
  });

  /**
   * Remove Cohorts
   */
  actionFunction('removeCohorts', 'removeOverviewCohortImpl', () => import('./Provenance/CohortEV').then(), { //
    analytics: {
      category: 'data', // this one is a data operation (other options are visual, selections, layout, and analysis)
      action: 'removeOverviewCohortAction' // --> function to create an action in the prov tree
    }
  });


  // Welcome Page:
  // -------------------------------------------------------------------------------------------------------

  registry.push(EP_ORDINO_START_MENU_TAB, 'ordino_dataset_tab', () => import('ordino/dist/internal/menu/tabs/DatasetsTab'), {
    text: 'Datasets',
    menu: EStartMenuSection.MAIN,
    priority: 10
  });

  registry.push(EP_ORDINO_START_MENU_TAB, 'ordino_sessions_tab', () => import('ordino/dist/internal/menu/tabs/SessionsTab'), {
    text: 'Analysis Sessions',
    menu: EStartMenuSection.MAIN,
    priority: 20
  });

  registry.push(EP_ORDINO_START_MENU_TAB_SHORTCUT, 'ordino_sessions_shortcut', () => ({}), <IStartMenuTabShortcutDesc>{
    text: 'Current Analysis Session',
    icon: 'fas fa-history',
    tabId: 'ordino_sessions_tab',
    setHighlight: true,
    priority: 10,
  });

  registry.push(EP_ORDINO_START_MENU_TAB, 'ordino_help_tab', () => import('./menu/HelpTab'), {
    icon: 'fas fa-question-circle fa-fw',
    menu: EStartMenuSection.RIGHT,
  });

  registry.push(EP_ORDINO_HEADER_MENU, 'ordino_header_menu', () => ({}), <IOrdinoHeaderMenuDesc>{
    links: [
      {
        faIcon: 'fas fa-newspaper fa-fw',
        text: 'What\'s new?',
        page: '/news'
      },
      {
        faIcon: 'fas fa-list fa-fw',
        text: 'Features',
        page: '/features'
      },
      {
        faIcon: 'fas fa-database fa-fw',
        text: 'Datasets',
        page: '/datasets'
      },
      {
        faIcon: 'fas fa-question-circle fa-fw',
        text: 'Help',
        page: '/help'
      }
    ]
  });

  registry.push(EP_ORDINO_FOOTER_MENU, 'ordino_footer_menu', () => ({}), <IOrdinoFooterMenuDesc>{
    lists: [
      [

        {
          page: '/news',
          faIcon: 'fas fa-fw fa-newspaper',
          text: `What's new?`,
        },
        {
          page: '/features',
          faIcon: 'fas fa-fw fa-list',
          text: `Features`,
        },
        {
          page: '/datasets',
          faIcon: 'fas fa-fw fa-database',
          text: `Loaded datasets`,
        },
        {
          page: '/publications',
          faIcon: 'fas fa-fw fa-book-open',
          text: `Publications`,
        }
      ],
      [
        {
          page: '/help/coral-at-a-glance',
          faIcon: 'fas fa-fw fa-eye',
          text: `Coral at a Glance`,
        },
        {
          page: '/help/contact-us',
          faIcon: 'fas fa-fw fa-at',
          text: `Contact us`,
        },
        {
          page: '/help/disclaimer',
          faIcon: 'fas fa-fw fa-exclamation-triangle',
          text: `Disclaimer`,
        },
        {
          page: '/help/terms-of-use',
          faIcon: 'fas fa-fw fa-user-tie',
          text: `Terms of use`,
        },
        {
          page: '/help/source-code-licenses',
          faIcon: 'fas fa-fw fa-code',
          text: `Source code & licenses`,
        },
      ]
    ]
  });

  registry.push(EP_ORDINO_LOGO, 'coral_logo', () => import('cohort/dist/assets/favicon.svg').then(PluginRegistry.getInstance().asResource), <IOrdinoLogoDesc>{
    text: 'Coral',
    width: 24,
    height: 24
  });
}
