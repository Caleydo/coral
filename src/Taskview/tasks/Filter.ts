import { Selection } from 'd3v7';
import { ICohort } from '../../app/interfaces';
import { IAttribute } from '../../data/IAttribute';
import { getAnimatedLoadingText, log } from '../../util';
import { AreaChart } from '../visualizations/AreaChart';
import { AVegaVisualization } from '../visualizations/AVegaVisualization';
import { Option, OptionGroup, VisConfig } from '../visualizations/config/VisConfig';
import { DensityPlot } from '../visualizations/DensityPlot';
import { GroupedBoxplot } from '../visualizations/GroupedBoxplot';
import { VegaGroupedHistogram } from '../visualizations/GroupedHistogram';
import { KaplanMeierPlot } from '../visualizations/KaplanMeierPlot';
import { Scatterplot } from '../visualizations/Scatterplot';
import { ATask } from './ATask';

export class Filter extends ATask {
  public label = `View, Filter & Split`;

  public id = `filter`;

  public hasOutput = true;

  public vis: AVegaVisualization;

  public $visContainer: HTMLDivElement;

  controls: Selection<HTMLDivElement, any, null, undefined>;

  private eventID = 0;

  visualizations: { new (): AVegaVisualization }[]; // non-absract subclasses

  attributes: IAttribute[];

  cohorts: ICohort[];

  supports(attributes: IAttribute[], cohorts: ICohort[]) {
    return cohorts.length > 0;
  }

  showSearchBar() {
    return true;
  }

  async show(columnHeader: HTMLDivElement, container: HTMLDivElement, attributes: IAttribute[], cohorts: ICohort[]) {
    super.show(columnHeader, container, attributes, cohorts);

    if (attributes.length > 0) {
      this.addVisSelector();
    }

    this.$visContainer = this.body.append('div').classed('vis-container', true).node();
    // TODO #427 check number of attributes and theid types to define the visualizations
    switch (attributes.length) {
      case 0:
        this.$visContainer.innerHTML = '';
        break;
      case 1:
        this.show1Attribute(attributes[0], cohorts);
        break;
      case 2:
        this.show2Attributes(attributes, cohorts);
        break;
      default: // 3 or more
        this.showTsne(attributes, cohorts);
        break;
    }
  }

  addVisSelector() {
    this.header.append('div').classed('vis-selector', true).html(`
        <div class="btn-group vis-header"> <!-- vis dropdown and settings -->
          <div class="btn-group vis-type"> <!-- vis dropdown -->
            <button type="button" class="btn btn-coral dropdown-toggle" data-bs-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
              <span class="type"></span>
            </button>
            <ul class="dropdown-menu">
              <!-- Insert visualizations here, e.g.:
                <li class="dropdown-item"><a>Histogram</a></li>
                <li class="dropdown-item"><a>Density Plot</a></li>
              -->
            </ul>
          </div>
          <!-- insert vis configs here -->
        </div>
      `);
  }

  private async show1Attribute(attribute: IAttribute, cohorts: ICohort[]) {
    this.attributes = [attribute];
    this.cohorts = cohorts;

    if (cohorts.length === 0) {
      this.$visContainer.innerHTML = '<p>Select one or more cohorts to see visualizations <i class="fas fa-chart-bar" aria-hidden="true"></i></p>';
    } else if (cohorts.length >= 1) {
      if (attribute.type === 'number') {
        const visualizations: { new (): AVegaVisualization }[] = [DensityPlot];
        if (attribute.id === 'days_to_death' || attribute.id === 'days_to_last_followup') {
          visualizations.unshift(KaplanMeierPlot);
        }
        this.setVisualizations(visualizations);
      } else {
        this.setVisualizations([VegaGroupedHistogram]);
      }
    }
  }

  private async show2Attributes(attributes: IAttribute[], cohorts: ICohort[]) {
    this.attributes = attributes;
    this.cohorts = cohorts;

    if (cohorts.length === 0) {
      this.$visContainer.innerHTML = '<p>Select one or more cohorts to see visualizations <i class="fas fa-chart-bar" aria-hidden="true"></i></p>';
    } else if (cohorts.length >= 1) {
      if (attributes.every((attr) => attr.type === 'number')) {
        const visualizations: { new (): AVegaVisualization }[] = [Scatterplot];
        if (attributes.every((attr) => ['days_to_death', 'days_to_last_followup'].includes(attr.id))) {
          visualizations.unshift(KaplanMeierPlot);
        }
        this.setVisualizations(visualizations);
      } else if (attributes.every((attr) => ['categorical', 'string'].includes(attr.type))) {
        this.setVisualizations([AreaChart]);
      } else if (attributes.some((attr) => attr.type === 'number') && attributes.some((attr) => ['categorical', 'string'].includes(attr.type))) {
        this.setVisualizations([GroupedBoxplot]);
      } else {
        this.$visContainer.innerHTML = 'Currently no visualization supports the selected attribute combination!';
      }
    }
  }

