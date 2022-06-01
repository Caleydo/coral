import * as aq from 'arquero';
import * as LineUpJS from 'lineupjs';
import { extractCombinations, extractSets, generateCombinations, renderUpSet } from '@upsetjs/bundle';
import { getCohortLabel } from '../../Cohort';
import { ServerColumnAttribute } from '../../data/Attribute';
import { getAnimatedLoadingText } from '../../util';
import { DATA_LABEL } from '../visualizations';
import { ATask } from './ATask';
import { colors } from '../../colors';
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
        if (cohorts.length >= 2) {
            this.$container = this.body
                .append('div')
                .classed('characterize-container', true)
                .node();
            this.$container.insertAdjacentElement('beforeend', getAnimatedLoadingText('data'));
            const attrCohort = cohorts[0];
            attributes = [
                new ServerColumnAttribute(attrCohort.idColumn.column, attrCohort.view, attrCohort.database, attrCohort.idColumn),
            ];
            this.ids = await this.getData(attributes, cohorts);
            if (eventId !== this.eventID) {
                return;
            }
            this.appendTable();
        }
    }
    appendTable() {
        this.$container.innerHTML = `
      <div class="upset-container">
      <div>
        <button class="btn btn-coral" id="meta">Compare by <i>Meta-Data</i></button>
        <button class="btn btn-coral" id="mutated">Compare by <i>AA Mutated</i></button>
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
            this.sendData(`cmp_meta`, this.ids);
        });
        this.appendUpset(this.$container.querySelector('div.upset-container'));
    }
    appendUpset(container) {
        const elems = this.getSetData(this.ids);
        const { sets, combinations } = extractCombinations(elems, ({ name, sets }) => sets, { type: 'intersection' });
        const sets2 = extractSets(elems, ({ name, sets }) => sets, {});
        const combinations2 = generateCombinations(sets2, { type: 'intersection', min: 2, empty: true, max: 2 });
        let selection = null;
        function onHover(set) {
            selection = set;
            rerender();
        }
        function rerender() {
            renderUpSet(container, {
                sets: sets2, combinations: combinations2,
                width: 800, height: 200,
                // title: 'Cohort Overlap',
                // description: 'Intersection of selected cohorts',
                // selection, onHover,
                exportButtons: false,
                setLabelAlignment: 'right',
                // setName: 'Size',
                color: colors.barColor
            });
        }
        rerender();
        // remove set size barchar
        container.querySelectorAll('g[data-upset="setaxis"]').forEach((d) => d.remove());
        container.querySelectorAll('text[class^="sBarTextStyle-upset"]').forEach((d) => d.remove());
        container.querySelectorAll('g[data-upset="sets"] rect[class^="fillPrimary-upset"]').forEach((d) => d.remove());
        // remove clipping of cohort labels
        container.querySelectorAll('text[class^="setTextStyle-upset"]').forEach((d) => d.removeAttribute('clip-path'));
    }
    getSetData(ids) {
        const setMap = new Map();
        const idList = ids.flat();
        idList.forEach((d) => {
            if (!setMap.has(d.tissuename)) {
                setMap.set(d.tissuename, [d.Cohort]);
            }
            else {
                setMap.get(d.tissuename).push(d.Cohort);
            }
        });
        const setArr = Array
            .from(setMap)
            .map(([key, value]) => ({ name: key, sets: value }));
        return setArr;
    }
    async sendData(endpoint, ids) {
        const response = await this.postData(`http://localhost:8444/${endpoint}/`, {
            exclude: ['tissuename', 'tdpid'],
            ids,
        });
        this.visualize(response);
    }
    async visualize(response) {
        this.reader = response.body.getReader();
        const decoder = new TextDecoder('utf-8');
        let first = true;
        while (true) {
            const { value, done } = await this.reader.read(); //variable names are important for destructuring
            if (done) {
                console.log('done');
                break;
            } // if done, value is undefined
            const response = decoder.decode(value);
            console.log('response', response);
            try {
                const responseData = JSON.parse(response);
                if (first) {
                    await this.createLineUp(responseData.importances); // await so its ready for the next response
                    first = false;
                }
                this.setProgress(responseData.trees);
                this.updateLineUp(responseData.importances);
            }
            catch (e) {
                console.error('could not read JSON data', e);
            }
        }
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
    setProgress(iteration) {
        this.progressBar.textContent = `${iteration}/${Characterize.TREES}`;
        this.progressBar.style.width = `${100 * iteration / Characterize.TREES}%`;
        if (iteration === Characterize.TREES) {
            this.progressBar.textContent = 'Done';
            this.fadeOutProgressBar();
        }
    }
    async fadeOutProgressBar(delay = 2500) {
        return setTimeout(() => {
            const wrapper = this.$container.querySelector('.progress-wrapper');
            wrapper.innerHTML = '';
        }, delay);
    }
    async createLineUp(data) {
        const builder = LineUpJS.builder(data);
        this.lineup = builder
            .column(LineUpJS.buildCategoricalColumn('attribute').label('Attribute').width(200))
            .column(LineUpJS.buildStringColumn('category').label('Category').width(200))
            .column(LineUpJS.buildNumberColumn('importance').label('Importance').width(150))
            .deriveColors()
            .ranking(LineUpJS.buildRanking()
            .supportTypes()
            .allColumns()
            .sortBy('Importance', 'desc')
            .groupBy('Attribute')
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
        this.dataProv.setData(importances);
    }
}
Characterize.TREES = 500;
//# sourceMappingURL=Characterize.js.map