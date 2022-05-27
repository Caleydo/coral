import * as aq from 'arquero';
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
        this._entityName = null;
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
    <div>
      <p>Differences in:</p>

      <input type="radio" name="cmp_data" value="Meta Information" checked>
      <label>Meta Information</label>

      <input disabled type="radio" name="cmp_data" value="Mutated State">
      <label">Mutated State</label>

      <input disabled type="radio" name="cmp_data" value="Mutaion Type">
      <label">Mutation Type</label>

      <p><button id="meta">Compare</button></p>

      <p><button id="stream">Stream</button><button id="cancel">cancel</button></p>

      <div class="output"></div>
    </div>
    `;
        this.$container.querySelector('button#meta').addEventListener('click', () => {
            this.$container
                .querySelector('.output')
                .insertAdjacentElement('beforeend', getAnimatedLoadingText('data'));
            this.sendData(this.ids);
        });
        this.$container.querySelector('button#stream').addEventListener('click', async () => {
            const response = await fetch('http://localhost:8444/');
            const body = response.body;
            const reader = body.getReader();
            const decoder = new TextDecoder('utf-8');
            while (true) {
                const { value, done } = await reader.read(); //variable names are important for destructuring
                console.log(decoder.decode(value));
                if (done)
                    break; // if done, value is undefined
            }
        });
    }
    async sendData(ids) {
        const response = await this.postData('http://localhost:8444/cmp_meta/', {
            exclude: ['tissuename', 'tdpid'],
            ids,
        });
        console.log('Request complete! response:', JSON.stringify(response));
        this.visualize(response);
    }
    visualize(response) {
        this.$container.querySelector('.output').innerHTML =
            'Response is here ' + JSON.stringify(response);
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
            body: JSON.stringify(data) // body data type must match "Content-Type" header
        });
        return response.json(); // parses JSON response into native JavaScript objects
    }
}
//# sourceMappingURL=Compadre.js.map