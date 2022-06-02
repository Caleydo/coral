import * as aq from 'arquero';
import * as LineUpJS from 'lineupjs';
import tippy from 'tippy.js';
import { getCohortLabel } from '../../Cohort';
import { ServerColumnAttribute } from '../../data/Attribute';
import { getAnimatedLoadingText } from '../../util';
import { DATA_LABEL } from '../visualizations';
import { ATask } from './ATask';
export class Characterize extends ATask {
    constructor() {
        super(...arguments);
        this.label = `Characterize`;
        this.id = `characterize`;
        this.hasOutput = false;
        this.eventID = 0;
    }
    supports(attributes, cohorts) {
        return cohorts.length >= 2;
    }
    showSearchBar() {
        return false;
    }
    async show(columnHeader, container, attributes, cohorts) {
        super.show(columnHeader, container, attributes, cohorts);
        const eventId = ++this.eventID; // get new eventID, we will compare it with the field again to see if it is still up to date
        this.cohorts = cohorts;
        if (this.cohorts.length >= 2) {
            this.$container = this.body
                .append('div')
                .classed('characterize-container', true)
                .node();
            this.$container.insertAdjacentElement('beforeend', getAnimatedLoadingText('data'));
            const attrCohort = (this.cohorts[0]);
            attributes = [
                new ServerColumnAttribute(attrCohort.idColumn.column, attrCohort.view, attrCohort.database, attrCohort.idColumn),
            ];
            this.ids = await this.getData(attributes, this.cohorts);
            if (eventId !== this.eventID) {
                return;
            }
            this.createView();
        }
    }
    createView() {
        this.$container.innerHTML = `
      <div class="custom-upset-container"></div>
      <div>
        <h1>Cohort Differences</h1>
        <button class="btn btn-coral" id="meta">Compare by <i>Meta-Data</i></button>
        <button class="btn btn-coral" id="mutated">Compare by <i>AA Mutated</i></button>
        <input type="checkbox" id="exclude-attributes" checked> Exclude the cohorts' <span class="hint">defining attributes</span></input>
      </div>

      <div class="progress-wrapper"></div>

      <div class="lineup-container"></div>
    `;
        this.$container.querySelector('button#meta').addEventListener('click', () => {
            if (this.lineup) {
                this.lineup.destroy();
            }
            this.$container.querySelector('.lineup-container').innerHTML = '';
            this.addProgressBar();
            this.compare(`cmp_meta`, this.ids);
        });
        this.showOverlap(this.$container.querySelector('div.custom-upset-container'));
        this.setDefiningAttributeTooltip(this.$container.querySelector('.hint'));
    }
    showOverlap(container) {
        container.insertAdjacentHTML('beforeend', `
      <h1 style="display: inline">Overlap between Cohorts</h1>
    `); //in line to display "no overlap" note on the same line
        let localChtCopy = this.cohorts.slice();
        const aqData = this.ids.flat();
        const idsAndTheirCohorts = aq.from(aqData)
            .groupby('tissuename')
            .pivot('Cohort', 'Cohort');
        const intersections = new Map();
        let maxIntersection = 0;
        while (localChtCopy.length > 1) {
            const drawCht = localChtCopy.shift();
            for (const remainingCht of localChtCopy) {
                // To use copied code replace "data" with your own variable
                const { count } = idsAndTheirCohorts
                    .filter(aq.escape((d) => d[drawCht.label] !== undefined && d[remainingCht.label] !== undefined))
                    .count() // still a aq table
                    .object();
                intersections.set(`${drawCht.id}-${remainingCht.id}`, count);
                if (count > maxIntersection) {
                    maxIntersection = count;
                }
            }
        }
        if (maxIntersection === 0) { // still zero --> no intersection
            container.insertAdjacentHTML('beforeend', `Cohorts do not overlap.`);
        }
        else {
            localChtCopy = this.cohorts.slice();
            while (localChtCopy.length > 1) {
                const drawCht = localChtCopy.shift();
                for (const remainingCht of localChtCopy) {
                    const count = intersections.get(`${drawCht.id}-${remainingCht.id}`);
                    if (count > 0) {
                        container.insertAdjacentHTML('beforeend', `
              <div>
                <div class="cht-icon" style="background-color: ${drawCht.colorTaskView}"></div>
                <div class="cht-icon" style="background-color: ${remainingCht.colorTaskView}"></div>
                <div class="cht-intersect">
                  <div class="cht-intersect-bar" style="width: ${100 * count / maxIntersection}%"></div>
                  <div class="cht-intersect-label">&ensp;${count}</div>
                </div>
              </div>
            `);
                    }
                }
            }
        }
    }
    setDefiningAttributeTooltip(hintText) {
        const attributes = [];
        for (const cht of this.cohorts) {
            const bloodline = cht.getBloodline();
            // get all tasks from the bloodline
            // fist task is the one before the cohort
            let tasks = bloodline.filter((elem) => elem.elemType === 'task').map((elem) => elem.obj);
            // reverse order of tasks -> now the first element is the first task after root cohort
            tasks = tasks.reverse();
            tasks.forEach((task) => attributes.push(...task.attributes));
        }
        this.definingAttributes = attributes.filter((attr, i, arr) => arr.findIndex((attr2) => (attr2.id === attr.id)) === i // if there are multiple attributes with the same id, keep the first
        );
        const attributeList = this.definingAttributes
            .map((attr) => attr.label)
            .reduce((text, attr) => text + `<li>${attr}</li>`, '<ol style="margin: 0.25em; padding-right: 1em;">') + '</ol>';
        tippy(hintText, { content: attributeList });
    }
    async compare(endpoint, ids) {
        const response = await this.postData(`http://localhost:8444/${endpoint}/`, {
            exclude: ['tissuename', 'tdpid'],
            ids,
        });
        // start to read response stream
        this.reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let first = true;
        while (true) {
            const { value, done } = await this.reader.read(); //variable names are important for destructuring
            if (done) {
                console.log('the reader is done');
                this.setProgressDone();
                break; // if done, value is undefined --> skip the rest
            }
            const response = decoder.decode(value);
            // console.log('response', response);
            try {
                const responseData = JSON.parse(response);
                console.log(responseData.trees);
                this.setProgress(responseData.trees);
                if (first) {
                    await this.createLineUp(responseData.importances); // await so its ready for the next response
                    first = false;
                }
                else {
                    this.updateLineUp(responseData.importances);
                }
            }
            catch (e) {
                // console.error('could not read JSON data', e);
            }
        }
    }
    async createLineUp(data) {
        const builder = LineUpJS.builder(data);
        this.lineup = builder
            .column(LineUpJS.buildCategoricalColumn('attribute').label('Attribute').width(200))
            .column(LineUpJS.buildStringColumn('category').label('Category').width(200))
            .column(LineUpJS.buildNumberColumn('importance', [0, 1]).label('Importance').width(150))
            .deriveColors()
            .ranking(LineUpJS.buildRanking()
            .supportTypes()
            .allColumns()
            .sortBy('Importance', 'desc')
            // .groupBy('Attribute')
            .groupSortBy('Importance', 'desc'))
            .buildTaggle(this.$container.querySelector('.lineup-container'));
        this.dataProv = this.lineup.data;
        const children = this.lineup.data.getFirstRanking().children; // alternative: builder.buildData().getFirstRanking(),...
        children[children.length - 1].setFilter({
            filterMissing: true,
            min: 0.001,
            max: Infinity
        });
    }
    updateLineUp(importances) {
        var _a;
        (_a = this.dataProv) === null || _a === void 0 ? void 0 : _a.setData(importances);
    }
    addProgressBar() {
        const wrapper = this.$container.querySelector('.progress-wrapper');
        wrapper.innerHTML = '';
        wrapper.insertAdjacentHTML('beforeend', `
      <div class="progress-ctrl">
        <a class="run" role="button"><i class="fas fa-fw fa-stop-circle"></i></a>
      </div>
      <div  class="progress">
        <div class="progress-bar" role="progressbar">
          0/${Characterize.TREES}
        </div>
      </div>
    `);
        this.progressBar = wrapper.querySelector('.progress .progress-bar');
        wrapper
            .querySelector(('a.run'))
            .addEventListener('click', () => {
            var _a;
            (_a = this.reader) === null || _a === void 0 ? void 0 : _a.cancel();
            wrapper.querySelector('.progress-ctrl').remove();
            this.progressBar.textContent = 'Stopped';
            this.fadeOutProgressBar();
        });
    }
    setProgress(iteration, done = false) {
        this.progressBar.textContent = `${iteration}/${Characterize.TREES}`;
        this.progressBar.style.width = `${100 * iteration / Characterize.TREES}%`;
        if (iteration === Characterize.TREES) {
            this.setProgressDone();
        }
    }
    setProgressDone() {
        this.progressBar.textContent = 'Done';
        this.fadeOutProgressBar();
    }
    async fadeOutProgressBar(delay = 2500) {
        return setTimeout(() => {
            const wrapper = this.$container.querySelector('.progress-wrapper');
            wrapper.innerHTML = '';
        }, delay);
    }
    async getData(attributes, cohorts) {
        const dataPromises = cohorts
            .map((cht, chtIndex) => {
            const promise = new Promise(async (resolve, reject) => {
                const chtDataPromises = attributes.map((attr) => attr.getData(cht.dbId));
                try {
                    const chtData = await Promise.all(chtDataPromises); // array with one entry per attribute, which contains an array with one value for every item in the cohort
                    let joinedData = aq.from(chtData[0]);
                    for (let i = 1; i < chtData.length; i++) {
                        joinedData = joinedData.join_full(aq.from(chtData[i]));
                    }
                    const labelTable = aq.table({ [DATA_LABEL]: [getCohortLabel(cht)] });
                    joinedData = joinedData.join_left(labelTable, (data, label) => true);
                    resolve(joinedData.objects());
                }
                catch (e) {
                    reject(e);
                }
            });
            return promise;
        });
        const data = await Promise.all(dataPromises);
        return data;
    }
    // Example POST method implementation:
    async postData(url = '', data = {}) {
        // Default options are marked with *
        const response = await fetch(url, {
            method: 'POST',
            mode: 'cors',
            cache: 'no-cache',
            credentials: 'same-origin',
            headers: {
                'Content-Type': 'application/json'
                // 'Content-Type': 'application/x-www-form-urlencoded',
            },
            redirect: 'follow',
            referrerPolicy: 'no-referrer',
            body: JSON.stringify(data), // body data type must match "Content-Type" header
            //TODO abortController
        });
        return response;
    }
}
Characterize.TREES = 500;
//# sourceMappingURL=Characterize.js.map