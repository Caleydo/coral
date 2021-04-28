import { getAnimatedLoadingText, log } from '../../util';
import { niceName } from '../../utilLabels';
import { AreaChart } from '../visualizations/AreaChart';
import { DensityPlot } from '../visualizations/DensityPlot';
import { GroupedBoxplot } from '../visualizations/GroupedBoxplot';
import { VegaGroupedHistogram } from '../visualizations/GroupedHistogram';
import { KaplanMeierPlot } from '../visualizations/KaplanMeierPlot';
import { Scatterplot, TsneScatterplot } from '../visualizations/Scatterplot';
import { ATask } from './ATask';
export class Filter extends ATask {
    constructor() {
        super(...arguments);
        this.label = `Filter & Split`;
        this.id = `filter`;
        this.hasOutput = true;
        this.eventID = 0;
    }
    supports(attributes, cohorts) {
        return cohorts.length > 0;
    }
    showSearchBar() {
        return true;
    }
    async show(container, attributes, cohorts) {
        super.show(container, attributes, cohorts);
        if (attributes.length > 0) {
            this.addVisSelector();
        }
        this.$visContainer = this.body.append('div').classed('vis-container', true).node();
        // TODO #427 check number of attributes and theid types to define the visualizations
        switch (attributes.length) {
            case 0:
                this.$visContainer.innerHTML = '<p>Select one or more attributes to see visualizations <i class="fas fa-chart-bar" aria-hidden="true"></i></p>';
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
        this.header.append('div')
            .classed('vis-selector', true)
            .html(`
        <div class="input-group">
          <div class="input-group-btn">
              <div class="btn-group vis-type">
              <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false"><i class="fas fa-chart-bar"></i><span class="caret"></span></button>
              <ul class="dropdown-menu">
                <!-- Insert visualizations here, e.g.:
                  <li><a href="#">Histogram</a></li>
                  <li><a href="#">Density Plot</a></li>
                -->
              </ul>
            </div>
            <div class="btn-group vis-config">
              <button type="button" class="btn btn-default dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false" disabled><i class="fas fa-cog"></i></button>
              <ul class="dropdown-menu">
                <!-- Insert options here, e.g.:
                  <li><a href="#">Show abs freq</a></li>
                  <li><a href="#">Show rel freq</a></li>
                -->
              </ul>
            </div>
          </div> <!-- dropdown buttons -->
          <input type="text" class="form-control title" aria-label="..." value="" style="height: unset; background-color: white; cursor: not-allowed;" readonly> <!-- value will be the title -->
        </div><!-- /input-group -->
    `);
    }
    async show1Attribute(attribute, cohorts) {
        this.attributes = [attribute];
        this.cohorts = cohorts;
        if (cohorts.length === 0) {
            this.$visContainer.innerHTML = '<p>Select one or more cohorts to see visualizations <i class="fas fa-chart-bar" aria-hidden="true"></i></p>';
        }
        else if (cohorts.length >= 1) {
            if (attribute.type === 'number') {
                const visualizations = [DensityPlot];
                if (attribute.id === 'days_to_death' || attribute.id === 'days_to_last_followup') {
                    visualizations.unshift(KaplanMeierPlot);
                }
                this.setVisualizations(visualizations);
            }
            else {
                this.setVisualizations([VegaGroupedHistogram]);
            }
        }
    }
    async show2Attributes(attributes, cohorts) {
        this.attributes = attributes;
        this.cohorts = cohorts;
        if (cohorts.length === 0) {
            this.$visContainer.innerHTML = '<p>Select one or more cohorts to see visualizations <i class="fas fa-chart-bar" aria-hidden="true"></i></p>';
        }
        else if (cohorts.length >= 1) {
            if (attributes.every((attr) => attr.type === 'number')) {
                const visualizations = [Scatterplot];
                if (attributes.every((attr) => ['days_to_death', 'days_to_last_followup'].includes(attr.id))) {
                    visualizations.unshift(KaplanMeierPlot);
                }
                this.setVisualizations(visualizations);
            }
            else if (attributes.every((attr) => attr.type === 'categorical')) {
                this.setVisualizations([TsneScatterplot, AreaChart]);
            }
            else if (attributes.some((attr) => attr.type === 'number') && attributes.some((attr) => attr.type === 'categorical')) {
                this.setVisualizations([GroupedBoxplot]);
            }
            else {
                this.$visContainer.innerHTML = 'What are you doing? ☠';
            }
        }
    }
    async showTsne(attributes, cohorts) {
        this.attributes = attributes;
        this.cohorts = cohorts;
        this.setVisualizations([TsneScatterplot]);
    }
    set title(title) {
        this.header.select('.vis-selector input.title').each(function () { this.value = title; });
    }
    setVisualizations(visualizations) {
        this.visualizations = visualizations;
        //Show the first one
        if (visualizations.length > 0) {
            this.showWithVis(new visualizations[0]());
            const entries = this.header.select('.vis-selector .vis-type ul.dropdown-menu')
                .selectAll('li').data(visualizations);
            entries.enter()
                .append('li')
                .append('a').text((vis) => vis.NAME) // cast to any to access static property
                .classed('selector', true)
                .classed('selected', (vis) => vis.NAME === this.vis.constructor.NAME)
                .on('click', (visClass) => {
                if (visClass.NAME !== this.vis.constructor.NAME) { //check if vis has changed
                    this.header.selectAll('.vis-selector .vis-type a.selector').classed('selected', (vis) => vis.NAME === visClass.NAME);
                    this.showWithVis(new visClass());
                }
            });
        }
    }
    async showWithVis(vis) {
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
        this.title = `${vis.constructor.NAME} of ${this.attributes.map((attr) => niceName(attr.label)).join(' & ')}`; // access static property from instance via constructor property
        try {
            await vis.show(this.$visContainer, this.attributes, this.cohorts);
            if (eventId !== this.eventID) { // remove the visualization if we changed it in the meantime
                vis.destroy();
            }
            else {
                //Show options
                const options = vis.getOptions();
                this.header.select('.vis-selector .vis-config button').attr('disabled', options.length === 0 ? true : null);
                const entries = this.header.select('.vis-selector .vis-config ul.dropdown-menu').selectAll('li').data(options);
                entries.enter()
                    .append('li')
                    .append('a').text((option) => option)
                    .classed('selector', true)
                    .classed('selected', (option) => vis.getOption() === option)
                    .on('click', (option) => {
                    vis.setOption(option);
                    this.header
                        .select('.vis-selector .vis-config ul.dropdown-menu')
                        .selectAll('li a')
                        .classed('selected', (option) => vis.getOption() === option);
                });
            }
            //remove loading
            if (this.$visContainer.contains(loading)) {
                loading.remove();
            }
        }
        catch (e) {
            let msg = 'Creating the visualization failed.';
            log.error(msg, e);
            //remove loading
            if (this.$visContainer.contains(loading)) {
                loading.remove();
            }
            let icon = `<i class="fa fa-times" aria-hidden="true"></i>`;
            if (e.message === 'Internal Server Error') {
                msg = 'Could not retrieve the data.';
                icon = `<i class="fa fa-hourglass-end" aria-hidden="true"></i>`;
            }
            this.$visContainer.insertAdjacentHTML('afterbegin', `
        <p>
          ${icon}
          ${msg}
        </p>
      `);
        }
    }
}
//# sourceMappingURL=Filter.js.map