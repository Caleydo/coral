import * as aq from 'arquero';
import {Cohort, getCohortLabel} from '../../Cohort';
import {ICohort} from '../../CohortInterfaces';
import {IAttribute, ServerColumnAttribute} from '../../data/Attribute';
import {getCohortData} from '../../rest';
import {CohortColorSchema, getAnimatedLoadingText} from '../../util';
import {getIdTypeFromCohort} from '../../utilIdTypes';
import {DATA_LABEL} from '../visualizations';
import {ATask} from './ATask';

export class Characterize extends ATask {
  public label = `Characterize`;
  public id = `characterize`;
  public hasOutput = false;
  private eventID = 0;
  private _entityName: string = null;
  private ids: any[];
  private reader: ReadableStreamDefaultReader<Uint8Array>;

  supports(attributes: IAttribute[], cohorts: ICohort[]) {
    return cohorts.length >= 2;
  }

  showSearchBar() {
    return false;
  }

  async show(
    columnHeader: HTMLDivElement,
    container: HTMLDivElement,
    attributes: IAttribute[],
    cohorts: ICohort[]
  ) {
    super.show(columnHeader, container, attributes, cohorts);
    const eventId = ++this.eventID; // get new eventID, we will compare it with the field again to see if it is still up to date

    if (cohorts.length >= 2) {
      this.$container = this.body
        .append('div')
        .classed('characterize-container', true)
        .node();

      this.$container.insertAdjacentElement(
        'beforeend',
        getAnimatedLoadingText('data')
      );

      const attrCohort = (cohorts[0] as Cohort);
      attributes = [
        new ServerColumnAttribute(attrCohort.idColumn.column, attrCohort.view, attrCohort.database, attrCohort.idColumn),
      ];
      this.ids = await this.getData(attributes, cohorts as Cohort[]);

      if (eventId !== this.eventID) {
        return;
      }

      this.appendTable();
    }
  }

  appendTable() {
    this.$container.innerHTML = `
    <div>
      <p>Find Differences in:</p>

      <!--
      <input type="radio" name="cmp_data" value="Meta Information" checked>
      <label>Meta Information</label>

      <input disabled type="radio" name="cmp_data" value="Mutated State">
      <label">Mutated State</label>

      <input disabled type="radio" name="cmp_data" value="Mutaion Type">
      <label">Mutation Type</label>
      -->

      <div>
        <button class="btn btn-coral" id="meta">Compare by <i>Meta-Data</i></button>
        <button class="btn btn-coral" id="mutated">Compare by <i>AA Mutated</i></button>
        <button class="btn btn-coral" id="stop">Stop</button>
      </div>

      <div class="output"></div>
    </div>
    `;

    this.$container.querySelector('button#meta').addEventListener('click', () => {
      this.$container.querySelector('.output').innerHTML = '';
      this.$container.querySelector('.output')
        .insertAdjacentElement('beforeend', getAnimatedLoadingText('data'));
      this.sendData(`cmp_meta`, this.ids);
    });

    this.$container.querySelector('button#stop').addEventListener('click', () => this.reader?.cancel());
  }

  async sendData(endpoint, ids) {
    const response = await this.postData(
      `http://localhost:8444/${endpoint}/`, {
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
      if (done) { break; } // if done, value is undefined
      console.log(value);
      if (first) {
        this.$container.querySelector('.output').innerHTML = '';
        first = false;
      }
      this.$container.querySelector('.output').insertAdjacentHTML(
        'beforeend',
        `<p>Response is here <code>${JSON.stringify(decoder.decode(value))}</code></p>`
      );
    }
  }

  async getData(attributes: IAttribute[], cohorts: Cohort[]) {
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
            const labelTable = aq.table({[DATA_LABEL]: [getCohortLabel(cht)]});
            joinedData = joinedData.join_left(labelTable, (data, label) => true);
            resolve(joinedData.objects());
          } catch (e) {
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
      method: 'POST', // *GET, POST, PUT, DELETE, etc.
      mode: 'cors', // no-cors, *cors, same-origin
      cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
      credentials: 'same-origin', // include, *same-origin, omit
      headers: {
        'Content-Type': 'application/json'
        // 'Content-Type': 'application/x-www-form-urlencoded',
      },
      redirect: 'follow', // manual, *follow, error
      referrerPolicy: 'no-referrer', // no-referrer, *no-referrer-when-downgrade, origin, origin-when-cross-origin, same-origin, strict-origin, strict-origin-when-cross-origin, unsafe-url
     body: JSON.stringify(data) // body data type must match "Content-Type" header
    });
    return response;
  }
}