  private async showTsne(attributes: IAttribute[], cohorts: ICohort[]) {
    this.$visContainer.innerHTML = 'Currently, we only support the visualization of up to two attributes.';
    // TODO #647 fix tsne implementation
    // this.attributes = attributes;
    // this.cohorts = cohorts;
    // this.setVisualizations([TsneScatterplot]);
  }

  set title(title: string) {
    this.header.select('.vis-selector .vis-type .type').each(function () {
      (this as HTMLSpanElement).textContent = title;
    });
  }

  setVisualizations(visualizations: { new (): AVegaVisualization }[]) {
    this.visualizations = visualizations;

    // Show the first one
    if (visualizations.length > 0) {
      this.showWithVis(new visualizations[0]());

      // only add dropdown caret for vis types if there are more than one
      this.header.select('.vis-selector .vis-type button').classed('dropdown-toggle', visualizations.length > 1);

      const entries = this.header.select('.vis-selector .vis-type ul.dropdown-menu').selectAll('li').data(visualizations);

      entries
        .enter()
        .append('li')
        .classed('dropdown-item', true)
        .classed('selected', (vis) => (vis as any).NAME === (this.vis.constructor as any).NAME)
        .append('a')
        .text((vis) => (vis as any).NAME) // cast to any to access static property
        .on('click', (event, VisClass) => {
          if ((VisClass as any).NAME !== (this.vis.constructor as any).NAME) {
            // check if vis has changed
            this.header.selectAll('.vis-selector .vis-type li').classed('selected', (vis) => (vis as any).NAME === (VisClass as any).NAME);
            this.showWithVis(new VisClass());
          }
        });
    }
  }

  async showWithVis(vis: AVegaVisualization) {
    const eventId = ++this.eventID; // get new eventID, we will compare it with the field again to see if it is still up to date

    // remove old vis
    if (this.vis) {
      this.vis.destroy();
    }
    this.$visContainer.innerHTML = '';

    // show loading
    const loading = getAnimatedLoadingText('data');
    this.$visContainer.appendChild(loading); // show loader

    // set new vis
    this.vis = vis;
    this.title = (vis.constructor as any).NAME; // access static property from instance via constructor property
    try {
      await vis.show(this.$visContainer, this.attributes, this.cohorts);
      if (eventId !== this.eventID) {
        // remove the visualization if we changed it in the meantime
        vis.destroy();
      } else {
        // Show options
        const configs = vis.getConfig();

        const entries = this.header
          .select('.vis-selector .vis-header')
          .selectAll('.vis-config')
          .data(configs, (d) => (d as VisConfig).label);

        const configGrps = entries.enter().append('div').classed('vis-config btn-group', true);

        configGrps
          .append('button')
          .attr('type', 'button')
          .classed('btn btn-coral', true) //  dropdown-toggle class to avoid dropdown caret symbol
          .attr('data-bs-toggle', 'dropdown')
          .attr('title', (d) => `${d.label} Config`)
          .append('span')
          .classed('icon', true)
          .html((d) => d.icon);

        const configDropdown = configGrps
          .append('ul')
          .classed('dropdown-menu dropdown-menu-right', true)
          .selectAll('li')
          .data((d) => d.groups.flatMap((group) => [group, ...group.options])); // headers and options are on the same level, so create one array that contains both

        const configHeader = configDropdown
          .enter()
          .append('li')
          .attr('class', (d) => ((d as OptionGroup).options ? 'dropdown-header' : 'dropdown-item'))
          .html((d) => ('icon' in d ? `${d.icon} ${d.label}` : `<a>${d.label}</a>`));

        configHeader
          .filter('.dropdown-item')
          .attr('data-group', (d: Option) => d.group.label)
          .classed('selected', (d) => (d as Option).selected)
          .on('click', (evemt, d: Option) => {
            this.header.selectAll(`li.dropdown-item[data-group="${d.group.label}"]`).classed('selected', (option) => d === option);
            vis.selectOption(d);
          });

        entries.exit().remove();
      }

      // remove loading
      if (this.$visContainer.contains(loading)) {
        loading.remove();
      }
    } catch (e) {
      let msg = 'Creating the visualization failed.';
      log.error(msg, e);
      // remove loading
      if (this.$visContainer.contains(loading)) {
        loading.remove();
      }

      let icon = `<i class="fa fa-times" aria-hidden="true"></i>`;
      if (e.message === 'Internal Server Error') {
        msg = 'Could not retrieve the data.';
        icon = `<i class="fa fa-hourglass-end" aria-hidden="true"></i>`;
      }

      this.$visContainer.insertAdjacentHTML(
        'afterbegin',
        `
        <p>
          ${icon}
          ${msg}
        </p>
      `,
      );
    }
  }
}
