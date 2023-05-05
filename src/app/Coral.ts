import { select } from 'd3v7';
import { ATDPApplication, CLUEGraphManager, ProvenanceGraph } from 'tdp_core';
import { CoralApp } from './CoralApp';
import { log } from '../util';

/**
 * The app for this website, embeds our Cohort App
 */
export class Coral extends ATDPApplication<CoralApp> {
  constructor(name: string, loginDialog: string, showCookieDisclaimer = true) {
    super({
      prefix: 'coral',
      name,
      loginForm: loginDialog,
      /**
       * Link to help and show help in `Coral at a Glance` page instead
       */
      showHelpLink: `${`${window.location.href.split('app/')[0]}#/help`}`,
      showCookieDisclaimer,
      /**
       * Show content in the `Coral at a Glance` page instead
       */
      showAboutLink: false,
      /**
       * Show content in the `Coral at a Glance` page instead
       */
      showReportBugLink: false,
      clientConfig: {
        contact: {
          href: 'https://github.com/Caleydo/Coral/issues/',
          label: 'report an issue',
        },
      },
    });

    console.log('clientConfig', this.options.clientConfig);
    console.log('clientConfig contact', this.options.clientConfig?.contact);
  }

  protected createApp(graph: ProvenanceGraph, manager: CLUEGraphManager, main: HTMLElement): CoralApp | PromiseLike<CoralApp> {
    log.debug('Create App');
    this.replaceHelpIcon();
    return new CoralApp(graph, manager, main, this.options).init();
  }

  private replaceHelpIcon() {
    const helpButton = select(this.header.rightMenu).select('li[data-header="helpLink"]');
    helpButton.select('span.fa-stack').remove();
    helpButton.select('a.nav-link').insert('i', ':first-child').attr('class', 'fa fa-question-circle');
  }

  protected initSessionImpl(app: CoralApp) {
    log.debug('initSessionImpl. Is Graph empty?', app.graph.isEmpty);
    this.jumpToStoredOrLastState();
  }
}
